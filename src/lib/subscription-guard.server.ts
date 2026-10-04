import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/lib/admin.server";
import { supabase } from "@/integrations/supabase/client";

const MASTER_ADMIN_ID = "3c7f1a25-615e-4cfc-9c23-a049bafe9337";
const GRACE_PERIOD_HOURS = 72; // 3-day grace period for failed renewal charges

export type SubscriptionStateStatus =
  | "ACTIVE"
  | "CANCEL_AT_PERIOD_END"
  | "PAST_DUE"
  | "TRIALING"
  | "TRIAL_PENDING"
  | "EXPIRED"
  | "SUSPENDED";

export interface SubscriptionAccessResult {
  hasAccess: boolean;
  isSubscribed: boolean;
  isCancelled: boolean;
  cancelAtPeriodEnd: boolean;
  inGracePeriod: boolean;
  isTrialActive: boolean;
  isPendingFirstVisit: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  daysLeft: number;
  currentPeriodEnd: string | null;
  reason?: string;
  status: SubscriptionStateStatus;
}

/**
 * Validates a user's subscription access directly against the database on the server.
 * Standard SaaS state machine:
 * - ACTIVE: Active paid subscription with auto-renew.
 * - CANCEL_AT_PERIOD_END: Auto-renew disabled, but prepaid period is still valid -> HAS ACCESS.
 * - PAST_DUE: Payment failed, but within 72-hour grace period -> HAS ACCESS.
 * - TRIALING: Free trial active before expiry -> HAS ACCESS.
 * - TRIAL_PENDING: Free trial pending first customer visit -> HAS ACCESS.
 * - EXPIRED: Trial or prepaid period ended with no active renewal -> NO ACCESS.
 * - SUSPENDED: Administrative restriction -> NO ACCESS.
 */
