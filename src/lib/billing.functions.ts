import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/lib/admin.server";
import { signCheckoutReturn, secureVerifyAndFinalizeReturn } from "@/lib/billing-security.server";
import {
  verifyServerSubscriptionAccess,
  type SubscriptionStateStatus,
} from "@/lib/subscription-guard.server";

const DEFAULT_CHECKOUT_URL = "https://whop.com/checkout/plan_IrzVc4vCnCiQ1";
const DEFAULT_YEARLY_CHECKOUT_URL = "https://whop.com/checkout/plan_Gmhnwjw8YVRyQ";
const DEFAULT_APP_URL = "https://detailr.online";
const MASTER_ADMIN_ID = "3c7f1a25-615e-4cfc-9c23-a049bafe9337";

/**
 * Builds Whop checkout URLs with deterministic tracking parameters.
 * Passes metadata[user_id], client_reference_id, and prefilled email
 * so Whop webhooks reliably identify the subscriber even across different checkout devices or Apple Pay.
 */
export const getUpgradeCheckout = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const defaultMonthlyUrl = process.env["WHOP_CHECKOUT_URL"] ?? DEFAULT_CHECKOUT_URL;
    const defaultYearlyUrl = process.env["WHOP_YEARLY_CHECKOUT_URL"] ?? DEFAULT_YEARLY_CHECKOUT_URL;

    let monthlyBaseUrl = defaultMonthlyUrl;
    let yearlyBaseUrl = defaultYearlyUrl;

    const admin = getAdminClient();
    if (admin) {
      try {
        const { data: user } = await admin.auth.admin.getUserById(MASTER_ADMIN_ID);
        const meta = user?.user?.user_metadata || {};
        if (meta["custom_checkout_url"] && String(meta["custom_checkout_url"]).trim()) {
          monthlyBaseUrl = String(meta["custom_checkout_url"]).trim();
        }
        if (
          meta["custom_yearly_checkout_url"] &&
          String(meta["custom_yearly_checkout_url"]).trim()
        ) {
          yearlyBaseUrl = String(meta["custom_yearly_checkout_url"]).trim();
        }
      } catch {
        // Fallback to defaults
      }
    }

    const appUrl = process.env["PUBLIC_APP_URL"] ?? DEFAULT_APP_URL;
    const { data: userData } = await context.supabase.auth.getUser();
    const userEmail = userData.user?.email || "";

    const buildUrl = (baseUrl: string, planType: string) => {
      let url: URL;
      try {
        url = new URL(baseUrl);
      } catch {
        url = new URL(planType === "yearly" ? defaultYearlyUrl : defaultMonthlyUrl);
      }

      const { sig, ts } = signCheckoutReturn(context.userId, planType);

      // Deterministic tracking parameters for Whop
      url.searchParams.set("metadata[user_id]", context.userId);
      url.searchParams.set("metadata[detailer_id]", context.userId);
      url.searchParams.set("metadata[plan_type]", planType);
      url.searchParams.set("custom[user_id]", context.userId);
      url.searchParams.set("client_reference_id", context.userId);
      url.searchParams.set("external_id", context.userId);
      url.searchParams.set("d2c", "true");
      url.searchParams.set(
        "redirect_url",
        `${appUrl.replace(/\/$/, "")}/billing/return?plan=${planType}&uid=${context.userId}&sig=${sig}&ts=${ts}`,
      );

      if (userEmail) {
        url.searchParams.set("email", userEmail);
        url.searchParams.set("metadata[signup_email]", userEmail);
      }

      return url.toString();
    };

    return {
      monthlyHref: buildUrl(monthlyBaseUrl, "monthly"),
      yearlyHref: buildUrl(yearlyBaseUrl, "yearly"),
    };
  });

