import { createServerFn } from "@tanstack/react-start";
import { createHash, randomBytes } from "crypto";

import {
  requireActiveSubscription,
  verifyServerSubscriptionAccess,
} from "@/lib/subscription-guard.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/lib/admin.server";

type AlertInput = {
  quoteId?: string;
  detailerId: string;
  customerName: string;
  customerPhone: string;
  vehicle: string;
  service: { label: string; price: number };
  addons: { label: string; price: number }[];
  estimate: number;
  notes?: string;
  photoPaths?: string[];
  photosBase64?: string[];
  audioPath?: string | null;
  isTest?: boolean;
};

const API = "https://api.telegram.org/bot";

/**
 * Resilient fetch with exponential backoff retry for Telegram API calls.
 * Ensures momentary network hiccups or rate limits do not drop customer leads.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        // Rate limited by Telegram: respect Retry-After
        const retryAfter = Number(res.headers.get("Retry-After")) || 1;
        await new Promise((r) => setTimeout(r, Math.min(retryAfter * 1000, 3000)));
        continue;
      }
      if (res.status >= 500 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err: unknown) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error("Telegram request failed after retries");
}

export const getTelegramBotUsername = createServerFn({ method: "GET" }).handler(async () => {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) return { username: null };
  let username = process.env["TELEGRAM_BOT_USERNAME"] || null;
  if (!username) {
    try {
      const res = await fetch(`${API}${token}/getMe`);
      const me = (await res.json()) as { ok?: boolean; result?: { username?: string } };
      if (me.ok && me.result?.username) {
        username = me.result.username;
      }
    } catch {
      // ignore
    }
  }
  return { username };
});

/**
 * Prepares a fresh, single-use, anti-hijacking connection link.
 * Every time a user opens the connect modal, a new cryptographically random token
 * is generated so previous codes cannot be replayed or hijacked.
 */
export const prepareTelegramLink = createServerFn({ method: "POST" })
  .middleware([requireActiveSubscription])
  .handler(async ({ context }) => {
    const token = process.env["TELEGRAM_BOT_TOKEN"];
    if (!token) {
      throw new Error(
        "TELEGRAM_BOT_TOKEN is not configured in your environment variables. Please add your Telegram Bot token.",
      );
    }

    // Determine public webhook URL
    let rawUrl =
      process.env["PUBLIC_APP_URL"] ||
      process.env["RENDER_EXTERNAL_URL"] ||
      "https://detailr.online";
    if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
      rawUrl = `https://${rawUrl}`;
    }
    const appUrl = rawUrl.replace(/\/$/, "");

    // Generate fresh, single-use, cryptographically secure auth code (anti-hijacking)
    const randomHex = randomBytes(8).toString("hex");
    const authCode = `link_${randomHex}`;

    const { error: profileError } = await context.supabase
      .from("profiles")
      .update({ telegram_auth_code: authCode })
      .eq("id", context.userId);

    if (profileError) throw new Error(profileError.message);

    // Resolve Bot username
    let username = process.env["TELEGRAM_BOT_USERNAME"];
    try {
      const meResponse = await fetch(`${API}${token}/getMe`);
      const me = (await meResponse.json()) as { ok?: boolean; result?: { username?: string } };
      if (me.ok && me.result?.username) {
        username = me.result.username;
      }
    } catch (err) {
      console.warn("[telegram] getMe check failed:", err);
    }

    if (!username) {
      throw new Error("Could not connect to Telegram bot. Please verify your TELEGRAM_BOT_TOKEN.");
    }

    // Ensure webhook is active on Telegram with auto-healing
    try {
      const secret = createHash("sha256").update(`telegram-webhook:${token}`).digest("base64url");
      const webhookUrl = `${appUrl}/api/public/telegram/webhook`;

      // Check current webhook status
      const infoRes = await fetch(`${API}${token}/getWebhookInfo`);
      const info = (await infoRes.json()) as {
        ok?: boolean;
        result?: { url?: string; has_custom_certificate?: boolean; pending_update_count?: number };
      };

      // If webhook is not set or points to wrong endpoint, re-register immediately
      if (!info.ok || info.result?.url !== webhookUrl) {
        const response = await fetch(`${API}${token}/setWebhook`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            url: webhookUrl,
            secret_token: secret,
            allowed_updates: ["message"],
            drop_pending_updates: false,
          }),
        });
        const result = (await response.json()) as { ok?: boolean; description?: string };
        if (!response.ok || !result.ok) {
          console.warn(
            `[telegram] setWebhook notice: ${result.description ?? response.statusText}`,
          );
        }
      }
    } catch (whErr) {
      console.warn("[telegram] setWebhook check error:", whErr);
    }

    return {
      botUsername: username,
      authCode,
      href: `https://t.me/${username}?start=${encodeURIComponent(authCode)}`,
    };
  });

