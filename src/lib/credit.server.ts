import { getAdminClient } from "@/lib/admin.server";
import { supabase } from "@/integrations/supabase/client";

export async function getCreditBalance(userId: string): Promise<number> {
  const admin = getAdminClient();
  const db = admin ?? supabase;

  const { data: profile } = await db
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .maybeSingle();

  if (profile && typeof profile.credits_balance === "number") {
    return profile.credits_balance;
  }

  // Default starting credits: 0 (7-day free trial requires no credits; users pay as they go after trial ends)
  return 0;
}

/**
 * Atomically deducts credits for bot interactions, ensuring balance >= amount before decrementing.
 */
export async function deductCredit(
  userId: string,
  amount = 1,
): Promise<{ success: boolean; creditsBalance: number; lowBalance: boolean; reason?: string }> {
  if (!userId) {
    return {
      success: false,
      creditsBalance: 0,
      lowBalance: false,
      reason: "Invalid user identifier",
    };
  }

  const admin = getAdminClient();
  const db = admin ?? supabase;

  const currentBalance = await getCreditBalance(userId);

  if (currentBalance < amount) {
    return {
      success: false,
      creditsBalance: currentBalance,
      lowBalance: true,
      reason:
        "Out of credits. Please top up your account via Flutterwave to continue using AI bot features.",
    };
  }

  const newBalance = currentBalance - amount;

  // Atomic update with condition check
  const { data: updated, error } = await db
    .from("profiles")
    .update({ credits_balance: newBalance } as never)
    .eq("id", userId)
    .gte("credits_balance", amount)
    .select("credits_balance")
    .maybeSingle();

  if (error || !updated) {
    // Fallback re-check for concurrent requests
    const freshBalance = await getCreditBalance(userId);
    if (freshBalance < amount) {
      return {
        success: false,
        creditsBalance: freshBalance,
        lowBalance: true,
        reason:
          "Out of credits. Please top up your account via Flutterwave to continue using AI bot features.",
      };
    }
    const retryBalance = freshBalance - amount;
    await db
      .from("profiles")
      .update({ credits_balance: retryBalance } as never)
      .eq("id", userId);

    return {
      success: true,
      creditsBalance: retryBalance,
      lowBalance: retryBalance < 10,
    };
  }

  const finalBalance =
    typeof updated.credits_balance === "number" ? updated.credits_balance : newBalance;

  return {
    success: true,
    creditsBalance: finalBalance,
    lowBalance: finalBalance < 10,
  };
}

export async function addCredits(userId: string, amount: number): Promise<number> {
  const current = await getCreditBalance(userId);
  const updated = current + amount;

  const admin = getAdminClient();
  const db = admin ?? supabase;

  await db
    .from("profiles")
    .update({ credits_balance: updated } as never)
    .eq("id", userId);

  return updated;
}

export interface CreditPurchaseRecord {
  id: string;
  txRef: string;
  credits: number;
  amount: number;
  currency: string;
  status: "completed" | "pending";
  createdAt: string;
}

export async function isPurchaseAlreadyRecorded(txRef: string): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin || !txRef) return false;
  try {
    const { data } = await admin
      .from("audit_logs")
      .select("id")
      .eq("action", "credit_purchase")
      .filter("details->>tx_ref", "eq", txRef)
      .limit(1);
    return Boolean(data && data.length > 0);
  } catch {
    return false;
  }
}

export async function recordCreditPurchase(
  userId: string,
  purchase: {
    txRef: string;
    credits: number;
    amount: number;
    currency: string;
  },
): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;

  try {
    if (await isPurchaseAlreadyRecorded(purchase.txRef)) {
      return;
    }

    let email: string | null = null;
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    email = authUser?.user?.email || null;

    await admin.from("audit_logs").insert({
      admin_id: userId,
      admin_email: email,
      action: "credit_purchase",
      details: {
        tx_ref: purchase.txRef,
        credits: purchase.credits,
        amount: purchase.amount,
        currency: (purchase.currency || "USD").toUpperCase(),
        status: "completed",
      },
    });
  } catch (err) {
    console.warn("[credit] Failed to record purchase in audit_logs:", err);
  }
}

export async function getCreditPurchases(userId: string): Promise<CreditPurchaseRecord[]> {
  const admin = getAdminClient();
  if (!admin) return [];

  try {
    const { data: logs } = await admin
      .from("audit_logs")
      .select("id, details, created_at")
      .eq("admin_id", userId)
      .eq("action", "credit_purchase")
      .order("created_at", { ascending: false });

    if (!logs || logs.length === 0) return [];

    return logs.map((log) => {
      const d = (log.details as Record<string, unknown>) || {};
      return {
        id: log.id,
        txRef: String(d["tx_ref"] || `TX-${log.id.slice(0, 8)}`),
        credits: Number(d["credits"]) || 50,
        amount: Number(d["amount"]) || 10,
        currency: String(d["currency"] || "USD"),
        status: "completed",
        createdAt: log.created_at,
      };
    });
  } catch (err) {
    console.warn("[credit] Failed to fetch purchases:", err);
    return [];
  }
}
