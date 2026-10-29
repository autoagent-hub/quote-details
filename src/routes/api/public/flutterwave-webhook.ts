import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/admin.server";
import { addCredits } from "@/lib/credit.server";
import { timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

type FlutterwaveWebhookPayload = {
  event?: string;
  data?: {
    id?: number;
    tx_ref?: string;
    flw_ref?: string;
    amount?: number;
    currency?: string;
    status?: string;
    customer?: {
      email?: string;
      name?: string;
    };
    meta?: Array<{ key: string; value: string }> | Record<string, unknown>;
  };
};

export const Route = createFileRoute("/api/public/flutterwave-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env["FLUTTERWAVE_WEBHOOK_SECRET"];
        const signature =
          request.headers.get("verif-hash") || request.headers.get("verif_hash") || "";

        if (webhookSecret && (!signature || !safeEqual(signature, webhookSecret))) {
          return new Response("Unauthorized signature", { status: 401 });
        }

        let payload: FlutterwaveWebhookPayload;
        try {
          payload = (await request.json()) as FlutterwaveWebhookPayload;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const event = payload?.event;
        const data = payload?.data;

        if (event !== "charge.completed" || data?.status !== "successful") {
          return Response.json({
            status: "ignored",
            reason: "Event not charge.completed or not successful",
          });
        }

        const txRef = data?.tx_ref || "";
        const email = data?.customer?.email || "";

        // Parse userId and optional credits from tx_ref format: detailr_credit_${userId}_${credits}_${timestamp}
        let userId: string | null = null;
        let explicitCredits: number | null = null;
        const parts = txRef.split("_");
        if (parts.length >= 4 && parts[0] === "detailr" && parts[1] === "credit") {
          userId = parts[2];
          if (
            parts.length >= 5 &&
            !isNaN(Number(parts[3])) &&
            Number(parts[3]) > 0 &&
            Number(parts[3]) < 100000
          ) {
            explicitCredits = Number(parts[3]);
          }
        }

        const admin = getAdminClient();
        if (!admin) {
          return new Response("Database unavailable", { status: 503 });
        }

        // If userId not found in tx_ref, lookup user by customer email
        if (!userId && email) {
          try {
            const { data: list } = await admin.auth.admin.listUsers();
            const matched = list?.users?.find(
              (u) => u.email?.toLowerCase() === email.toLowerCase(),
            );
            if (matched) {
              userId = matched.id;
            }
          } catch {
            /* ignore */
          }
        }

        if (!userId) {
          console.warn(
            "[flutterwave-webhook] Could not resolve user from tx_ref or email:",
            txRef,
            email,
          );
          return Response.json({ status: "error", reason: "User not resolved" }, { status: 400 });
        }

        // Idempotency: verify this transaction was not already credited
        const { isPurchaseAlreadyRecorded, recordCreditPurchase } =
          await import("@/lib/credit.server");
        const alreadyCredited = await isPurchaseAlreadyRecorded(txRef);
        if (alreadyCredited) {
          return Response.json({
            status: "already_processed",
            message: "Transaction already processed and credited",
          });
        }

        // Determine credit amount: min $10 for 50 credits ($0.20/lead)
        const paidAmount = Number(data?.amount) || 10;
        const currency = (data?.currency || "USD").toUpperCase();

        let creditsToAdd = 50;
        if (explicitCredits && explicitCredits >= 50) {
          creditsToAdd = explicitCredits;
        } else if (currency === "USD") {
          if (paidAmount >= 100) creditsToAdd = 600;
          else if (paidAmount >= 45) creditsToAdd = 250;
          else if (paidAmount >= 10) creditsToAdd = 50;
          else creditsToAdd = Math.max(50, Math.round(paidAmount * 5));
        } else {
          // For foreign currencies, scale from $10 = 50 credits
          if (paidAmount >= 150000)
            creditsToAdd = 600; // ~NGN Scale Pack
          else if (paidAmount >= 67500)
            creditsToAdd = 250; // ~NGN Pro Pack
          else if (paidAmount >= 15000)
            creditsToAdd = 50; // ~NGN Starter Pack
          else creditsToAdd = 50;
        }

        const newBalance = await addCredits(userId, creditsToAdd);

        // Record purchase to audit logs for purchase history
        await recordCreditPurchase(userId, {
          txRef,
          credits: creditsToAdd,
          amount: paidAmount,
          currency,
        });

        console.info(
          `[flutterwave-webhook] Successfully added ${creditsToAdd} credits for user ${userId}. New balance: ${newBalance}`,
        );

        return Response.json({ status: "success", creditsAdded: creditsToAdd, newBalance });
      },
    },
  },
});
