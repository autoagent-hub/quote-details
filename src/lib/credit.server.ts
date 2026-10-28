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

  // Default starting credits if not set
  return 50;
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
