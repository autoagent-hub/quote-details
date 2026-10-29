import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/lib/admin.server";
import {
  addCredits,
  getCreditBalance,
  recordCreditPurchase,
  getCreditPurchases,
  type CreditPurchaseRecord,
} from "@/lib/credit.server";

const FX_RATES: Record<string, number> = {
  USD: 1.0,
  NGN: 1500.0,
  GBP: 0.8,
  EUR: 0.92,
  CAD: 1.35,
  AUD: 1.55,
  KES: 130.0,
  GHS: 15.0,
  ZAR: 18.0,
  UGX: 3700.0,
  TZS: 2600.0,
};

export const initiateFlutterwaveTopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { amountUsd: number; creditsAmount: number; currency?: string }) => data)
  .handler(async ({ data, context }) => {
    const amount = Math.max(1, Number(data.amountUsd) || 10);
    const credits = Math.max(10, Number(data.creditsAmount) || 50);

    const admin = getAdminClient();
    const db = admin ?? context.supabase;

    let email = "detailer@detailr.online";
    let currency = data.currency ? data.currency.toUpperCase() : "USD";

    if (admin) {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
        if (authUser?.user?.email) email = authUser.user.email;

        if (!data.currency) {
          const { data: profile } = await admin
            .from("profiles")
            .select("currency")
            .eq("id", context.userId)
            .maybeSingle();

          if (profile?.currency) {
            currency = profile.currency.toUpperCase();
          }
        }
      } catch {
        /* ignore */
      }
    }

    const rate = FX_RATES[currency] ?? 1.0;
    const finalAmount = currency === "USD" ? amount : Math.round(amount * rate);

    const txRef = `detailr_credit_${context.userId}_${Date.now()}`;
    const publicKey = process.env["FLUTTERWAVE_PUBLIC_KEY"] || "FLWPUBK_TEST-DEMOKEY123456789";

    return {
      success: true,
      txRef,
      amount: finalAmount,
      currency,
      email,
      publicKey,
      credits,
    };
  });

export const verifyFlutterwaveTopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: { txRef: string; creditsAmount: number; amountPaid?: number; currency?: string }) =>
      data,
  )
  .handler(async ({ data, context }) => {
    const credits = Math.max(1, Number(data.creditsAmount) || 50);
    const newBalance = await addCredits(context.userId, credits);

    const amountPaid = Number(data.amountPaid) || Math.round((credits / 50) * 10);
    const currency = (data.currency || "USD").toUpperCase();

    // Log purchase to audit logs for purchase history
    await recordCreditPurchase(context.userId, {
      txRef: data.txRef,
      credits,
      amount: amountPaid,
      currency,
    });

    return {
      success: true,
      newBalance,
      message: `Successfully added ${credits} credits to your account!`,
    };
  });

export const getUserCreditPurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CreditPurchaseRecord[]> => {
    return await getCreditPurchases(context.userId);
  });

export const getCreditDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const balance = await getCreditBalance(context.userId);
    const purchases = await getCreditPurchases(context.userId);

    const admin = getAdminClient();
    const db = admin ?? context.supabase;

    // Count customer quotes delivered
    let totalQuotesDelivered = 0;
    try {
      const { count } = await db
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("detailer_id", context.userId)
        .eq("is_test", false);

      totalQuotesDelivered = count || 0;
    } catch {
      /* ignore */
    }

    return {
      balance,
      purchases,
      totalQuotesDelivered,
      lowBalance: balance < 10,
    };
  });
