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
  const expectedList = keys.map((key) => createHmac("sha256", key).update(signed).digest("base64"));

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
  data?: Record<string, unknown>;
};

async function getAdminClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["EXTERNAL_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
  const key =
    process.env["EXTERNAL_SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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

        if (
          !id ||
          !timestamp ||
          !signature ||
          !verifyWhopSignature(secret, id, timestamp, signature, body)
        ) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: WhopEvent;
        try {
          event = JSON.parse(body) as WhopEvent;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        // Comprehensive mapping of Whop events to subscription status
        const statusByEvent: Record<string, string> = {
          "membership.went_valid": "SUBSCRIBED",
          "membership.activated": "SUBSCRIBED",
          "membership.created": "SUBSCRIBED",
          "payment.succeeded": "SUBSCRIBED",
          "membership.went_invalid": "CANCELLED",
          "membership.cancelled": "CANCELLED",
          "membership.cancel": "CANCELLED",
          "membership.deactivated": "CANCELLED",
          "membership.deleted": "CANCELLED",
          "payment.failed": "PAST_DUE",
          "payment.refunded": "CANCELLED",
        };

        const newStatus = event.type ? statusByEvent[event.type] : undefined;
        if (!event.type || !newStatus) {
          return Response.json({ ok: true, ignored: event.type ?? "unknown" });
        }

        const data = (event.data ?? {}) as Record<string, unknown>;
        const dataUser = data["user"] as Record<string, unknown> | undefined;
        const dataMembership = data["membership"] as Record<string, unknown> | undefined;
        const dataWallet = data["wallet"] as Record<string, unknown> | undefined;
        const metadata = ((data["metadata"] || data["checkout_metadata"]) ?? {}) as Record<
          string,
          unknown
        >;
        const customFields = (data["custom_fields"] ?? {}) as Record<string, unknown>;

        // 1. Extract membership or payment ID
        const membershipId =
          (typeof data["membership_id"] === "string" && data["membership_id"]) ||
          (typeof data["id"] === "string" && data["id"]) ||
          (typeof dataMembership?.["id"] === "string" && (dataMembership["id"] as string)) ||
          null;

        // 2. Extract customer email (may differ from Detailr signup email)
        const email =
          (typeof dataUser?.["email"] === "string" && dataUser["email"].toLowerCase().trim()) ||
          (typeof data["email"] === "string" && (data["email"] as string).toLowerCase().trim()) ||
          (typeof dataWallet?.["email"] === "string" &&
            (dataWallet["email"] as string).toLowerCase().trim()) ||
          null;

        // 3. Extract user ID passed through checkout URL metadata or client reference
        const metadataUserId =
          (typeof metadata["user_id"] === "string" && metadata["user_id"]) ||
          (typeof metadata["userId"] === "string" && metadata["userId"]) ||
          (typeof metadata["detailer_id"] === "string" && metadata["detailer_id"]) ||
          (typeof customFields["user_id"] === "string" && (customFields["user_id"] as string)) ||
          (typeof customFields["userId"] === "string" && (customFields["userId"] as string)) ||
          (typeof data["client_reference_id"] === "string" &&
            (data["client_reference_id"] as string)) ||
          (typeof data["external_id"] === "string" && (data["external_id"] as string)) ||
          null;

        const planType =
          (typeof metadata["plan_type"] === "string" && metadata["plan_type"]) ||
          (typeof data["plan_id"] === "string" && (data["plan_id"] as string).includes("Gmhn")
            ? "yearly"
            : "monthly");

        const admin = await getAdminClient();
        if (!admin) return new Response("Not configured", { status: 503 });

        let profileId: string | null = null;

        // Match Strategy A: Direct metadata user_id from checkout URL
        if (
          metadataUserId &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(metadataUserId)
        ) {
          const { data: p } = await admin
            .from("profiles")
            .select("id")
            .eq("id", metadataUserId)
            .maybeSingle();
          if (p?.id) profileId = p.id;
        }

        // Match Strategy B: Check if this membership_id was previously linked to a user in whop_memberships
        if (!profileId && membershipId) {
          try {
            const { data: existingMem } = await admin
              .from("whop_memberships")
              .select("user_id")
              .eq("membership_id", membershipId)
              .maybeSingle();
            if (existingMem?.user_id) profileId = existingMem.user_id;
          } catch {
            /* table may be newly created */
          }
        }

        // Match Strategy C: Email match against auth.users (primary email or linked whop email in metadata)
        if (!profileId && email) {
          const { data: allUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
          const matchedUser = allUsers?.users?.find((u) => {
            if (u.email?.toLowerCase() === email) return true;
            const meta = u.user_metadata || {};
            if (
              typeof meta["linked_whop_email"] === "string" &&
              meta["linked_whop_email"].toLowerCase() === email
            )
              return true;
            if (
              typeof meta["whop_email"] === "string" &&
              meta["whop_email"].toLowerCase() === email
            )
              return true;
            return false;
          });
          if (matchedUser?.id) profileId = matchedUser.id;
        }

        // Match Strategy D: Recent checkout session correlation (user initiated checkout within last 30 mins)
        if (!profileId && email) {
          const { data: allUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
          const nowMs = Date.now();
          const candidate = allUsers?.users?.find((u) => {
            const meta = u.user_metadata || {};
            const startedAt = meta["last_checkout_started_at"] as string | undefined;
            if (!startedAt) return false;
            const diffMs = nowMs - new Date(startedAt).getTime();
            // Started checkout in last 30 minutes and no other membership was attached
            return diffMs > 0 && diffMs < 30 * 60 * 1000 && !meta["whop_verified"];
          });
          if (candidate?.id) profileId = candidate.id;
        }

        // Persist membership record in whop_memberships table
        try {
          if (membershipId) {
            await admin.from("whop_memberships").upsert(
              {
                membership_id: membershipId,
                user_id: profileId,
                customer_email: email || "unknown@whop.customer",
                plan_type: planType,
                status: newStatus === "SUBSCRIBED" ? "active" : newStatus.toLowerCase(),
                raw_payload: event,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "membership_id" },
            );
          }
        } catch (dbErr) {
          console.warn("Could not upsert whop_memberships tracking record:", dbErr);
        }

        // If matched to a Detailr profile, update profile status & auth metadata
        if (profileId) {
          const { error } = await admin
            .from("profiles")
            .update({
              trial_status: newStatus,
              ...(membershipId ? { whop_membership_id: membershipId } : {}),
            })
            .eq("id", profileId);

          if (error) {
            console.error("whop-webhook profile update error:", error.message);
          }

          try {
            const { data: authUser } = await admin.auth.admin.getUserById(profileId);
            const currentMeta = authUser?.user?.user_metadata || {};
            await admin.auth.admin.updateUserById(profileId, {
              user_metadata: {
                ...currentMeta,
                whop_verified: newStatus === "SUBSCRIBED",
                whop_membership_id: membershipId || currentMeta["whop_membership_id"],
                whop_email: email || currentMeta["whop_email"],
                whop_status: newStatus,
                whop_plan_type: planType,
                whop_verified_at: new Date().toISOString(),
              },
            });
          } catch (metaErr) {
            console.warn("Could not stamp whop verification metadata:", metaErr);
          }

          return Response.json({
            ok: true,
            matched: true,
            profileId,
            trial_status: newStatus,
          });
        }

        // Log unmatched event for easy 1-click claim if email differed
        console.info(
          `[whop-webhook] Recorded active membership ${membershipId} for checkout email: ${email} (pending user match).`,
        );

        return Response.json({
          ok: true,
          matched: false,
          membershipId,
          checkoutEmail: email,
          status: newStatus,
        });
      },
    },
  },
});