export async function verifyServerSubscriptionAccess(
  userId: string,
): Promise<SubscriptionAccessResult> {
  if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return {
      hasAccess: false,
      isSubscribed: false,
      isCancelled: false,
      cancelAtPeriodEnd: false,
      inGracePeriod: false,
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: true,
      isSuspended: false,
      daysLeft: 0,
      currentPeriodEnd: null,
      reason: "Invalid user identifier.",
      status: "EXPIRED",
    };
  }

  // Master Admin has permanent bypass
  if (userId === MASTER_ADMIN_ID) {
    return {
      hasAccess: true,
      isSubscribed: true,
      isCancelled: false,
      cancelAtPeriodEnd: false,
      inGracePeriod: false,
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: false,
      isSuspended: false,
      daysLeft: 365,
      currentPeriodEnd: null,
      status: "ACTIVE",
    };
  }

  const admin = getAdminClient();
  const db = admin ?? supabase;

  // 1. Fetch profile record from database
  const { data: profile, error } = await db
    .from("profiles")
    .select("trial_status, trial_expiry, whop_membership_id, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return {
      hasAccess: false,
      isSubscribed: false,
      isCancelled: false,
      cancelAtPeriodEnd: false,
      inGracePeriod: false,
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: true,
      isSuspended: false,
      daysLeft: 0,
      currentPeriodEnd: null,
      reason: "Shop profile does not exist.",
      status: "EXPIRED",
    };
  }

  const rawStatus = (profile.trial_status || "TRIAL_PENDING").toUpperCase();
  const now = Date.now();

  // 2. Check suspension or ban in auth metadata or profile
  let isSuspended = rawStatus === "SUSPENDED" || rawStatus === "BANNED";
  let userMeta: Record<string, unknown> = {};
  if (admin) {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      userMeta = authUser?.user?.user_metadata || {};
      if (userMeta["is_suspended"] === true) {
        isSuspended = true;
      }
    } catch {
      /* ignore */
    }
  }

  if (isSuspended) {
    return {
      hasAccess: false,
      isSubscribed: false,
      isCancelled: false,
      cancelAtPeriodEnd: false,
      inGracePeriod: false,
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: true,
      isSuspended: true,
      daysLeft: 0,
      currentPeriodEnd: null,
      reason: "This account has been restricted by administration.",
      status: "SUSPENDED",
    };
  }

  // 3. Check for active subscription in whop_memberships table
  let hasActiveWhopRecord = false;
  let whopRecordStatus: string | null = null;
  if (admin) {
    try {
      const { data: whopMem } = await admin
        .from("whop_memberships")
        .select("status, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (whopMem) {
        whopRecordStatus = whopMem.status?.toLowerCase() || null;
        if (whopRecordStatus === "active" || whopRecordStatus === "subscribed") {
          hasActiveWhopRecord = true;
        }
      }
    } catch {
      /* ignore */
    }
  }

  const hasAuthenticMembershipId =
    !!profile.whop_membership_id &&
    typeof profile.whop_membership_id === "string" &&
    (profile.whop_membership_id.startsWith("mem_") ||
      profile.whop_membership_id.startsWith("pay_") ||
      profile.whop_membership_id.length > 5);

  const expiryTimestamp = profile.trial_expiry ? new Date(profile.trial_expiry).getTime() : null;
  const isPeriodEndInFuture = !!expiryTimestamp && expiryTimestamp > now;
  const daysLeftOnPeriod = expiryTimestamp
    ? Math.max(0, Math.ceil((expiryTimestamp - now) / (1000 * 60 * 60 * 24)))
    : 0;

  // 4. ACTIVE PAID SUBSCRIPTION
  const isDirectlySubscribed =
    rawStatus === "SUBSCRIBED" ||
    rawStatus === "ADMIN" ||
    userMeta["whop_status"] === "SUBSCRIBED" ||
    userMeta["whop_verified"] === true ||
    userMeta["trial_status"] === "SUBSCRIBED" ||
    hasActiveWhopRecord;

  if (isDirectlySubscribed) {
    return {
      hasAccess: true,
      isSubscribed: true,
      isCancelled: false,
      cancelAtPeriodEnd: false,
      inGracePeriod: false,
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: false,
      isSuspended: false,
      daysLeft: daysLeftOnPeriod > 0 ? daysLeftOnPeriod : 30,
      currentPeriodEnd: profile.trial_expiry || null,
      status: "ACTIVE",
    };
  }

  // 5. CANCELLED SUBSCRIPTION (Grace period through prepaid period end)
  if (rawStatus === "CANCELLED" || whopRecordStatus === "cancelled") {
    // If the prepaid period has not yet elapsed, keep full active access!
    if (isPeriodEndInFuture) {
      return {
        hasAccess: true,
        isSubscribed: true,
        isCancelled: true,
        cancelAtPeriodEnd: true,
        inGracePeriod: false,
        isTrialActive: false,
        isPendingFirstVisit: false,
        isExpired: false,
        isSuspended: false,
        daysLeft: daysLeftOnPeriod,
        currentPeriodEnd: profile.trial_expiry,
        status: "CANCEL_AT_PERIOD_END",
      };
    }

    // Period has elapsed: access is revoked
    return {
      hasAccess: false,
      isSubscribed: false,
      isCancelled: true,
      cancelAtPeriodEnd: false,
      inGracePeriod: false,
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: true,
      isSuspended: false,
      daysLeft: 0,
      currentPeriodEnd: profile.trial_expiry || null,
      reason:
        "Your subscription period has ended. Reactivate Detailr Pro to keep receiving quotes.",
      status: "EXPIRED",
    };
  }

  // 6. PAST DUE (Renewal payment failed; standard 72-hour grace period)
  if (rawStatus === "PAST_DUE" || whopRecordStatus === "past_due") {
    const lastFailedAt = profile.trial_expiry ? new Date(profile.trial_expiry).getTime() : now;
    const gracePeriodEnd = lastFailedAt + GRACE_PERIOD_HOURS * 60 * 60 * 1000;
    const isWithinGracePeriod = now < gracePeriodEnd;

    if (isWithinGracePeriod) {
      const graceHoursLeft = Math.max(0, Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60)));
      return {
        hasAccess: true,
        isSubscribed: true,
        isCancelled: false,
        cancelAtPeriodEnd: false,
        inGracePeriod: true,
        isTrialActive: false,
        isPendingFirstVisit: false,
        isExpired: false,
        isSuspended: false,
        daysLeft: Math.ceil(graceHoursLeft / 24),
        currentPeriodEnd: new Date(gracePeriodEnd).toISOString(),
        reason: `Payment renewal failed. In grace period for next ${graceHoursLeft} hours.`,
        status: "PAST_DUE",
      };
    }

    return {
      hasAccess: false,
      isSubscribed: false,
      isCancelled: false,
      cancelAtPeriodEnd: false,
      inGracePeriod: false,
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: true,
      isSuspended: false,
      daysLeft: 0,
      currentPeriodEnd: profile.trial_expiry || null,
      reason:
        "Renewal payment failed and grace period has ended. Please update your payment method.",
      status: "EXPIRED",
    };
  }

  // 7. TRIAL PENDING FIRST CUSTOMER VISIT
  const isPendingFirstVisit =
    rawStatus === "TRIAL_PENDING" || (!profile.trial_expiry && rawStatus !== "TRIAL");

  if (isPendingFirstVisit) {
    return {
      hasAccess: true,
      isSubscribed: false,
      isCancelled: false,
      cancelAtPeriodEnd: false,
      inGracePeriod: false,
      isTrialActive: false,
      isPendingFirstVisit: true,
      isExpired: false,
      isSuspended: false,
      daysLeft: 7,
      currentPeriodEnd: null,
      status: "TRIAL_PENDING",
    };
  }

  // 8. ACTIVE FREE TRIAL (7-day clock running)
  if (isPeriodEndInFuture) {
    return {
      hasAccess: true,
      isSubscribed: false,
      isCancelled: false,
      cancelAtPeriodEnd: false,
      inGracePeriod: false,
      isTrialActive: true,
      isPendingFirstVisit: false,
      isExpired: false,
      isSuspended: false,
      daysLeft: daysLeftOnPeriod,
      currentPeriodEnd: profile.trial_expiry,
      status: "TRIALING",
    };
  }

  // 9. EXPIRED
  return {
    hasAccess: false,
    isSubscribed: false,
    isCancelled: false,
    cancelAtPeriodEnd: false,
    inGracePeriod: false,
    isTrialActive: false,
    isPendingFirstVisit: false,
    isExpired: true,
    isSuspended: false,
    daysLeft: 0,
    currentPeriodEnd: profile.trial_expiry || null,
    reason: "Your 7-day free trial has expired. Please upgrade to Detailr Pro to continue.",
    status: "EXPIRED",
  };
}

/**
 * TanStack Start Server Middleware:
 * Enforces authenticated session AND valid subscription/trial status in database.
 * Throws an unauthorized/forbidden error if subscription access is inactive.
 */
export const requireActiveSubscription = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const access = await verifyServerSubscriptionAccess(context.userId);

    if (!access.hasAccess) {
      const errMessage =
        access.reason ||
        "Subscription Required: Your free trial has expired. Please upgrade to Detailr Pro to use this feature.";
      console.warn(
        `[requireActiveSubscription] Blocked request for user ${context.userId}: ${errMessage}`,
      );
      throw new Error(errMessage);
    }

    return next({
      context: {
        ...context,
        subscription: access,
      },
    });
  });
