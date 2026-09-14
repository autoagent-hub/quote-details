import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";
import { getAdminClient } from "@/lib/admin.server";

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
    body: JSON.stringify({ chat_id: chatId, text }),
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
        // Strip any punctuation accidentally copied around the code.
        const code = (match[1] ?? "")
          .trim()
          .replace(/[^a-zA-Z0-9_-]/g, "")
          .toLowerCase();
        if (!code) {
          await send(
            token,
            chatId,
            "Almost there — use the Connect Telegram Bot button in your Detailr dashboard so I know which business this chat belongs to.",
          );
          return Response.json({ ok: true });
        }

        const admin = getAdminClient();
        if (!admin) {
          await send(
            token,
            chatId,
            "I can't reach Detailr right now. Please try again in a minute.",
          );
          return Response.json({ ok: false }, { status: 503 });
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
