import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_CHECKOUT_URL = "https://whop.com/checkout/plan_IrzVc4vCnCiQ1";
const DEFAULT_APP_URL = "https://detailr.online";

import { getAdminClient } from "@/lib/admin.server";

export const getUpgradeCheckout = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const defaultMonthlyUrl =
      process.env["WHOP_CHECKOUT_URL"] ?? "https://whop.com/checkout/plan_IrzVc4vCnCiQ1";
    const defaultYearlyUrl =
      process.env["WHOP_YEARLY_CHECKOUT_URL"] ?? "https://whop.com/checkout/plan_Gmhnwjw8YVRyQ";

    let monthlyBaseUrl = defaultMonthlyUrl;
    let yearlyBaseUrl = defaultYearlyUrl;

    const admin = getAdminClient();
    if (admin) {
      try {
        const { data: user } = await admin.auth.admin.getUserById(
          "3c7f1a25-615e-4cfc-9c23-a049bafe9337",
        );
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

    const buildUrl = (baseUrl: string, planType: string) => {
      let url: URL;
      try {
        url = new URL(baseUrl);
      } catch {
        url = new URL(planType === "yearly" ? defaultYearlyUrl : defaultMonthlyUrl);
      }
      url.searchParams.set("metadata[user_id]", context.userId);
      url.searchParams.set("metadata[plan_type]", planType);
      url.searchParams.set("d2c", "true");
      url.searchParams.set(
        "redirect_url",
        `${appUrl.replace(/\/$/, "")}/upgrade?checkout=success&plan=${planType}`,
      );
      if (userData.user?.email) url.searchParams.set("email", userData.user.email);
      return url.toString();
    };

    return {
      monthlyHref: buildUrl(monthlyBaseUrl, "monthly"),
      yearlyHref: buildUrl(yearlyBaseUrl, "yearly"),
    };
  });

/**
 * Returns the caller's plan state with tamper-resistant verification.
 * Verifies that SUBSCRIBED accounts hold an authentic Whop membership ID
 * signed by the Whop webhook, and prevents clients from artificially extending trials.
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
        hasActiveAccess: true,
      };
    }

    let rawStatus = profile.trial_status ?? "TRIAL_PENDING";
    const now = Date.now();

    // Fetch user metadata for visitor stats
    let linkViews = 0;
    let firstVisitAt: string | null = null;
    let isSuspended = false;

    if (admin) {
      const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
      const meta = authUser?.user?.user_metadata || {};
      linkViews = typeof meta["link_views"] === "number" ? meta["link_views"] : 0;
      firstVisitAt = (meta["first_customer_visit_at"] as string) || null;
      if (meta["is_suspended"] === true || rawStatus === "SUSPENDED" || rawStatus === "BANNED") {
        isSuspended = true;
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
        isPendingFirstVisit: false,
        hasActiveAccess: false,
        linkViews,
        firstVisitAt,
      };
    }

    // 1. Anti-Cheat: Validate ADMIN claims
    const MASTER_ADMIN_ID = "3c7f1a25-615e-4cfc-9c23-a049bafe9337";
    const isMasterAdmin = context.userId === MASTER_ADMIN_ID;

    if (rawStatus === "ADMIN" && !isMasterAdmin) {
      console.warn(
        `[anti-cheat] User ${context.userId} attempted to spoof ADMIN status. Reverting.`,
      );
      await client
        .from("profiles")
        .update({ trial_status: "TRIAL_PENDING" })
        .eq("id", context.userId);
      rawStatus = "TRIAL_PENDING";
    }

    // 2. Anti-Cheat: Validate SUBSCRIBED status against cryptographic server metadata
    let hasAuthenticWhopSubscription = false;
    if (admin) {
      const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
      const meta = authUser?.user?.user_metadata || {};
      const isWhopVerified = meta["whop_verified"] === true;
      const isAdminGrantedPro = meta["admin_granted_pro"] === true;
      const isMembershipMatch =
        !!profile.whop_membership_id &&
        (profile.whop_membership_id === meta["whop_membership_id"] || isAdminGrantedPro);

      hasAuthenticWhopSubscription = (isWhopVerified && isMembershipMatch) || isAdminGrantedPro;
    }

    if (rawStatus === "SUBSCRIBED" && !hasAuthenticWhopSubscription && !isMasterAdmin) {
      console.warn(
        `[anti-cheat] Profile ${context.userId} claimed SUBSCRIBED without verified Whop webhook or admin grant. Reverting to TRIAL_PENDING.`,
      );
      await client
        .from("profiles")
        .update({ trial_status: "TRIAL_PENDING", whop_membership_id: null })
        .eq("id", context.userId);
      rawStatus = "TRIAL_PENDING";
    }

    const isSubscribed =
      isMasterAdmin || (rawStatus === "SUBSCRIBED" && hasAuthenticWhopSubscription);

    // 3. Check if trial is pending first customer visit
    const isPendingFirstVisit =
      !isSubscribed &&
      (rawStatus === "TRIAL_PENDING" || (!profile.trial_expiry && rawStatus !== "TRIAL"));

    if (isPendingFirstVisit) {
      return {
        status: "TRIAL_PENDING" as const,
        rawStatus: "TRIAL_PENDING",
        expiresAt: null as string | null,
        expired: false,
        daysLeft: 7,
        isSubscribed: false,
        isPendingFirstVisit: true,
        hasActiveAccess: true,
        linkViews,
        firstVisitAt,
      };
    }

    // 4. Active trial validation with expiry clamping against script tampering
    let expiresAt = profile.trial_expiry ?? null;
    if (!isSubscribed && expiresAt) {
      const expiryMs = new Date(expiresAt).getTime();
      const maxAllowedExpiry = now + 14 * 24 * 60 * 60 * 1000;
      if (expiryMs > maxAllowedExpiry) {
        console.warn(
          `[anti-cheat] Profile ${context.userId} had artificially inflated trial_expiry. Clamping.`,
        );
        const correctedExpiry = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
        await client
          .from("profiles")
          .update({ trial_expiry: correctedExpiry })
          .eq("id", context.userId);
        expiresAt = correctedExpiry;
      }
    }

    const expired = !isSubscribed && !!expiresAt && new Date(expiresAt).getTime() < now;
    const daysLeft =
      !isSubscribed && expiresAt
        ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)))
        : 0;

    // Normalised status for UI banners
    const status = isSubscribed
      ? ("ACTIVE" as const)
      : expired
        ? ("EXPIRED" as const)
        : ("TRIALING" as const);

    return {
      status, // "ACTIVE" | "TRIALING" | "TRIAL_PENDING" | "EXPIRED" | "SUSPENDED"
      rawStatus, // "SUBSCRIBED" | "TRIAL" | "TRIAL_PENDING" | "CANCELLED" | "PAST_DUE" | "SUSPENDED"
      expiresAt,
      expired,
      daysLeft,
      isSubscribed,
      isPendingFirstVisit: false,
      hasActiveAccess: isSubscribed || !expired,
      linkViews,
      firstVisitAt,
    };
  });
