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

        // Parse userId from tx_ref format: detailr_credit_${userId}_${timestamp}
        let userId: string | null = null;
        const parts = txRef.split("_");
        if (parts.length >= 4 && parts[0] === "detailr" && parts[1] === "credit") {
          userId = parts[2];
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

        // Determine credit amount based on paid amount or metadata
        // Default conversion: $10 or equivalent = 100 credits, $25 = 300 credits, etc.
        const paidAmount = Number(data?.amount) || 10;
        let creditsToAdd = 100;
        if (paidAmount >= 45 || paidAmount >= 70000) {
          creditsToAdd = 700;
        } else if (paidAmount >= 22 || paidAmount >= 35000) {
          creditsToAdd = 300;
        } else if (paidAmount >= 9 || paidAmount >= 12000) {
          creditsToAdd = 100;
        } else {
          creditsToAdd = Math.round(paidAmount * 10);
        }

        const newBalance = await addCredits(userId, creditsToAdd);

        console.info(
          `[flutterwave-webhook] Successfully added ${creditsToAdd} credits for user ${userId}. New balance: ${newBalance}`,
        );

        return Response.json({ status: "success", creditsAdded: creditsToAdd, newBalance });
      },
    },
  },
});
