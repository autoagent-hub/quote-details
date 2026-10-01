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

        // Handle /stats command with strict authorization
        if (/^\/(?:stats|metrics)(?:[@\w]*)?$/i.test(text)) {
          const adminChatId = process.env["ADMIN_TELEGRAM_CHAT_ID"];
          const isMasterAdmin = !!adminChatId && chatId === adminChatId;

          const { data: detailerProfile } = await admin
            .from("profiles")
            .select("id, business_name")
            .eq("telegram_chat_id", chatId)
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
                `👉 <a href="https://detailr.online/dashboard/quotes">View Quotes</a>`,
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
        const code = (match[1] ?? "")
          .trim()
          .replace(/[^a-zA-Z0-9_-]/g, "")
          .toLowerCase();

        // 0. Check if this is a Quote Lookup request (/start quote_c03f9e21 or /start q_c03f9e21)
        if (code.startsWith("quote_") || code.startsWith("q_")) {
          // Security Check: Verify that the requesting Telegram chat belongs to a registered detailer
          const { data: detailerProfile } = await admin
            .from("profiles")
            .select("id, business_name")
            .eq("telegram_chat_id", chatId)
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
            // Strictly scoped to the authenticated detailer's shop
            const { data } = await admin
              .from("quotes")
              .select("*")
              .eq("id", rawId)
              .eq("detailer_id", detailerProfile.id)
              .maybeSingle();
            q = data;
          } else {
            // Strictly scoped to the authenticated detailer's shop
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

          const escStr = (str: string) =>
            String(str || "")
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");

          if (q) {
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
              `\n💬 <i>Tip: Tap <b>#${shortId}</b> above to search chat history and highlight attached photos!</i>\n` +
              `👉 <a href="https://detailr.online/dashboard/quotes">Open in Dashboard</a>`;

            const photoUrls: string[] = [];
            if (Array.isArray(q.photo_urls)) {
              for (const pathOrUrl of q.photo_urls) {
                if (typeof pathOrUrl === "string" && pathOrUrl.trim()) {
                  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
                    photoUrls.push(pathOrUrl);
                  } else {
                    const { data: pubData } = admin.storage
                      .from("quote-photos")
                      .getPublicUrl(pathOrUrl);
                    if (pubData?.publicUrl) {
                      photoUrls.push(pubData.publicUrl);
                    }
                  }
                }
              }
            }

            if (photoUrls.length === 1) {
              await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  photo: photoUrls[0],
                  caption: msg,
                  parse_mode: "HTML",
                }),
              }).catch((e) => console.warn("[telegram-webhook] sendPhoto error:", e));
            } else if (photoUrls.length > 1) {
              const mediaGroup = photoUrls.slice(0, 10).map((url, idx) => ({
                type: "photo",
                media: url,
                ...(idx === 0
                  ? { caption: `📷 ${photoUrls.length} Vehicle Photos Attached (#${shortId})` }
                  : {}),
              }));

              await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  media: mediaGroup,
                }),
              }).catch((e) => console.warn("[telegram-webhook] sendMediaGroup error:", e));

              await send(token, chatId, msg);
            } else {
              await send(token, chatId, msg);
            }

            return Response.json({ ok: true, quoteFound: true });
          } else {
            await send(
              token,
              chatId,
              `🔍 Could not find Quote #${rawId.toUpperCase()} in your quote history.`,
            );
            return Response.json({ ok: true, quoteFound: false });
          }
        }

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