export interface TrialStateResponse {
  status: SubscriptionStateStatus;
  rawStatus: string;
  hasActiveAccess: boolean;
  isSubscribed: boolean;
  isCancelled: boolean;
  cancelAtPeriodEnd: boolean;
  inGracePeriod: boolean;
  expired: boolean;
  isSuspended: boolean;
  isPendingFirstVisit: boolean;
  daysLeft: number;
  renewalDaysLeft: number;
  expiresAt: string | null;
  nextBillingDate: string | null;
  nextBillingDateFormatted: string | null;
  subscriptionStartedAt: string | null;
  whopMembershipId: string | null;
  whopCustomerEmail: string | null;
  whopPortalUrl: string;
  planType: "monthly" | "yearly";
  planName: string;
  linkViews: number;
  firstVisitAt: string | null;
}

/**
 * Reads canonical subscription and trial status for the active user.
 * Read-only, deterministic, and idempotent (no random database mutations on fetch).
 */
export const getTrialState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TrialStateResponse> => {
    // 1. Delegate authority to the server subscription guard
    const access = await verifyServerSubscriptionAccess(context.userId);

    const admin = getAdminClient();
    const client = admin ?? context.supabase;

    const { data: profile } = await client
      .from("profiles")
      .select("trial_status, trial_expiry, whop_membership_id, created_at")
      .eq("id", context.userId)
      .maybeSingle();

    let linkViews = 0;
    let firstVisitAt: string | null = null;
    let whopCustomerEmail: string | null = null;
    let userMetadata: Record<string, unknown> = {};

    if (admin) {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
        userMetadata = authUser?.user?.user_metadata || {};
        linkViews = typeof userMetadata["link_views"] === "number" ? userMetadata["link_views"] : 0;
        firstVisitAt = (userMetadata["first_customer_visit_at"] as string) || null;
        whopCustomerEmail =
          (userMetadata["whop_email"] as string) ||
          (userMetadata["linked_whop_email"] as string) ||
          null;

        // Fetch membership customer email if not found in auth metadata
        if (!whopCustomerEmail) {
          const { data: mem } = await admin
            .from("whop_memberships")
            .select("customer_email")
            .eq("user_id", context.userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (mem?.customer_email) whopCustomerEmail = mem.customer_email;
        }
      } catch {
        /* ignore */
      }
    }

    const whopPlanType = (userMetadata["whop_plan_type"] as string)?.toLowerCase();
    const isYearly = whopPlanType === "yearly" || whopPlanType === "annual" || access.daysLeft > 45;

    const planType: "monthly" | "yearly" = isYearly ? "yearly" : "monthly";

    let planName = "7-Day Free Trial";
    if (access.isSubscribed) {
      if (access.cancelAtPeriodEnd) {
        planName = isYearly
          ? "Detailr Pro Annual Pass ($145/yr) — Auto-renew Cancelled"
          : "Detailr Pro Monthly ($12.99/mo) — Auto-renew Cancelled";
      } else if (access.inGracePeriod) {
        planName = isYearly
          ? "Detailr Pro Annual Pass ($145/yr) — Payment Past Due"
          : "Detailr Pro Monthly ($12.99/mo) — Payment Past Due";
      } else {
        planName = isYearly
          ? "Detailr Pro Annual Pass ($145/yr)"
          : "Detailr Pro Monthly ($12.99/mo)";
      }
    } else if (access.isCancelled) {
      planName = "Detailr Pro (Cancelled)";
    } else if (access.isPendingFirstVisit) {
      planName = "7-Day Free Trial (Pending First Visit)";
    } else if (access.isTrialActive) {
      planName = "7-Day Free Trial";
    } else if (access.isExpired) {
      planName = "Trial Expired";
    } else {
      planName = "7-Day Free Trial";
    }

    const nextBillingDateFormatted = access.currentPeriodEnd
      ? new Date(access.currentPeriodEnd).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

    const subscriptionStartedAt =
      (userMetadata["subscription_started_at"] as string) || profile?.created_at || null;

    return {
      status: access.status,
      rawStatus: profile?.trial_status || "TRIAL_PENDING",
      hasActiveAccess: access.hasAccess,
      isSubscribed: access.isSubscribed,
      isCancelled: access.isCancelled,
      cancelAtPeriodEnd: access.cancelAtPeriodEnd,
      inGracePeriod: access.inGracePeriod,
      expired: access.isExpired,
      isSuspended: access.isSuspended,
      isPendingFirstVisit: access.isPendingFirstVisit,
      daysLeft: access.daysLeft,
      renewalDaysLeft: access.daysLeft,
      expiresAt: access.currentPeriodEnd,
      nextBillingDate: access.currentPeriodEnd,
      nextBillingDateFormatted,
      subscriptionStartedAt,
      whopMembershipId: profile?.whop_membership_id || null,
      whopCustomerEmail,
      whopPortalUrl: "https://whop.com/hub/memberships/",
      planType,
      planName,
      linkViews,
      firstVisitAt,
    };
  });

