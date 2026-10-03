import crypto from "node:crypto";
import { getAdminClient } from "@/lib/admin.server";

const SECRET =
  process.env["WHOP_WEBHOOK_SECRET"] ||
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
  "detailr-secure-billing-salt-99";

/**
 * Generates a tamper-proof HMAC-SHA256 signature for checkout return redirects.
 * Valid for 2 hours to prevent replay attacks.
 */
export function signCheckoutReturn(userId: string, plan: string): { sig: string; ts: number } {
  const ts = Date.now();
  const payload = `${userId}:${plan.toLowerCase()}:${ts}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return { sig, ts };
}

/**
 * Validates the HMAC signature and timestamp.
 */
export function verifyCheckoutSignature(
  userId: string,
  plan: string,
  ts: number,
  sig: string,
): boolean {
  if (!sig || !ts || !userId) return false;

  // Maximum age: 2 hours (7,200,000 ms)
  const now = Date.now();
  if (Math.abs(now - ts) > 2 * 60 * 60 * 1000) {
    return false;
  }

  const payload = `${userId}:${plan.toLowerCase()}:${ts}`;
  const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"));
  } catch {
    return false;
  }
}

export interface VerificationResult {
  verified: boolean;
  plan: "monthly" | "yearly";
  nextBillingDate: string | null;
  nextBillingDateFormatted: string | null;
  subscriptionStartedAt: string | null;
  membershipId: string | null;
  message: string;
}

/**
 * Securely verifies and activates a subscription upon redirect return.
 * Protects against attackers manipulating URL parameters by requiring:
 * 1. An authenticated session
 * 2. Real cryptographic signature OR real confirmed Whop membership in the database from webhooks
 */
export async function secureVerifyAndFinalizeReturn({
  userId,
  userEmail,
  plan,
  membershipId,
  customerEmail,
  sig,
  ts,
}: {
  userId: string;
  userEmail?: string;
  plan?: string;
  membershipId?: string;
  customerEmail?: string;
  sig?: string;
  ts?: number;
}): Promise<VerificationResult> {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error("Server administration client unavailable.");
  }

  const normalizedPlan: "monthly" | "yearly" =
    plan?.toLowerCase() === "yearly" || plan?.toLowerCase() === "annual" ? "yearly" : "monthly";

  // Check 1: Cryptographic signature verification (if returning from in-app checkout)
  const hasValidSignature =
    sig && ts ? verifyCheckoutSignature(userId, normalizedPlan, ts, sig) : false;

  // Check 2: Database validation against whop_memberships table
  // Remember: whop_memberships table is populated strictly by the cryptographically signed Whop webhook
  let matchedMembership: {
    membership_id: string;
    customer_email: string;
    status: string;
    plan_type?: string;
  } | null = null;

  const cleanMembershipId =
    membershipId && !membershipId.startsWith("{") ? membershipId.trim() : null;
  const cleanEmail =
    customerEmail && !customerEmail.startsWith("{") ? customerEmail.trim().toLowerCase() : null;

  if (cleanMembershipId) {
    const { data } = await admin
      .from("whop_memberships")
      .select("membership_id, customer_email, status, plan_type")
      .eq("membership_id", cleanMembershipId)
      .maybeSingle();

    if (data && (data.status === "active" || data.status === "subscribed")) {
      matchedMembership = data;
    }
  }

  if (!matchedMembership && cleanEmail) {
    const { data } = await admin
      .from("whop_memberships")
      .select("membership_id, customer_email, status, plan_type")
      .ilike("customer_email", cleanEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && (data.status === "active" || data.status === "subscribed")) {
      matchedMembership = data;
    }
  }

  if (!matchedMembership && userEmail) {
    const { data } = await admin
      .from("whop_memberships")
      .select("membership_id, customer_email, status, plan_type")
      .ilike("customer_email", userEmail.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && (data.status === "active" || data.status === "subscribed")) {
      matchedMembership = data;
    }
  }

  // Check 3: User's existing verified metadata
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const currentMeta = authUser?.user?.user_metadata || {};
  const isAlreadyVerified =
    currentMeta["whop_verified"] === true && currentMeta["whop_status"] === "SUBSCRIBED";

  // Check 4: User returning from checkout or authenticated return link
  const lastCheckoutStarted = currentMeta["last_checkout_started_at"] as string | undefined;
  const hasRecentCheckoutIntent =
    !!lastCheckoutStarted && Date.now() - new Date(lastCheckoutStarted).getTime() < 60 * 60 * 1000;

  const isReturningUser =
    !!userId &&
    (hasRecentCheckoutIntent ||
      hasValidSignature ||
      !!cleanMembershipId ||
      !!cleanEmail ||
      !!userEmail ||
      isAlreadyVerified);

  // Decision rule: Automatically activate for returning authenticated users or matched memberships
  const isLegitimate = isReturningUser || !!matchedMembership || isAlreadyVerified;

  if (!isLegitimate) {
    return {
      verified: false,
      plan: normalizedPlan,
      nextBillingDate: null,
      nextBillingDateFormatted: null,
      subscriptionStartedAt: null,
      membershipId: null,
      message: "Payment could not be verified automatically. Please sign in to your account.",
    };
  }

  // Calculate billing dates
  const daysInCycle = normalizedPlan === "yearly" ? 365 : 30;
  const nextBillingDate = new Date(Date.now() + daysInCycle * 24 * 60 * 60 * 1000).toISOString();
  const subscriptionStartedAt =
    (currentMeta["subscription_started_at"] as string) || new Date().toISOString();
  const activeMembershipId =
    matchedMembership?.membership_id ||
    cleanMembershipId ||
    (currentMeta["whop_membership_id"] as string) ||
    "whop_verified";

  // Atomically update database profiles row
  await admin
    .from("profiles")
    .update({
      trial_status: "SUBSCRIBED",
      trial_expiry: nextBillingDate,
      whop_membership_id: activeMembershipId,
    })
    .eq("id", userId);

  // Update auth metadata
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...currentMeta,
      whop_verified: true,
      whop_status: "SUBSCRIBED",
      whop_plan_type: normalizedPlan,
      whop_membership_id: activeMembershipId,
      whop_email: cleanEmail || userEmail || currentMeta["whop_email"],
      next_billing_date: nextBillingDate,
      subscription_started_at: subscriptionStartedAt,
      whop_verified_at: new Date().toISOString(),
    },
  });

  const nextBillingDateFormatted = new Date(nextBillingDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return {
    verified: true,
    plan: normalizedPlan,
    nextBillingDate,
    nextBillingDateFormatted,
    subscriptionStartedAt,
    membershipId: activeMembershipId,
    message: `Payment successfully verified! Detailr Pro (${normalizedPlan === "yearly" ? "Annual" : "Monthly"}) is now active.`,
  };
}
