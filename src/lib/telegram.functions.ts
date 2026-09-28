import { createServerFn } from "@tanstack/react-start";
import { createHash } from "crypto";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const prepareTelegramLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const token = process.env["TELEGRAM_BOT_TOKEN"];
    if (!token) {
      throw new Error(
        "TELEGRAM_BOT_TOKEN is not configured in your Render environment variables. Please add your Telegram Bot token.",
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

    // Fetch or generate user's unique telegram auth code
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("telegram_auth_code, business_name")
      .eq("id", context.userId)
      .maybeSingle();

    if (profileError) throw new Error(profileError.message);

    let authCode = profile?.telegram_auth_code;
    if (!authCode) {
      authCode = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      await context.supabase
        .from("profiles")
        .update({ telegram_auth_code: authCode })
        .eq("id", context.userId);
    }

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

    // Register Webhook with Telegram (non-blocking if domain pending DNS)
    try {
      const secret = createHash("sha256").update(`telegram-webhook:${token}`).digest("base64url");
      const webhookUrl = `${appUrl}/api/public/telegram/webhook`;
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
        console.warn(`[telegram] setWebhook notice: ${result.description ?? response.statusText}`);
      }
    } catch (whErr) {
      console.warn("[telegram] setWebhook error:", whErr);
    }

    return {
      botUsername: username,
      authCode,
      href: `https://t.me/${username}?start=${encodeURIComponent(authCode)}`,
    };
  });

function fmt(value: number, currency: string): string {
  const amount = Math.round(Number(value) || 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
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
 * Photos are streamed straight from private storage to Telegram — no image
 * bytes are ever stored in the database.
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

    // Anti-cheat: Verify detailer has active access (valid Whop subscription, pending trial, or active trial)
    const isSubscribed =
      (profile.trial_status === "SUBSCRIBED" || profile.trial_status === "ADMIN") &&
      (profile.trial_status === "ADMIN" ||
        (!!profile.whop_membership_id &&
          (profile.whop_membership_id.startsWith("mem_") ||
            profile.whop_membership_id.startsWith("pay_"))));

    const isPendingTrial =
      profile.trial_status === "TRIAL_PENDING" ||
      profile.trial_status === "TRIAL" ||
      !profile.trial_expiry;

    const isTrialActive =
      isPendingTrial ||
      (!!profile.trial_expiry && new Date(profile.trial_expiry).getTime() > Date.now());

    if (!isSubscribed && !isTrialActive && !data.isTest) {
      // Trial expired and not subscribed: send upgrade notification instead of full quote
      const appUrl = process.env["PUBLIC_APP_URL"] || "https://detailr.online";
      const upgradeUrl = `${appUrl.replace(/\/$/, "")}/upgrade`;
      await fetch(`${API}${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `⚠️ <b>Detailr Alert: Quote Request Paused</b>\n\nA customer requested a quote, but your 7-day free trial has expired.\n\n👉 <a href="${upgradeUrl}">Activate Pro Plan to unlock incoming leads</a>`,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
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

    const post = (method: string, payload: unknown) =>
      fetch(`${API}${token}/${method}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });

    try {
      // 1. Prepare photos in-memory binary blobs immediately
      let files: { name: string; blob: Blob }[] = [];

      if (includePhotos) {
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
      }

      // 2. Dispatch text message HTTP request with inline keyboard
      const sendTextPromise = post("sendMessage", {
        chat_id: chatId,
        text: body,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      });

      // 3. Dispatch media HTTP request concurrently
      let sendMediaPromise: Promise<Response | null> = Promise.resolve(null);

      const photoTagStr = shortId ? `\n\n🏷️ #${shortId} #quote_${shortId.toLowerCase()}` : "";

      if (files.length === 1) {
        const form = new FormData();
        form.append("chat_id", String(chatId));
        form.append(
          "caption",
          `📷 Photo from ${data.customerName}${shortId ? ` (#${shortId})` : ""}${photoTagStr}`,
        );
        form.append("photo", files[0]!.blob, files[0]!.name);
        sendMediaPromise = fetch(`${API}${token}/sendPhoto`, {
          method: "POST",
          body: form,
          signal: AbortSignal.timeout(6000),
        });
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
        sendMediaPromise = fetch(`${API}${token}/sendMediaGroup`, {
          method: "POST",
          body: form,
          signal: AbortSignal.timeout(6000),
        });
      }

      // 4. Await text message and photo media group in parallel
      const [resText, resMedia] = await Promise.all([sendTextPromise, sendMediaPromise]);

      if (resText && !resText.ok) {
        console.error("Telegram sendMessage failed", await resText.text());
      }
      if (resMedia && !resMedia.ok) {
        console.error("Telegram sendMedia failed", await resMedia.text());
      }

      if (data.audioPath) {
        const { data: audioFile } = await supabaseAdmin.storage
          .from("quote-photos")
          .download(data.audioPath);
        if (audioFile) {
          const form = new FormData();
          form.append("chat_id", String(chatId));
          form.append("caption", `Voice message from ${data.customerName}`);
          form.append("voice", audioFile, "message.webm");
          const audioRes = await fetch(`${API}${token}/sendVoice`, { method: "POST", body: form });
          if (!audioRes.ok) console.error("Telegram sendVoice failed", await audioRes.text());
        }
      }

      return { sent: true as const };
    } catch (error) {
      console.error("Telegram alert failed", error);
      return { sent: false, reason: "send_failed" as const };
    }
  });
