import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/lib/admin.server";
import { supabase } from "@/integrations/supabase/client";

const MASTER_ADMIN_ID = "3c7f1a25-615e-4cfc-9c23-a049bafe9337";

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
 * With Whop integration removed, all accounts have active full access unless suspended.
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

  const admin = getAdminClient();
  const db = admin ?? supabase;

  // 1. Fetch profile record from database
  const { data: profile } = await db
    .from("profiles")
    .select("trial_status, trial_expiry, created_at")
    .eq("id", userId)
    .maybeSingle();

  const rawStatus = (profile?.trial_status || "ACTIVE").toUpperCase();

  // 2. Check suspension or ban in auth metadata or profile
  let isSuspended = rawStatus === "SUSPENDED" || rawStatus === "BANNED";
  if (admin) {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      const userMeta = authUser?.user?.user_metadata || {};
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

export const requireActiveSubscription = createMiddleware()
  .middleware([requireSupabaseAuth])
  .server(async ({ context, next }) => {
    const access = await verifyServerSubscriptionAccess(context.userId);
    if (!access.hasAccess) {
      throw new Error(access.reason || "Active subscription required.");
    }
    return next({
      context: {
        subscription: access,
      },
    });
  });
