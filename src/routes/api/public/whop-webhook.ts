import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Whop signs webhooks using the Standard Webhooks spec:
// signature = base64( HMAC-SHA256( secret, `${webhook-id}.${webhook-timestamp}.${rawBody}` ) )
// The signing secret from the Whop dashboard starts with "whsec_" and the rest is base64.

function verifyWhopSignature(
  secret: string,
  id: string,
  timestamp: string,
  signatureHeader: string,
  body: string,
): boolean {
  const rawSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(rawSecret, "base64");
  } catch {
    return false;
  }

  // Reject events older than 5 minutes to prevent replay attacks.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");

  // Header may contain multiple space-separated "v1,<sig>" entries.
  for (const part of signatureHeader.split(" ")) {
    const [version, sig] = part.split(",", 2);
    if (version !== "v1" || !sig) continue;
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

type WhopEvent = {
  type?: string;
  data?: {
    id?: string; // payment or membership id
    membership_id?: string;
    user?: { email?: string | null; id?: string } | null;
    email?: string | null;
    metadata?: Record<string, unknown> | null;
  };
};

async function findProfileIdByEmail(email: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Profiles mirror auth.users, so resolve the auth user by email.
  const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  return user?.id ?? null;
}

export const Route = createFileRoute("/api/public/whop-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["WHOP_WEBHOOK_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });

        const body = await request.text();
        const id = request.headers.get("webhook-id") ?? "";
        const timestamp = request.headers.get("webhook-timestamp") ?? "";
        const signature = request.headers.get("webhook-signature") ?? "";

        if (!id || !timestamp || !signature ||
            !verifyWhopSignature(secret, id, timestamp, signature, body)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: WhopEvent;
        try {
          event = JSON.parse(body) as WhopEvent;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const handled = ["membership.activated", "payment.succeeded"];
        if (!event.type || !handled.includes(event.type)) {
          return Response.json({ ok: true, ignored: event.type ?? "unknown" });
        }

        const data = event.data ?? {};
        const email = data.user?.email ?? data.email ?? null;
        const metadataUserId =
          typeof data.metadata?.["user_id"] === "string"
            ? (data.metadata["user_id"] as string)
            : null;
        const membershipId = data.membership_id ?? data.id ?? null;

        let profileId = metadataUserId;
        if (!profileId && email) {
          profileId = await findProfileIdByEmail(email);
        }

        if (!profileId) {
          // Return 200 so Whop doesn't retry forever; nothing to update.
          return Response.json({ ok: true, matched: false });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            trial_status: "SUBSCRIBED",
            ...(membershipId ? { whop_membership_id: membershipId } : {}),
          })
          .eq("id", profileId);

        if (error) {
          console.error("whop-webhook update failed:", error.message);
          return Response.json({ ok: false }, { status: 500 });
        }

        return Response.json({ ok: true, matched: true, trial_status: "SUBSCRIBED" });
      },
    },
  },
});
