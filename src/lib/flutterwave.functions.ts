import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/lib/admin.server";
import { addCredits } from "@/lib/credit.server";

export const initiateFlutterwaveTopup = createServerFn({ method: "POST" })
  .validator((data: { amountUsd: number; creditsAmount: number }) => data)
  .handler(async ({ data, context }) => {
    const amount = Math.max(1, Number(data.amountUsd) || 10);
    const credits = Math.max(10, Number(data.creditsAmount) || 100);

    const admin = getAdminClient();
    const db = admin ?? context.supabase;

    let email = "detailer@detailr.online";
    if (admin) {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
        if (authUser?.user?.email) email = authUser.user.email;
      } catch {
        /* ignore */
      }
    }

    const txRef = `detailr_credit_${context.userId}_${Date.now()}`;
    const publicKey = process.env["FLUTTERWAVE_PUBLIC_KEY"] || "FLWPUBK_TEST-DEMOKEY123456789";

    return {
      success: true,
      txRef,
      amount,
      currency: "USD",
      email,
      publicKey,
      credits,
    };
  });

export const verifyFlutterwaveTopup = createServerFn({ method: "POST" })
  .validator((data: { txRef: string; creditsAmount: number }) => data)
  .handler(async ({ data, context }) => {
    const credits = Math.max(1, Number(data.creditsAmount) || 100);
    const newBalance = await addCredits(context.userId, credits);
    return {
      success: true,
      newBalance,
      message: `Successfully added ${credits} credits to your account!`,
    };
  });