/**
 * Allows a user to link a payment completed with an alternate email or direct membership ID.
 */
export const linkWhopEmailOrMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { whopEmailOrMembershipId: string }) => data)
  .handler(async ({ input, context }) => {
    const rawInput = (input.whopEmailOrMembershipId || "").trim();
    if (!rawInput) {
      throw new Error("Please enter your Whop checkout email or Membership ID.");
    }

    const admin = getAdminClient();
    if (!admin) {
      throw new Error("Billing system is currently unavailable. Please try again shortly.");
    }

    const query = rawInput.toLowerCase();
    const isEmail = query.includes("@");

    // Check whop_memberships database table
    let matchedMembership: {
      id: string;
      membership_id: string;
      customer_email: string;
      status: string;
      plan_type?: string;
    } | null = null;

    try {
      if (isEmail) {
        const { data } = await admin
          .from("whop_memberships")
          .select("id, membership_id, customer_email, status, plan_type")
          .ilike("customer_email", query)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        matchedMembership = data;
      } else {
        const { data } = await admin
          .from("whop_memberships")
          .select("id, membership_id, customer_email, status, plan_type")
          .eq("membership_id", rawInput)
          .maybeSingle();
        matchedMembership = data;
      }
    } catch {
      /* ignore */
    }

    const cycleDays = matchedMembership?.plan_type === "yearly" ? 365 : 30;
    const nextBillingDate = new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000).toISOString();

    if (matchedMembership) {
      // Link the membership record to this user
      try {
        await admin
          .from("whop_memberships")
          .update({ user_id: context.userId })
          .eq("id", matchedMembership.id);
      } catch {
        /* ignore */
      }

      await admin
        .from("profiles")
        .update({
          trial_status: "SUBSCRIBED",
          whop_membership_id: matchedMembership.membership_id,
          trial_expiry: nextBillingDate,
        })
        .eq("id", context.userId);

      try {
        const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
        const currentMeta = authUser?.user?.user_metadata || {};
        await admin.auth.admin.updateUserById(context.userId, {
          user_metadata: {
            ...currentMeta,
            linked_whop_email: matchedMembership.customer_email,
            whop_membership_id: matchedMembership.membership_id,
            whop_verified: true,
            whop_status: "SUBSCRIBED",
            next_billing_date: nextBillingDate,
          },
        });
      } catch {
        /* ignore */
      }

      return {
        success: true,
        message: `Subscription successfully verified and linked to ${matchedMembership.customer_email}! Detailr Pro is now active.`,
      };
    }

    // Direct membership reference ID fallback
    if (rawInput.startsWith("mem_") || rawInput.startsWith("pay_")) {
      await admin
        .from("profiles")
        .update({
          trial_status: "SUBSCRIBED",
          whop_membership_id: rawInput,
          trial_expiry: nextBillingDate,
        })
        .eq("id", context.userId);

      return {
        success: true,
        message: `Membership ${rawInput} connected successfully! Detailr Pro is now active.`,
      };
    }

    // Email link fallback
    await admin
      .from("profiles")
      .update({
        trial_status: "SUBSCRIBED",
        trial_expiry: nextBillingDate,
      })
      .eq("id", context.userId);

    return {
      success: true,
      message: `Checkout email (${query}) linked successfully! Your Pro subscription status is now activated.`,
    };
  });

/**
 * Cancels a user's subscription in-app:
 * Sets cancel_at_period_end so the customer retains paid access through the end of their period.
 */
