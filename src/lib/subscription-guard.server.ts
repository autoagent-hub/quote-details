import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/lib/admin.server";
import { supabase } from "@/integrations/supabase/client";

const MASTER_ADMIN_ID = "3c7f1a25-615e-4cfc-9c23-a049bafe9337";

export interface SubscriptionAccessResult {
  hasAccess: boolean;
  isSubscribed: boolean;
  isCancelled: boolean;
  isTrialActive: boolean;
  isPendingFirstVisit: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  daysLeft: number;
  reason?: string;
  status: "ACTIVE" | "TRIALING" | "TRIAL_PENDING" | "EXPIRED" | "CANCELLED" | "SUSPENDED";
}

/**
 * Validates a user's subscription access directly against the database on the server.
 * Protects against client-side tampering, request injection, and artificial trial extension.
 */
export async function verifyServerSubscriptionAccess(
  userId: string,
): Promise<SubscriptionAccessResult> {
  if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return {
      hasAccess: false,
      isSubscribed: false,
      isCancelled: false,
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: true,
      isSuspended: false,
      daysLeft: 0,
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
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: false,
      isSuspended: false,
      daysLeft: 365,
      status: "ACTIVE",
    };
  }

  const admin = getAdminClient();
  const db = admin ?? supabase;

  // 1. Fetch profile record from database
  const { data: profile, error } = await db
    .from("profiles")
    .select("trial_status, trial_expiry, whop_membership_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return {
      hasAccess: false,
      isSubscribed: false,
      isCancelled: false,
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: true,
      isSuspended: false,
      daysLeft: 0,
      reason: "Shop profile does not exist.",
      status: "EXPIRED",
    };
  }

  const rawStatus = profile.trial_status || "TRIAL_PENDING";

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
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: true,
      isSuspended: true,
      daysLeft: 0,
      reason: "This account has been restricted by administration.",
      status: "SUSPENDED",
    };
  }

  // 3. Check for active subscription in whop_memberships table
  let hasActiveWhopRecord = false;
  if (admin) {
    try {
      const { data: whopMem } = await admin
        .from("whop_memberships")
        .select("status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (whopMem && (whopMem.status === "active" || whopMem.status === "subscribed")) {
        hasActiveWhopRecord = true;
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

  const isSubscribed =
    rawStatus === "SUBSCRIBED" ||
    rawStatus === "ADMIN" ||
    userMeta["whop_status"] === "SUBSCRIBED" ||
    userMeta["whop_verified"] === true ||
    userMeta["trial_status"] === "SUBSCRIBED" ||
    hasActiveWhopRecord ||
    hasAuthenticMembershipId;

  if (isSubscribed) {
    return {
      hasAccess: true,
      isSubscribed: true,
      isCancelled: false,
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: false,
      isSuspended: false,
      daysLeft: 30,
      status: "ACTIVE",
    };
  }

  const isCancelled = rawStatus === "CANCELLED";

  // 4. Check if trial is pending first customer visit (timer not started yet)
  const isPendingFirstVisit =
    !isCancelled &&
    (rawStatus === "TRIAL_PENDING" || (!profile.trial_expiry && rawStatus !== "TRIAL"));

  if (isPendingFirstVisit) {
    return {
      hasAccess: true,
      isSubscribed: false,
      isCancelled: false,
      isTrialActive: false,
      isPendingFirstVisit: true,
      isExpired: false,
      isSuspended: false,
      daysLeft: 7,
      status: "TRIAL_PENDING",
    };
  }

  // 5. Active trial evaluation
  const now = Date.now();
  const expiresAt = profile.trial_expiry;
  const isTrialActive = !isCancelled && !!expiresAt && new Date(expiresAt).getTime() > now;
  const daysLeft = isTrialActive
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)))
    : 0;

  if (isTrialActive) {
    return {
      hasAccess: true,
      isSubscribed: false,
      isCancelled: false,
      isTrialActive: true,
      isPendingFirstVisit: false,
      isExpired: false,
      isSuspended: false,
      daysLeft,
      status: "TRIALING",
    };
  }

  // 6. Subscription Cancelled (retains active access through prepaid cycle if not explicitly expired)
  if (isCancelled) {
    return {
      hasAccess: true,
      isSubscribed: false,
      isCancelled: true,
      isTrialActive: false,
      isPendingFirstVisit: false,
      isExpired: false,
      isSuspended: false,
      daysLeft: 0,
      status: "CANCELLED",
    };
  }

  // 7. Expired
  return {
    hasAccess: false,
    isSubscribed: false,
    isCancelled: false,
    isTrialActive: false,
    isPendingFirstVisit: false,
    isExpired: true,
    isSuspended: false,
    daysLeft: 0,
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
