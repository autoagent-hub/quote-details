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
      monthlyHref: "#",
      yearlyHref: "#",
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

export const getTrialState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TrialStateResponse> => {
    const access = await verifyServerSubscriptionAccess(context.userId);

    const admin = getAdminClient();
    const client = admin ?? context.supabase;

    const { data: profile } = await client
      .from("profiles")
      .select("trial_status, trial_expiry, created_at")
      .eq("id", context.userId)
      .maybeSingle();

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

    const planName = "Detailr Pro Unlimited";

    return {
      status: access.status,
      rawStatus: profile?.trial_status || "ACTIVE",
      hasActiveAccess: access.hasAccess,
      isSubscribed: true,
      isCancelled: false,
      cancelAtPeriodEnd: false,
      inGracePeriod: false,
      expired: false,
      isSuspended: access.isSuspended,
      isPendingFirstVisit: false,
      daysLeft: 365,
      renewalDaysLeft: 365,
      expiresAt: null,
      nextBillingDate: null,
      nextBillingDateFormatted: "Lifetime / Unlimited Access",
      subscriptionStartedAt: profile?.created_at || null,
      whopMembershipId: null,
      whopCustomerEmail: userEmail,
      whopPortalUrl: "#",
      planType: "yearly",
      planName,
      linkViews,
      firstVisitAt,
    };
  });

export const cancelUserSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return { success: true, message: "Subscription active." };
  });

export const reconcileCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return { isSubscribed: true, message: "Subscription is active." };
  });