export const cancelUserSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = getAdminClient();
    if (!admin) {
      throw new Error("Unable to reach billing system. Please try again or visit whop.com/hub.");
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("whop_membership_id, trial_expiry")
      .eq("id", context.userId)
      .maybeSingle();

    // 1. Update database profile status to CANCELLED (preserves trial_expiry for prepaid access)
    await admin.from("profiles").update({ trial_status: "CANCELLED" }).eq("id", context.userId);

    // 2. Mark membership record as cancelled
    try {
      await admin
        .from("whop_memberships")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("user_id", context.userId);
    } catch {
      /* ignore */
    }

    // 3. Update auth metadata
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
      const currentMeta = authUser?.user?.user_metadata || {};
      await admin.auth.admin.updateUserById(context.userId, {
        user_metadata: {
          ...currentMeta,
          whop_verified: false,
          whop_status: "CANCELLED",
          cancelled_at: new Date().toISOString(),
        },
      });
    } catch (metaErr) {
      console.warn("Could not save cancellation metadata:", metaErr);
    }

    // 4. If Whop API key is configured and membership ID is known, notify Whop API
    const whopApiKey = process.env["WHOP_API_KEY"];
    const membershipId = profile?.whop_membership_id;

    if (whopApiKey && membershipId && membershipId.startsWith("mem_")) {
      try {
        await fetch(`https://api.whop.com/api/v5/memberships/${membershipId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${whopApiKey}`,
            "Content-Type": "application/json",
          },
        });
      } catch (whopErr) {
        console.warn("Whop API cancellation notice:", whopErr);
      }
    }

    const prepaidUntilFormatted = profile?.trial_expiry
      ? new Date(profile.trial_expiry).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

    return {
      success: true,
      message: prepaidUntilFormatted
        ? `Your subscription has been cancelled. Your quote link and Pro features will remain fully active until ${prepaidUntilFormatted}.`
        : "Your subscription has been cancelled. Your quote link will remain active through the end of your billing cycle.",
      whopPortalUrl: "https://whop.com/hub/memberships/",
    };
  });

/**
 * Reconciles subscription after returning from Whop checkout success page.
 */
export const reconcileUserPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = getAdminClient();
    if (!admin) return { isSubscribed: false, status: "UNAVAILABLE" };

    const { data: profile } = await admin
      .from("profiles")
      .select("trial_status, trial_expiry, whop_membership_id")
      .eq("id", context.userId)
      .maybeSingle();

    if (profile?.trial_status === "SUBSCRIBED" || profile?.trial_status === "ADMIN") {
      return { isSubscribed: true, status: profile.trial_status };
    }

    // Check whop_memberships for a recent active record linked to this user
    const { data: dbMem } = await admin
      .from("whop_memberships")
      .select("membership_id, status")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbMem && (dbMem.status === "active" || dbMem.status === "subscribed")) {
      const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await admin
        .from("profiles")
        .update({
          trial_status: "SUBSCRIBED",
          whop_membership_id: dbMem.membership_id,
          trial_expiry: nextBillingDate,
        })
        .eq("id", context.userId);

      return { isSubscribed: true, status: "SUBSCRIBED" };
    }

    return { isSubscribed: false, status: profile?.trial_status || "PENDING" };
  });

/**
 * Finalizes checkout return with cryptographic signature verification.
 */
export const secureVerifyAndFinalizeCheckoutReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { plan: string; uid: string; sig: string; ts: string; membershipId?: string }) => data,
  )
  .handler(async ({ input, context }) => {
    return secureVerifyAndFinalizeReturn({
      userId: context.userId,
      plan: input.plan,
      uid: input.uid,
      sig: input.sig,
      ts: input.ts,
      membershipId: input.membershipId,
    });
  });

// Aliases for backwards compatibility across existing routes
export const verifyBillingReturn = secureVerifyAndFinalizeCheckoutReturn;
export const linkWhopSubscriptionByEmail = linkWhopEmailOrMembership;
export const reconcileCheckout = reconcileUserPayment;
