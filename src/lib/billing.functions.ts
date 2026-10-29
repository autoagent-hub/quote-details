import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/lib/admin.server";
import {
  verifyServerSubscriptionAccess,
  type SubscriptionStateStatus,
} from "@/lib/subscription-guard.server";

export const getUpgradeCheckout = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return {
      monthlyHref: "/upgrade",
      yearlyHref: "/upgrade",
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
  creditsBalance: number;
}

export const getTrialState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TrialStateResponse> => {
    const access = await verifyServerSubscriptionAccess(context.userId);

    const admin = getAdminClient();
    const client = admin ?? context.supabase;

    const { data: profile } = await client
      .from("profiles")
      .select("trial_status, trial_expiry, created_at, credits_balance")
      .eq("id", context.userId)
      .maybeSingle();

    const creditsBalance =
      typeof (profile as { credits_balance?: number })?.credits_balance === "number"
        ? (profile as { credits_balance?: number }).credits_balance!
        : 50;

    let linkViews = 0;
    let firstVisitAt: string | null = null;
    let userEmail: string | null = null;

    if (admin) {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
        const userMetadata = authUser?.user?.user_metadata || {};
        userEmail = authUser?.user?.email || null;
        linkViews = typeof userMetadata["link_views"] === "number" ? userMetadata["link_views"] : 0;
        firstVisitAt = (userMetadata["first_customer_visit_at"] as string) || null;
      } catch {
        /* ignore */
      }
    }

    const planName = "Detailr Pay-As-You-Go Credits & 7-Day Free Trial";

    const formattedNextBilling = access.currentPeriodEnd
      ? new Date(access.currentPeriodEnd).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : access.isTrialActive
        ? `${access.daysLeft} days remaining`
        : "Pay-As-You-Go Credits";

    return {
      status: access.status,
      rawStatus: profile?.trial_status || "TRIAL_PENDING",
      hasActiveAccess: access.hasAccess,
      isSubscribed: access.isSubscribed,
      isCancelled: false,
      cancelAtPeriodEnd: false,
      inGracePeriod: false,
      expired: access.isExpired,
      isSuspended: access.isSuspended,
      isPendingFirstVisit: access.isPendingFirstVisit,
      daysLeft: access.daysLeft,
      renewalDaysLeft: access.daysLeft,
      expiresAt: access.currentPeriodEnd,
      nextBillingDate: access.currentPeriodEnd,
      nextBillingDateFormatted: formattedNextBilling,
      subscriptionStartedAt: profile?.created_at || null,
      whopMembershipId: null,
      whopCustomerEmail: userEmail,
      whopPortalUrl: "/upgrade",
      planType: "monthly",
      planName,
      linkViews,
      firstVisitAt,
      creditsBalance,
    };
  });

export const cancelUserSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return {
      success: true,
      message: "Detailr operates on pay-as-you-go credits. There are no recurring auto-renewals to cancel.",
    };
  });

export const reconcileCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return { isSubscribed: true, message: "Pay-as-you-go credit billing active." };
  });
