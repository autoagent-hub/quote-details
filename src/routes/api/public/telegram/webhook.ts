import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";
import { getAdminClient } from "@/lib/admin.server";
import { ADMIN_EMAILS } from "@/lib/admin-auth";

function deriveSecret(token: string): string {
  return createHash("sha256").update(`telegram-webhook:${token}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function send(token: string, chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["TELEGRAM_BOT_TOKEN"];
        if (!token) return new Response("Not configured", { status: 503 });

        const provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(provided, deriveSecret(token))) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = (await request.json()) as {
          message?: { chat?: { id?: number }; text?: string };
        };
        const chatId = update.message?.chat?.id;
        const text = (update.message?.text ?? "").trim();
        if (!chatId) return Response.json({ ok: true, ignored: true });

        const admin = getAdminClient();
        if (!admin) {
          await send(
            token,
            chatId,
            "I can't reach Detailr right now. Please try again in a minute.",
          );
          return Response.json({ ok: false }, { status: 503 });
        }

        // Handle /stats command for administrator
        if (/^\/(?:stats|metrics)(?:[@\w]*)?$/i.test(text)) {
          const { count: totalDetailers } = await admin
            .from("profiles")
            .select("id", { count: "exact", head: true });
          const { data: quotes } = await admin.from("quotes").select("estimated_price");

          const totalQuotes = quotes?.length || 0;
          const pipelineValue = (quotes || []).reduce(
            (acc, q) => acc + (Number(q.estimated_price) || 0),
            0,
          );

          await send(
            token,
            chatId,
            `📊 <b>Detailr Platform Overview</b>\n\n` +
              `👥 <b>Total Detailers:</b> ${totalDetailers || 0}\n` +
              `📋 <b>Total Quotes Generated:</b> ${totalQuotes}\n` +
              `💰 <b>Total Pipeline Value:</b> $${Math.round(pipelineValue).toLocaleString()}\n\n` +
              `👉 <a href="https://detailr.online/master-hq">Open Admin HQ</a>`,
          );
          return Response.json({ ok: true });
        }

        const match = /^\/start(?:[@\w]*)?(?:\s+(\S+))?$/.exec(text);
        if (!match) {
          await send(
            token,
            chatId,
            "Open your Detailr dashboard (detailr.online) and tap “Connect Telegram Bot” to link this chat.",
          );
          return Response.json({ ok: true });
        }

        // Telegram start payloads are limited to A-Z, a-z, 0-9, _ and -.
        const code = (match[1] ?? "")
          .trim()
          .replace(/[^a-zA-Z0-9_-]/g, "")
          .toLowerCase();

        // 1. Check if this is an Admin connection request (/start admin)
        if (code === "admin" || code.startsWith("admin_")) {
          const { data: authUsers } = await admin.auth.admin.listUsers();
          let adminMatched = false;

          for (const u of authUsers?.users || []) {
            if (u.email && ADMIN_EMAILS.includes(u.email.toLowerCase())) {
              adminMatched = true;
              const meta = (u.user_metadata || {}) as Record<string, unknown>;
              await admin.auth.admin.updateUserById(u.id, {
                user_metadata: {
                  ...meta,
                  admin_telegram_chat_id: String(chatId),
                },
              });

              await admin
                .from("profiles")
                .update({ telegram_chat_id: String(chatId) } as never)
                .eq("id", u.id);
            }
          }

          await send(
            token,
            chatId,
            `🛡️ <b>Administrator Console Connected!</b>\n\n` +
              `You are now registered as the Master System Administrator.\n\n` +
              `🔔 <b>Active Push Alerts:</b>\n` +
              `• 🚀 New User Registrations\n` +
              `• 🚨 Suspicious Activity & Rate-Limit Spikes\n` +
              `• 🛡️ Account Bans & Flagged Violations\n\n` +
              `⚡ <b>Commands:</b>\n` +
              `• <code>/stats</code> - Instant platform KPIs\n\n` +
              `👉 <a href="https://detailr.online/master-hq">Open Master Admin Console</a>`,
          );
          return Response.json({ ok: true, admin: true });
        }

        if (!code) {
          await send(
            token,
            chatId,
            "Almost there — use the Connect Telegram Bot button in your Detailr dashboard so I know which business this chat belongs to.",
          );
          return Response.json({ ok: true });
        }

        const { data: profile, error: lookupError } = await admin
          .from("profiles")
          .select("id, business_name")
          .eq("telegram_auth_code", code)
          .maybeSingle();

        if (lookupError) {
          console.error("telegram webhook lookup failed:", lookupError.message);
          await send(
            token,
            chatId,
            "Something went wrong on our side. Please tap the Connect button again in a moment.",
          );
          return Response.json({ ok: false }, { status: 500 });
        }

        if (!profile) {
          await send(
            token,
            chatId,
            "I couldn't match that link to an account. Open your Detailr dashboard → Alerts and tap Connect Telegram Bot again.",
          );
          return Response.json({ ok: true, matched: false });
        }

        const { error } = await admin
          .from("profiles")
          .update({ telegram_chat_id: String(chatId) })
          .eq("id", profile.id);

        if (error) {
          console.error("telegram webhook update failed:", error.message);
          await send(token, chatId, "Something went wrong linking this chat. Please try again.");
          return Response.json({ ok: false }, { status: 500 });
        }

        await send(
          token,
          chatId,
          `✅ Connected — ${profile.business_name}\n\nEvery new quote request will land right here.`,
        );
        return Response.json({ ok: true });
      },
    },
  },
});
