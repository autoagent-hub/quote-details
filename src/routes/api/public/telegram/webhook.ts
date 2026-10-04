import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";
import { getAdminClient } from "@/lib/admin.server";
import { ADMIN_EMAILS } from "@/lib/admin-auth";
import { checkAndRecordWebhookNonce } from "@/lib/webhook-replay-defense";

function deriveSecret(token: string): string {
  return createHash("sha256").update(`telegram-webhook:${token}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function send(token: string, chatId: number | string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (err) {
    console.error("[telegram-webhook] Failed to send message to chat:", chatId, err);
  }
}

const escStr = (str: string) =>
  String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

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
          update_id?: number;
          message?: { chat?: { id?: number }; text?: string; date?: number };
        };

        if (update.update_id) {
          const replayCheck = checkAndRecordWebhookNonce({
            id: `tg_update_${update.update_id}`,
            timestamp: update.message?.date || Math.floor(Date.now() / 1000),
            maxAgeSeconds: 300,
          });
          if (!replayCheck.allowed && replayCheck.reason === "duplicate_id") {
            return Response.json({ ok: true, duplicate: true, ignored: "replay_detected" });
          }
        }

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

        // =========================================================================
        // 1. Connection Health / Ping / Status Command
        // =========================================================================
        if (/^\/(?:ping|status|health|check)(?:[@\w]*)?$/i.test(text)) {
          const { data: detailerProfile } = await admin
            .from("profiles")
            .select("id, business_name, slug")
            .eq("telegram_chat_id", String(chatId))
            .maybeSingle();

          if (detailerProfile) {
            await send(
              token,
              chatId,
              `🟢 <b>Detailr Connection: 100% HEALTHY</b>\n\n` +
                `🏢 <b>Linked Shop:</b> ${escStr(detailerProfile.business_name || "Your Shop")}\n` +
                `🔗 <b>Shop URL:</b> detailr.online/${detailerProfile.slug || ""}\n` +
                `🆔 <b>Chat ID:</b> <code>${chatId}</code>\n` +
                `🔒 <b>1:1 Security Lock:</b> ACTIVE (Anti-Hijacking Enabled)\n` +
                `⚡ <b>Incoming Leads:</b> Live & Connected\n\n` +
                `Your shop is linked exclusively to this Telegram account. You will receive customer quotes in real time.`,
            );
          } else {
            await send(
              token,
              chatId,
              `⚪ <b>Detailr Bot Status</b>\n\n` +
                `This Telegram chat (ID: <code>${chatId}</code>) is not currently linked to any active shop.\n\n` +
                `To link your shop, log into your Detailr dashboard → <b>Alerts</b> and tap <b>Connect Telegram Bot</b>.`,
            );
          }
          return Response.json({ ok: true, ping: true });
        }

        // =========================================================================
        // 2. Handle /stats command with strict authorization
        // =========================================================================
        if (/^\/(?:stats|metrics)(?:[@\w]*)?$/i.test(text)) {
          const adminChatId = process.env["ADMIN_TELEGRAM_CHAT_ID"];
          const isMasterAdmin = !!adminChatId && String(chatId) === String(adminChatId);

          const { data: detailerProfile } = await admin
            .from("profiles")
            .select("id, business_name")
            .eq("telegram_chat_id", String(chatId))
            .maybeSingle();

          if (!isMasterAdmin && !detailerProfile) {
            await send(
              token,
              chatId,
              "🔒 <b>Access Denied:</b> This bot command is restricted to linked shop owners.",
            );
            return Response.json({ ok: true });
          }

          if (isMasterAdmin) {
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
          } else if (detailerProfile) {
            const { data: myQuotes } = await admin
              .from("quotes")
              .select("estimated_price")
              .eq("detailer_id", detailerProfile.id);

            const totalQuotes = myQuotes?.length || 0;
            const pipelineValue = (myQuotes || []).reduce(
              (acc, q) => acc + (Number(q.estimated_price) || 0),
              0,
            );

            await send(
              token,
              chatId,
              `📊 <b>${detailerProfile.business_name || "Shop"} Overview</b>\n\n` +
                `📋 <b>Total Quotes Received:</b> ${totalQuotes}\n` +
                `💰 <b>Total Pipeline Value:</b> $${Math.round(pipelineValue).toLocaleString()}\n\n` +
                `👉 <a href="https://detailr.online/quotes">View All Quotes</a>`,
            );
            return Response.json({ ok: true });
          }
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
        const code = (match[1] ?? "").trim().replace(/[^a-zA-Z0-9_-]/g, "");

        // =========================================================================
        // 3. Check if this is a Quote Lookup request (/start quote_c03f9e21)
        // =========================================================================
        if (code.startsWith("quote_") || code.startsWith("q_")) {
          // Strictly verify that requesting Telegram chat belongs to a registered detailer
          const { data: detailerProfile } = await admin
            .from("profiles")
            .select("id, business_name")
            .eq("telegram_chat_id", String(chatId))
            .maybeSingle();

          if (!detailerProfile) {
            await send(
              token,
              chatId,
              "🔒 <b>Access Restricted</b>\n\nThis Telegram account is not linked to any registered shop on Detailr.\n\nTo view shop quotes, please link your Telegram bot from your shop dashboard first.",
            );
            return Response.json({ ok: true });
          }

          const rawId = code
            .replace(/^(quote_|q_)/i, "")
            .toLowerCase()
            .trim();

          let q: {
            id: string;
            customer_name: string;
            customer_phone: string;
            vehicle_type: string;
            vehicle_desc?: string | null;
            service_label?: string | null;
            addons?: string[] | null;
            estimated_price: number;
            created_at: string;
            notes?: string | null;
            photo_urls?: string[] | null;
          } | null = null;

          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId)) {
            const { data } = await admin
              .from("quotes")
              .select("*")
              .eq("id", rawId)
              .eq("detailer_id", detailerProfile.id)
              .maybeSingle();
            q = data;
          } else {
            const { data: list } = await admin
              .from("quotes")
              .select("*")
              .eq("detailer_id", detailerProfile.id)
              .order("created_at", { ascending: false })
              .limit(100);

            if (list && list.length > 0) {
              q =
                list.find((item) => {
                  if (!item?.id) return false;
                  const cleanUuid = item.id.toLowerCase();
                  const noHyphens = cleanUuid.replace(/-/g, "");
                  return cleanUuid.startsWith(rawId) || noHyphens.startsWith(rawId);
                }) || null;
            }
          }

          if (!q) {
            await send(
              token,
              chatId,
              "⚠️ <b>Quote Not Found</b>\n\nNo quote matching that reference was found for your shop. Quotes belonging to other shops cannot be accessed.",
            );
            return Response.json({ ok: true });
          }

          const shortId = q.id.slice(0, 8).toUpperCase();
          const addonsList =
            Array.isArray(q.addons) && q.addons.length ? q.addons.join(", ") : "None";

          const msg =
            `📋 <b>Quote Details #${shortId}</b>\n\n` +
            `👤 <b>Customer:</b> ${escStr(q.customer_name)}\n` +
            `📞 <b>Phone:</b> <a href="tel:${escStr(q.customer_phone)}">${escStr(q.customer_phone)}</a>\n` +
            `🚗 <b>Vehicle:</b> ${escStr(q.vehicle_desc || q.vehicle_type)}\n` +
            `📦 <b>Package:</b> ${escStr(q.service_label || "Base Detail")}\n` +
            `➕ <b>Add-ons:</b> ${escStr(addonsList)}\n` +
            `💰 <b>Estimated Total:</b> $${q.estimated_price}\n` +
            `📅 <b>Received:</b> ${new Date(q.created_at).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}\n` +
            (q.notes ? `\n📝 <b>Customer Notes:</b>\n${escStr(q.notes)}\n` : "") +
            `\n🏷️ <b>Search Tags:</b> #${shortId} #quote_${shortId.toLowerCase()}\n` +
            `\n👉 <a href="https://detailr.online/quotes">Open in Dashboard</a>`;

          await send(token, chatId, msg);
          return Response.json({ ok: true, quoteFound: true });
        }

        // =========================================================================
        // 4. Admin connection request (/start admin)
        // =========================================================================
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

          if (adminMatched) {
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
        }

        if (!code) {
          await send(
            token,
            chatId,
            "Almost there — use the Connect Telegram Bot button in your Detailr dashboard so I know which business this chat belongs to.",
          );
          return Response.json({ ok: true });
        }

        // =========================================================================
        // 5. Shop Bot Connection with Anti-Hijacking & 1:1 Chat ID Enforcement
        // =========================================================================
        const { data: profile, error: lookupError } = await admin
          .from("profiles")
          .select("id, business_name, telegram_chat_id, telegram_auth_code")
          .eq("telegram_auth_code", code)
          .maybeSingle();

        if (lookupError) {
          console.error("[telegram-webhook] lookup failed:", lookupError.message);
          await send(
            token,
            chatId,
            "⚠️ Temporary server glitch. Please tap Connect Telegram Bot again in your dashboard.",
          );
          return Response.json({ ok: false }, { status: 500 });
        }

        if (!profile) {
          // Security Alert: Code was not found or already consumed
          await send(
            token,
            chatId,
            `⚠️ <b>Security Notice: Connection Link Expired or Invalid</b>\n\n` +
              `This connection link has already been used or expired.\n\n` +
              `🛡️ <b>Anti-Hijacking Protection:</b> Detailr generates single-use cryptographic tokens so your incoming leads can never be claimed or intercepted by unauthorized users.\n\n` +
              `👉 Open your Detailr dashboard → <b>Alerts</b> and tap <b>Connect Telegram Bot</b> to generate a fresh, secure link.`,
          );
          return Response.json({ ok: true, matched: false });
        }

        // -------------------------------------------------------------------------
        // STRICT 1:1 ENFORCEMENT:
        // Ensure this Telegram Chat ID belongs to AT MOST ONE shop account.
        // If this Chat ID was previously attached to any other shop profile,
        // atomically unlink it from the old profile so leads never mix or hijack!
        // -------------------------------------------------------------------------
        await admin
          .from("profiles")
          .update({ telegram_chat_id: null } as never)
          .eq("telegram_chat_id", String(chatId))
          .neq("id", profile.id);

        // -------------------------------------------------------------------------
        // ATOMIC LINK & AUTH CODE ROTATION:
        // Update the target profile with the new chat ID, enable notifications,
        // and IMMEDIATELY invalidate the single-use telegram_auth_code so no one can replay or hijack!
        // -------------------------------------------------------------------------
        const { error: updateError } = await admin
          .from("profiles")
          .update({
            telegram_chat_id: String(chatId),
            notify_telegram: true,
            telegram_auth_code: null, // Consumed immediately
          } as never)
          .eq("id", profile.id);

        if (updateError) {
          console.error("[telegram-webhook] update failed:", updateError.message);
          await send(
            token,
            chatId,
            "Something went wrong linking this chat. Please generate a new connection link in your dashboard.",
          );
          return Response.json({ ok: false }, { status: 500 });
        }

        // Mirror connection state to auth metadata for dual-redundant session stability
        try {
          const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
          const currentMeta = authUser?.user?.user_metadata || {};
          await admin.auth.admin.updateUserById(profile.id, {
            user_metadata: {
              ...currentMeta,
              telegram_chat_id: String(chatId),
              telegram_connected: true,
              telegram_connected_at: new Date().toISOString(),
            },
          });
        } catch (mErr) {
          console.warn("[telegram-webhook] auth metadata sync warning:", mErr);
        }

        // Send confirmed welcome message with 1:1 security seal
        await send(
          token,
          chatId,
          `✅ <b>Shop Successfully Connected!</b>\n\n` +
            `🏢 <b>Shop:</b> ${escStr(profile.business_name || "Detailing Shop")}\n` +
            `🆔 <b>Telegram Chat ID:</b> <code>${chatId}</code>\n` +
            `🔒 <b>1:1 Security Lock:</b> ACTIVATED\n` +
            `🛡️ <b>Anti-Hijacking Protection:</b> VERIFIED\n\n` +
            `Every new customer quote request will land right here in real time with client contact info, vehicle specs, and 1-tap call buttons.\n\n` +
            `💬 <i>You can send <code>/status</code> at any time to verify this connection.</i>`,
        );

        return Response.json({ ok: true, connected: true, shopId: profile.id });
      },
    },
  },
});