/**
 * Authoritative, non-cached check of the user's live Telegram connection status.
 * Directly queries PostgreSQL using admin privileges to bypass any RLS latency or cache drift.
 */
export const getTelegramConnectionStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = getAdminClient();
    const db = admin ?? context.supabase;

    const { data: profile } = await db
      .from("profiles")
      .select("telegram_chat_id, notify_telegram, business_name")
      .eq("id", context.userId)
      .maybeSingle();

    return {
      connected: !!profile?.telegram_chat_id,
      chatId: profile?.telegram_chat_id || null,
      notifyTelegram: profile?.notify_telegram ?? true,
      businessName: profile?.business_name || null,
    };
  });

/**
 * Safely unlinks the Telegram bot from the account.
 * Clears chat ID and any lingering auth codes to ensure complete privacy.
 */
export const disconnectTelegramBot = createServerFn({ method: "POST" })
  .middleware([requireActiveSubscription])
  .handler(async ({ context }) => {
    const admin = getAdminClient();
    const db = admin ?? context.supabase;

    const { error } = await db
      .from("profiles")
      .update({
        telegram_chat_id: null,
        telegram_auth_code: null,
      })
      .eq("id", context.userId);

    if (error) throw new Error(error.message);

    if (admin) {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
        const currentMeta = authUser?.user?.user_metadata || {};
        await admin.auth.admin.updateUserById(context.userId, {
          user_metadata: {
            ...currentMeta,
            telegram_chat_id: null,
            telegram_connected: false,
          },
        });
      } catch {
        /* ignore */
      }
    }

    return { disconnected: true };
  });

/**
 * Checks overall Telegram webhook health and verifies if bot is responsive.
 */
export const checkTelegramWebhookHealth = createServerFn({ method: "GET" }).handler(async () => {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) return { healthy: false, reason: "missing_token" };

  try {
    const infoRes = await fetch(`${API}${token}/getWebhookInfo`);
    const info = (await infoRes.json()) as {
      ok?: boolean;
      result?: {
        url?: string;
        pending_update_count?: number;
        last_error_message?: string;
        last_error_date?: number;
      };
    };

    if (!info.ok || !info.result?.url) {
      return { healthy: false, reason: "webhook_not_configured" };
    }

    return {
      healthy: true,
      url: info.result.url,
      pendingUpdates: info.result.pending_update_count || 0,
      lastError: info.result.last_error_message || null,
    };
  } catch (err) {
    return { healthy: false, reason: "network_error", error: String(err) };
  }
});

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  NGN: "₦",
  GBP: "£",
  EUR: "€",
  CAD: "$",
  AUD: "$",
  ZAR: "R",
  INR: "₹",
  KES: "KSh ",
  GHS: "GH₵ ",
};

function fmt(value: number, currency: string): string {
  const amount = Math.round(Number(value) || 0);
  const code = (currency || "USD").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] || `${code} `;
  const formattedAmount = amount.toLocaleString("en-US");
  return `${symbol}${formattedAmount}`;
}

