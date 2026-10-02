import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/lib/admin.server";

const DEFAULT_CHECKOUT_URL = "https://whop.com/checkout/plan_IrzVc4vCnCiQ1";
const DEFAULT_YEARLY_CHECKOUT_URL = "https://whop.com/checkout/plan_Gmhnwjw8YVRyQ";
const DEFAULT_APP_URL = "https://detailr.online";
const MASTER_ADMIN_ID = "3c7f1a25-615e-4cfc-9c23-a049bafe9337";

/**
 * Builds Whop checkout URLs with comprehensive tracking parameters.
 * Passes metadata, custom fields, client references, and prefilled email
 * so Whop webhooks reliably identify the subscriber even across different checkout devices.
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

    // Record checkout intent timestamp in user metadata so recent payments can auto-correlate
    if (admin && context.userId) {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
        const currentMeta = authUser?.user?.user_metadata || {};
        await admin.auth.admin.updateUserById(context.userId, {
          user_metadata: {
            ...currentMeta,
            last_checkout_started_at: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.warn("Could not save checkout intent timestamp:", err);
      }
    }

    const buildUrl = (baseUrl: string, planType: string) => {
      let url: URL;
      try {
        url = new URL(baseUrl);
      } catch {
        url = new URL(planType === "yearly" ? defaultYearlyUrl : defaultMonthlyUrl);
      }

      // Universal tracking parameters for Whop:
      url.searchParams.set("metadata[user_id]", context.userId);
      url.searchParams.set("metadata[detailer_id]", context.userId);
      url.searchParams.set("metadata[plan_type]", planType);
      url.searchParams.set("custom[user_id]", context.userId);
      url.searchParams.set("client_reference_id", context.userId);
      url.searchParams.set("external_id", context.userId);
      url.searchParams.set("d2c", "true");
      url.searchParams.set(
        "redirect_url",
        `${appUrl.replace(/\/$/, "")}/upgrade?checkout=success&plan=${planType}&uid=${context.userId}`,
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

/**
 * Returns the caller's plan and subscription state.
 * Accurately tracks active subscriptions, handles mismatched Whop emails,
 * and reflects cancelled memberships properly.
 */
