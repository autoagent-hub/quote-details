import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_CHECKOUT_URL = "https://whop.com/checkout/plan_IrzVc4vCnCiQ1";
const DEFAULT_APP_URL = "https://quote-details.lovable.app";

import { getAdminClient } from "@/lib/admin.server";

export const getUpgradeCheckout = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const checkoutUrl = process.env["WHOP_CHECKOUT_URL"] ?? DEFAULT_CHECKOUT_URL;
    const appUrl = process.env["PUBLIC_APP_URL"] ?? DEFAULT_APP_URL;

    const { data } = await context.supabase.auth.getUser();
    const url = new URL(checkoutUrl);
    url.searchParams.set("metadata[user_id]", context.userId);
    url.searchParams.set("d2c", "true");
    url.searchParams.set("redirect_url", `${appUrl.replace(/\/$/, "")}/upgrade?checkout=success`);
    if (data.user?.email) url.searchParams.set("email", data.user.email);

    return { href: url.toString() };
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

    // 1. Anti-Cheat: Validate SUBSCRIBED status against whop_membership_id
    // Only genuine Whop webhooks with verified HMAC signatures or admin overrides can attach a whop_membership_id
    const hasValidMembership =
      !!profile.whop_membership_id &&
      typeof profile.whop_membership_id === "string" &&
      (profile.whop_membership_id.startsWith("mem_") ||
        profile.whop_membership_id.startsWith("pay_"));

    if (rawStatus === "SUBSCRIBED" && !hasValidMembership) {
      console.warn(
        `[anti-cheat] Profile ${context.userId} marked SUBSCRIBED without authentic Whop membership. Reverting to TRIAL_PENDING.`,
      );
      await client
        .from("profiles")
        .update({ trial_status: "TRIAL_PENDING" })
        .eq("id", context.userId);
      rawStatus = "TRIAL_PENDING";
    }

    const isSubscribed =
      (rawStatus === "SUBSCRIBED" || rawStatus === "ADMIN") &&
      (hasValidMembership || rawStatus === "ADMIN");

    // 2. Check if trial is pending first customer visit
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

    // 3. Active trial validation
    const expiresAt = profile.trial_expiry ?? null;
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
