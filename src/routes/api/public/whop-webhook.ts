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
  // Support both key formats: Standard Webhooks ("whsec_" + base64)
  // and opaque keys ("ws_..." used as-is).
  const keys: Buffer[] = [];
  if (secret.startsWith("whsec_")) {
    try {
      keys.push(Buffer.from(secret.slice(6), "base64"));
    } catch {
      /* fall through */
    }
  }
  keys.push(Buffer.from(secret, "utf8"));
  if (keys.length === 0) return false;

  // Reject events older than 5 minutes to prevent replay attacks.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const signed = `${id}.${timestamp}.${body}`;
  const expectedList = keys.map((key) =>
    createHmac("sha256", key).update(signed).digest("base64"),
  );

  // Header may contain multiple space-separated "v1,<sig>" entries.
  for (const part of signatureHeader.split(" ")) {
    const [version, sig] = part.split(",", 2);
    if (version !== "v1" || !sig) continue;
    const a = Buffer.from(sig);
    for (const expected of expectedList) {
      const b = Buffer.from(expected);
      if (a.length === b.length && timingSafeEqual(a, b)) return true;
    }
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

async function getAdminClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["EXTERNAL_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
  const key =
    process.env["EXTERNAL_SUPABASE_SERVICE_ROLE_KEY"] ??
    process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function findProfileIdByEmail(
  admin: NonNullable<Awaited<ReturnType<typeof getAdminClient>>>,
  email: string,
): Promise<string | null> {
  // Profiles mirror auth.users, so resolve the auth user by email.
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
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

        // Map Whop events to the resulting trial_status.
        const statusByEvent: Record<string, string> = {
          "membership.activated": "SUBSCRIBED",
          "payment.succeeded": "SUBSCRIBED",
          "membership.deactivated": "CANCELLED",
          "payment.failed": "PAST_DUE",
        };
        const newStatus = event.type ? statusByEvent[event.type] : undefined;
        if (!event.type || !newStatus) {
          return Response.json({ ok: true, ignored: event.type ?? "unknown" });
        }

        const data = event.data ?? {};
        const email = data.user?.email ?? data.email ?? null;
        const metadataUserId =
          typeof data.metadata?.["user_id"] === "string"
            ? (data.metadata["user_id"] as string)
            : null;
        const membershipId = data.membership_id ?? data.id ?? null;

        const admin = await getAdminClient();
        if (!admin) return new Response("Not configured", { status: 503 });

        let profileId = metadataUserId;
        if (!profileId && email) {
          profileId = await findProfileIdByEmail(admin, email);
        }

        if (!profileId) {
          // Return 200 so Whop doesn't retry forever; nothing to update.
          return Response.json({ ok: true, matched: false });
        }

        const { error } = await admin
          .from("profiles")
          .update({
            trial_status: newStatus,
            ...(membershipId ? { whop_membership_id: membershipId } : {}),
          })
          .eq("id", profileId);

        if (error) {
          console.error("whop-webhook update failed:", error.message);
          return Response.json({ ok: false }, { status: 500 });
        }

        return Response.json({ ok: true, matched: true, trial_status: newStatus });
      },
    },
  },
});