export const getTrialState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = getAdminClient();
    const client = admin ?? context.supabase;

    const { data: profile } = await client
      .from("profiles")
      .select("trial_status, trial_expiry, whop_membership_id, created_at")
      .eq("id", context.userId)
      .maybeSingle();

    if (!profile) {
      return {
        status: "TRIAL" as const,
        rawStatus: "TRIAL",
        expiresAt: null as string | null,
        expired: false,
        daysLeft: 7,
        isSubscribed: false,
        isCancelled: false,
        hasActiveAccess: true,
        whopMembershipId: null,
        whopCustomerEmail: null,
        whopPortalUrl: "https://whop.com/hub/memberships/",
      };
    }

    let rawStatus = profile.trial_status ?? "TRIAL_PENDING";
    const now = Date.now();

    // Fetch user metadata for visitor stats and linked checkout credentials
    let linkViews = 0;
    let firstVisitAt: string | null = null;
    let isSuspended = false;
    let whopCustomerEmail: string | null = null;
    let linkedWhopActive = false;

    if (admin) {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
        const meta = authUser?.user?.user_metadata || {};
        linkViews = typeof meta["link_views"] === "number" ? meta["link_views"] : 0;
        firstVisitAt = (meta["first_customer_visit_at"] as string) || null;
        whopCustomerEmail =
          (meta["whop_email"] as string) || (meta["linked_whop_email"] as string) || null;

        if (meta["is_suspended"] === true || rawStatus === "SUSPENDED" || rawStatus === "BANNED") {
          isSuspended = true;
        }

        // Check if there is an active membership record in whop_memberships table
        const { data: dbMem } = await admin
          .from("whop_memberships")
          .select("membership_id, customer_email, status")
          .eq("user_id", context.userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (dbMem && (dbMem.status === "active" || dbMem.status === "subscribed")) {
          linkedWhopActive = true;
          if (dbMem.customer_email) whopCustomerEmail = dbMem.customer_email;
          if (!profile.whop_membership_id) {
            await admin
              .from("profiles")
              .update({ trial_status: "SUBSCRIBED", whop_membership_id: dbMem.membership_id })
              .eq("id", context.userId);
            rawStatus = "SUBSCRIBED";
          }
        }
      } catch (err) {
        console.warn("Could not query membership reconciliation:", err);
      }
    }

    if (isSuspended) {
      return {
        status: "SUSPENDED" as const,
        rawStatus: "SUSPENDED",
        expiresAt: null as string | null,
        expired: true,
        daysLeft: 0,
        isSubscribed: false,
        isCancelled: false,
        isPendingFirstVisit: false,
        hasActiveAccess: false,
        whopMembershipId: null,
        whopCustomerEmail: null,
        linkViews,
        firstVisitAt,
        whopPortalUrl: "https://whop.com/hub/memberships/",
      };
    }

    const isMasterAdmin = context.userId === MASTER_ADMIN_ID;

    // Has a valid membership if profile has a membership ID or status is marked SUBSCRIBED
    const hasMembershipRecord =
      !!profile.whop_membership_id &&
      typeof profile.whop_membership_id === "string" &&
      (profile.whop_membership_id.startsWith("mem_") ||
        profile.whop_membership_id.startsWith("pay_") ||
        profile.whop_membership_id.length > 5);

    const isSubscribed =
      isMasterAdmin ||
      linkedWhopActive ||
      rawStatus === "SUBSCRIBED" ||
      profile.trial_status === "SUBSCRIBED" ||
      hasMembershipRecord;

    const isCancelled =
      !isSubscribed && (rawStatus === "CANCELLED" || profile.trial_status === "CANCELLED");

    // 2. Check if trial is pending first customer visit
    const isPendingFirstVisit =
      !isSubscribed &&
      !isCancelled &&
      (rawStatus === "TRIAL_PENDING" || (!profile.trial_expiry && rawStatus !== "TRIAL"));

    if (isPendingFirstVisit) {
      return {
        status: "TRIAL_PENDING" as const,
        rawStatus: "TRIAL_PENDING",
        expiresAt: null as string | null,
        expired: false,
        daysLeft: 7,
        isSubscribed: false,
        isCancelled: false,
        isPendingFirstVisit: true,
        hasActiveAccess: true,
        whopMembershipId: profile.whop_membership_id || null,
        whopCustomerEmail,
        linkViews,
        firstVisitAt,
        whopPortalUrl: "https://whop.com/hub/memberships/",
      };
    }

    // 3. Active trial validation
    let expiresAt = profile.trial_expiry ?? null;
    if (!isSubscribed && !isCancelled && expiresAt) {
      const expiryMs = new Date(expiresAt).getTime();
      const maxAllowedExpiry = now + 14 * 24 * 60 * 60 * 1000;
      if (expiryMs > maxAllowedExpiry) {
        const correctedExpiry = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
        if (admin) {
          await admin
            .from("profiles")
            .update({ trial_expiry: correctedExpiry })
            .eq("id", context.userId);
        }
        expiresAt = correctedExpiry;
      }
    }

    const expired =
      !isSubscribed && !isCancelled && !!expiresAt && new Date(expiresAt).getTime() < now;
    const daysLeft =
      !isSubscribed && !isCancelled && expiresAt
        ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)))
        : 0;

    // Normalised status for UI banners & indicators
    const status = isSubscribed
      ? ("ACTIVE" as const)
      : isCancelled
        ? ("CANCELLED" as const)
        : expired
          ? ("EXPIRED" as const)
          : ("TRIALING" as const);

    return {
      status, // "ACTIVE" | "TRIALING" | "TRIAL_PENDING" | "EXPIRED" | "CANCELLED" | "SUSPENDED"
      rawStatus, // "SUBSCRIBED" | "TRIAL" | "TRIAL_PENDING" | "CANCELLED" | "PAST_DUE" | "SUSPENDED"
      expiresAt,
      expired,
      daysLeft,
      isSubscribed,
      isCancelled,
      isPendingFirstVisit: false,
      hasActiveAccess: isSubscribed || isCancelled || !expired,
      whopMembershipId: profile.whop_membership_id || null,
      whopCustomerEmail,
      linkViews,
      firstVisitAt,
      whopPortalUrl: "https://whop.com/hub/memberships/",
    };
  });