function esc(text: string): string {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function pad(label: string, price: string, width = 26): string {
  const dots = Math.max(1, width - label.length);
  return `${esc(label)}${" ".repeat(dots)}${price}`;
}

/**
 * Sends a real-time quote alert to the detailer's Telegram chat.
 * Built with retry resilience: if photo streaming encounters a timeout,
 * the primary text message with the customer's phone number and quote estimate
 * is GUARANTEED to be delivered.
 */
export const sendQuoteAlert = createServerFn({ method: "POST" })
  .inputValidator((data: AlertInput) => data)
  .handler(async ({ data }) => {
    const token = process.env["TELEGRAM_BOT_TOKEN"];
    if (!token) return { sent: false, reason: "no_bot_token" as const };

    const { getAdminClient } = await import("@/lib/admin.server");
    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) return { sent: false, reason: "no_admin_client" as const };
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select(
        "telegram_chat_id, business_name, currency, notify_telegram, notify_include_photos, notify_include_notes, trial_status, trial_expiry, whop_membership_id",
      )
      .eq("id", data.detailerId)
      .maybeSingle();

    const chatId = profile?.telegram_chat_id;
    if (!chatId) return { sent: false, reason: "not_connected" as const };
    if (profile.notify_telegram === false) return { sent: false, reason: "muted" as const };

    // Server-Side Subscription Check: Validate against database
    const subAccess = await verifyServerSubscriptionAccess(data.detailerId);

    if (subAccess.isSuspended) {
      return { sent: false, reason: "account_suspended" as const };
    }

    if (!subAccess.hasAccess && !data.isTest) {
      // Trial expired and not subscribed: send upgrade notification instead of leaking full quote
      const appUrl = process.env["PUBLIC_APP_URL"] || "https://detailr.online";
      const upgradeUrl = `${appUrl.replace(/\/$/, "")}/upgrade`;
      await fetchWithRetry(
        `${API}${token}/sendMessage`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `⚠️ <b>Detailr Alert: Quote Request Paused</b>\n\nA customer requested a quote, but your 7-day free trial has expired.\n\n👉 <a href="${upgradeUrl}">Activate Pro Plan to unlock incoming leads</a>`,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        },
        1,
      );
      return { sent: false, reason: "trial_expired" as const };
    }

    let botUsername = process.env["TELEGRAM_BOT_USERNAME"] || "DetailrBot";
    if (!process.env["TELEGRAM_BOT_USERNAME"]) {
      try {
        const meRes = await fetch(`${API}${token}/getMe`);
        const me = (await meRes.json()) as { ok?: boolean; result?: { username?: string } };
        if (me.ok && me.result?.username) {
          botUsername = me.result.username;
        }
      } catch {
        // fallback to default
      }
    }

    const currency = profile.currency || "USD";
    const shortId = data.quoteId ? data.quoteId.slice(0, 8).toUpperCase() : "";
    const b64Photos = (data.photosBase64 ?? []).slice(0, 10);
    const legacyPhotos = (data.photoPaths ?? []).slice(0, 10);
    const hasBase64 = b64Photos.length > 0;
    const hasPhotos = hasBase64 || legacyPhotos.length > 0;
    const includePhotos = hasPhotos && profile.notify_include_photos !== false;

    const items = [
      pad(data.service.label, fmt(data.service.price, currency)),
      ...data.addons.map((a) => pad(a.label, fmt(a.price, currency))),
    ];

    const body = [
      data.isTest ? `🧪 <b>TEST REQUEST — not a real customer</b>` : `🚨 <b>NEW QUOTE REQUEST</b>`,
      shortId ? `🆔 <b>QUOTE ID: <code>#${shortId}</code></b>` : "",
      profile.business_name ? `<i>${esc(profile.business_name)}</i>` : "",
      ``,
      `👤 <b>Customer:</b> ${esc(data.customerName)}`,
      `📞 <b>Phone:</b> <a href="tel:${esc(data.customerPhone)}">${esc(data.customerPhone)}</a>`,
      `🚗 <b>Vehicle:</b> ${esc(data.vehicle)}`,
      ``,
      `<b>Requested Services:</b>`,
      `<pre>${items.join("\n")}</pre>`,
      `💰 <b>Estimated Total: ${fmt(data.estimate, currency)}</b>`,
      includePhotos
        ? `\n📷 <b>${hasBase64 ? b64Photos.length : legacyPhotos.length} photo${(hasBase64 ? b64Photos.length : legacyPhotos.length) === 1 ? "" : "s"} attached below:</b>`
        : "",
      data.notes && profile.notify_include_notes !== false
        ? `\n📝 <b>Customer Notes:</b>\n${esc(data.notes)}`
        : "",
      shortId ? `\n🏷️ <b>Search Tags:</b> #${shortId} #quote_${shortId.toLowerCase()}` : "",
    ]
      .filter((line) => line !== "")
      .join("\n");

    const replyMarkup = shortId
      ? {
          inline_keyboard: [
            [
              {
                text: `📋 View Quote Details (#${shortId})`,
                url: `https://t.me/${botUsername}?start=quote_${shortId.toLowerCase()}`,
              },
            ],
          ],
        }
      : undefined;

    try {
      // 1. Send text message with retry (Primary Lead Data)
      let textSent = false;
      try {
        const resText = await fetchWithRetry(
          `${API}${token}/sendMessage`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: body,
              parse_mode: "HTML",
              disable_web_page_preview: true,
              ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
            }),
            signal: AbortSignal.timeout(8000),
          },
          2,
        );

        if (resText.ok) {
          textSent = true;
        } else {
          console.error(
            "[telegram] sendMessage error status:",
            resText.status,
            await resText.text(),
          );
        }
      } catch (textErr) {
        console.error("[telegram] sendMessage fatal error:", textErr);
      }

      // 2. Prepare and dispatch photos if present (Non-blocking fallback)
      if (includePhotos) {
        try {
          let files: { name: string; blob: Blob }[] = [];

          if (hasBase64) {
            files = b64Photos.map((b64, index) => {
              const parts = b64.split(",");
              const mime = parts[0]?.match(/:(.*?);/)?.[1] || "image/jpeg";
              const bstr = atob(parts[1] || parts[0]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) u8arr[n] = bstr.charCodeAt(n);
              return {
                name: `photo${index}.jpg`,
                blob: new Blob([u8arr], { type: mime }),
              };
            });
          } else if (legacyPhotos.length > 0) {
            const photoDownloads = legacyPhotos.map(async (path, index) => {
              try {
                const downloadPromise = supabaseAdmin.storage.from("quote-photos").download(path);
                const timeoutPromise = new Promise<{ data: null }>((res) =>
                  setTimeout(() => res({ data: null }), 3000),
                );
                const { data: file } = await Promise.race([downloadPromise, timeoutPromise]);
                if (file) return { name: `photo${index}.jpg`, blob: file };
              } catch (err) {
                console.warn(`[telegram] Photo download failed for ${path}:`, err);
              }
              return null;
            });

            const fileResults = await Promise.all(photoDownloads);
            files = fileResults.filter((f): f is { name: string; blob: Blob } => f !== null);
          }

          const photoTagStr = shortId ? `\n\n🏷️ #${shortId} #quote_${shortId.toLowerCase()}` : "";

          if (files.length === 1) {
            const form = new FormData();
            form.append("chat_id", String(chatId));
            form.append(
              "caption",
              `📷 Photo from ${data.customerName}${shortId ? ` (#${shortId})` : ""}${photoTagStr}`,
            );
            form.append("photo", files[0]!.blob, files[0]!.name);
            await fetchWithRetry(
              `${API}${token}/sendPhoto`,
              {
                method: "POST",
                body: form,
                signal: AbortSignal.timeout(8000),
              },
              1,
            ).catch((e) => console.warn("[telegram] sendPhoto fallback caught:", e));
          } else if (files.length > 1) {
            const form = new FormData();
            form.append("chat_id", String(chatId));
            form.append(
              "media",
              JSON.stringify(
                files.map((f, i) => ({
                  type: "photo",
                  media: `attach://${f.name}`,
                  ...(i === 0
                    ? {
                        caption: `📷 Photos from ${data.customerName}${shortId ? ` (#${shortId})` : ""}${photoTagStr}`,
                      }
                    : {}),
                })),
              ),
            );
            for (const f of files) form.append(f.name, f.blob, f.name);
            await fetchWithRetry(
              `${API}${token}/sendMediaGroup`,
              {
                method: "POST",
                body: form,
                signal: AbortSignal.timeout(10000),
              },
              1,
            ).catch((e) => console.warn("[telegram] sendMediaGroup fallback caught:", e));
          }
        } catch (mediaErr) {
          console.warn("[telegram] Media dispatch warning (text was already handled):", mediaErr);
        }
      }

      if (data.audioPath) {
        try {
          const { data: audioFile } = await supabaseAdmin.storage
            .from("quote-photos")
            .download(data.audioPath);
          if (audioFile) {
            const form = new FormData();
            form.append("chat_id", String(chatId));
            form.append("caption", `Voice message from ${data.customerName}`);
            form.append("voice", audioFile, "message.webm");
            await fetch(`${API}${token}/sendVoice`, { method: "POST", body: form });
          }
        } catch (audioErr) {
          console.warn("[telegram] Audio dispatch warning:", audioErr);
        }
      }

      return { sent: textSent as const };
    } catch (error) {
      console.error("[telegram] Critical send failure:", error);
      return { sent: false, reason: "send_failed" as const };
    }
  });