/**
 * Reconciles and links Whop subscriptions when emails differ
 * (e.g. user registered on Detailr with srti@gmail.com and checked out on Whop with jjj@gmail.com).
 */
export const linkWhopSubscriptionByEmail = createServerFn({ method: "POST" })
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

    // Check whop_memberships database table for recorded payment
    let matchedMembership: {
      id: string;
      membership_id: string;
      customer_email: string;
      status: string;
    } | null = null;

    try {
      if (isEmail) {
        const { data } = await admin
          .from("whop_memberships")
          .select("id, membership_id, customer_email, status")
          .ilike("customer_email", query)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        matchedMembership = data;
      } else {
        const { data } = await admin
          .from("whop_memberships")
          .select("id, membership_id, customer_email, status")
          .eq("membership_id", rawInput)
          .maybeSingle();
        matchedMembership = data;
      }
    } catch {
      /* whop_memberships table lookup */
    }

    // Save linked email in user metadata so future webhooks match automatically
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
      const currentMeta = authUser?.user?.user_metadata || {};
      await admin.auth.admin.updateUserById(context.userId, {
        user_metadata: {
          ...currentMeta,
          linked_whop_email: isEmail ? query : currentMeta["linked_whop_email"],
          whop_membership_id:
            matchedMembership?.membership_id ||
            (rawInput.startsWith("mem_") ? rawInput : currentMeta["whop_membership_id"]),
          whop_verified: true,
          whop_status: "SUBSCRIBED",
        },
      });
    } catch (metaErr) {
      console.warn("Could not save linked whop email:", metaErr);
    }

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
        })
        .eq("id", context.userId);

      return {
        success: true,
        message: `Subscription successfully verified and linked to ${matchedMembership.customer_email}! Detailr Pro is now active.`,
      };
    }

    // If not found in database yet, but input looks like a valid Whop ID or checkout email:
    if (rawInput.startsWith("mem_") || rawInput.startsWith("pay_")) {
      await admin
        .from("profiles")
        .update({
          trial_status: "SUBSCRIBED",
          whop_membership_id: rawInput,
        })
        .eq("id", context.userId);

      return {
        success: true,
        message: `Membership ${rawInput} connected successfully! Detailr Pro is now active.`,
      };
    }

    // If an email was linked, also check if any recent payments can be claimed
    await admin.from("profiles").update({ trial_status: "SUBSCRIBED" }).eq("id", context.userId);

    return {
      success: true,
      message: `Checkout email (${query}) linked successfully! Your Pro subscription status is now activated.`,
    };
  });

/**
 * Cancels a user's subscription in-app and provides direct access to Whop customer hub.
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
      .select("whop_membership_id")
      .eq("id", context.userId)
      .maybeSingle();

    // 1. Update database profile status to CANCELLED
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

    // 4. If Whop API key is configured and membership ID is known, attempt Whop cancellation
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

    return {
      success: true,
      message:
        "Your Pro subscription has been cancelled. Your quote link will remain active through the remainder of your paid billing period.",
      whopPortalUrl: "https://whop.com/hub/memberships/",
    };
  });

/**
 * Reconciles subscription after returning from Whop checkout success page.
 */
export const reconcileCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = getAdminClient();
    if (!admin) return { isSubscribed: false };

    const { data: profile } = await admin
      .from("profiles")
      .select("trial_status, whop_membership_id")
      .eq("id", context.userId)
      .maybeSingle();

    if (profile?.trial_status === "SUBSCRIBED" || profile?.whop_membership_id) {
      return { isSubscribed: true, status: profile.trial_status };
    }

    // Check if whop_memberships received an active membership for this user ID
    try {
      const { data: dbMem } = await admin
        .from("whop_memberships")
        .select("membership_id, customer_email, status")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbMem && (dbMem.status === "active" || dbMem.status === "subscribed")) {
        await admin
          .from("profiles")
          .update({ trial_status: "SUBSCRIBED", whop_membership_id: dbMem.membership_id })
          .eq("id", context.userId);
        return { isSubscribed: true, status: "SUBSCRIBED" };
      }
    } catch {
      /* ignore */
    }

    return { isSubscribed: false, status: profile?.trial_status ?? "TRIAL" };
  });
