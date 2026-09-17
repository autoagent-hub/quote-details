import { createServerFn } from "@tanstack/react-start";
import { getAdminClient } from "@/lib/admin.server";
import { ADMIN_EMAILS } from "@/lib/admin-auth";

const API = "https://api.telegram.org/bot";

export type AdminAlertSeverity = "INFO" | "WARNING" | "HIGH" | "CRITICAL";

export interface AdminTelegramNotificationParams {
  type: "NEW_SIGNUP" | "SUSPICIOUS_ACTIVITY" | "USER_SUSPENDED" | "TEST_ALERT" | "SECURITY_AUDIT";
  title?: string;
  severity?: AdminAlertSeverity;
  userEmail?: string;
  businessName?: string;
  userId?: string;
  reason?: string;
  details?: Record<string, unknown> | string;
  actionUrl?: string;
}

/**
 * Resolves all active admin Telegram Chat IDs
 */
export async function getAdminTelegramChatIds(): Promise<string[]> {
  const chatIds = new Set<string>();

  // 1. Check environment variables
  const envChatId =
    process.env["TELEGRAM_ADMIN_CHAT_ID"] ||
    process.env["ADMIN_TELEGRAM_CHAT_ID"] ||
    process.env["ADMIN_CHAT_ID"];
  if (envChatId) {
    envChatId.split(",").forEach((id) => {
      const trimmed = id.trim();
      if (trimmed) chatIds.add(trimmed);
    });
  }

  // 2. Check Admin Profiles in Supabase
  const admin = getAdminClient();
  if (admin) {
    try {
      const { data: users } = await admin.auth.admin.listUsers();
      for (const u of users?.users || []) {
        if (u.email && ADMIN_EMAILS.includes(u.email.toLowerCase())) {
          // Check user metadata
          const meta = (u.user_metadata || {}) as Record<string, unknown>;
          if (
            typeof meta["admin_telegram_chat_id"] === "string" &&
            meta["admin_telegram_chat_id"]
          ) {
            chatIds.add(meta["admin_telegram_chat_id"].trim());
          }

          // Check profile table
          const { data: profile } = await admin
            .from("profiles")
            .select("telegram_chat_id")
            .eq("id", u.id)
            .maybeSingle();

          if (profile?.telegram_chat_id) {
            chatIds.add(profile.telegram_chat_id.trim());
          }
        }
      }
    } catch (err) {
      console.warn("[admin-telegram] Error querying admin profiles:", err);
    }
  }

  return Array.from(chatIds);
}

function esc(text: string): string {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Dispatch an HTML notification directly to administrator's Telegram chat(s)
 */
export async function sendAdminTelegramAlert(
  params: AdminTelegramNotificationParams,
): Promise<{ sent: boolean; count: number; error?: string }> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) {
    console.warn("[admin-telegram] TELEGRAM_BOT_TOKEN is not configured.");
    return { sent: false, count: 0, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const chatIds = await getAdminTelegramChatIds();
  if (chatIds.length === 0) {
    console.warn("[admin-telegram] No admin Telegram chat ID configured or connected.");
    return { sent: false, count: 0, error: "No admin Telegram chat ID connected" };
  }

  const rawUrl =
    process.env["PUBLIC_APP_URL"] || process.env["RENDER_EXTERNAL_URL"] || "https://detailr.online";
  const appUrl = rawUrl.replace(/\/$/, "");
  const adminConsoleUrl = `${appUrl}/master-hq`;

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  let messageHtml = "";

  if (params.type === "NEW_SIGNUP") {
    messageHtml = [
      `🚀 <b>NEW USER REGISTRATION</b>`,
      ``,
      `📧 <b>Email:</b> <code>${esc(params.userEmail || "Unknown")}</code>`,
      params.businessName ? `🏢 <b>Business:</b> <i>${esc(params.businessName)}</i>` : "",
      `⏱️ <b>Time:</b> <code>${timestamp}</code>`,
      `🎯 <b>Trial Status:</b> 7-Day Free Trial (Awaiting 1st Link Visit)`,
      ``,
      `👉 <a href="${adminConsoleUrl}">Open Master Admin Console</a>`,
    ]
      .filter((l) => l !== "")
      .join("\n");
  } else if (params.type === "SUSPICIOUS_ACTIVITY") {
    const severityIcon =
      params.severity === "CRITICAL"
        ? "🔴 CRITICAL"
        : params.severity === "HIGH"
          ? "🚨 HIGH"
          : "🟠 WARNING";

    let detailsStr = "";
    if (typeof params.details === "string") {
      detailsStr = params.details;
    } else if (params.details) {
      detailsStr = JSON.stringify(params.details, null, 2);
    }

    messageHtml = [
      `🚨 <b>SECURITY ALERT: SUSPICIOUS ACTIVITY</b>`,
      `⚠️ <b>Severity:</b> ${severityIcon}`,
      ``,
      params.userEmail ? `👤 <b>Target User:</b> <code>${esc(params.userEmail)}</code>` : "",
      params.businessName ? `🏢 <b>Business:</b> <i>${esc(params.businessName)}</i>` : "",
      params.reason ? `🔍 <b>Flag Reason:</b> <b>${esc(params.reason)}</b>` : "",
      detailsStr ? `📋 <b>Details:</b> <code>${esc(detailsStr)}</code>` : "",
      `⏱️ <b>Detected At:</b> <code>${timestamp}</code>`,
      ``,
      `⚡ <b>Quick Actions:</b>`,
      `👉 <a href="${params.actionUrl || adminConsoleUrl}">Inspect & Suspend User in Admin HQ</a>`,
    ]
      .filter((l) => l !== "")
      .join("\n");
  } else if (params.type === "USER_SUSPENDED") {
    messageHtml = [
      `🛡️ <b>ACCOUNT SUSPENDED / RESTRICTED</b>`,
      ``,
      `👤 <b>User:</b> <code>${esc(params.userEmail || "Unknown")}</code>`,
      params.reason ? `📝 <b>Reason:</b> ${esc(params.reason)}` : "",
      `⏱️ <b>Timestamp:</b> <code>${timestamp}</code>`,
      ``,
      `👉 <a href="${adminConsoleUrl}">Manage Account</a>`,
    ]
      .filter((l) => l !== "")
      .join("\n");
  } else {
    // Test alert
    messageHtml = [
      `🧪 <b>Detailr Admin Telegram Bot Alert Test</b>`,
      ``,
      `✅ <b>Status:</b> Operational & Verified`,
      `🔔 <b>Active Subscriptions:</b>`,
      `• 🚀 New User Registrations`,
      `• 🚨 Suspicious Activity & Rate-Limit Spikes`,
      `• 🛡️ Account Bans & Security Violations`,
      ``,
      `⏱️ <b>Time:</b> <code>${timestamp}</code>`,
      `👉 <a href="${adminConsoleUrl}">Open Master Admin Console</a>`,
    ].join("\n");
  }

  let successCount = 0;
  for (const chatId of chatIds) {
    try {
      const res = await fetch(`${API}${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageHtml,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });

      if (res.ok) {
        successCount++;
      } else {
        const errText = await res.text();
        console.error(`[admin-telegram] Failed sending to chatId ${chatId}:`, errText);
      }
    } catch (err) {
      console.error(`[admin-telegram] Error sending to chatId ${chatId}:`, err);
    }
  }

  return {
    sent: successCount > 0,
    count: successCount,
    error: successCount === 0 ? "Failed delivering alert to telegram chats" : undefined,
  };
}

/**
 * Fetches admin telegram configuration and connection status for the Admin UI
 */
export const getAdminTelegramStatus = createServerFn({ method: "GET" }).handler(async () => {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  let botUsername = process.env["TELEGRAM_BOT_USERNAME"] || "";

  if (token && !botUsername) {
    try {
      const meRes = await fetch(`${API}${token}/getMe`);
      const me = (await meRes.json()) as { ok?: boolean; result?: { username?: string } };
      if (me.ok && me.result?.username) {
        botUsername = me.result.username;
      }
    } catch (err) {
      console.warn("[admin-telegram] getMe check failed:", err);
    }
  }

  const chatIds = await getAdminTelegramChatIds();
  const isConnected = chatIds.length > 0;

  return {
    botConfigured: !!token,
    botUsername: botUsername || "DetailrAlertsBot",
    isConnected,
    chatIds,
    connectLink: botUsername ? `https://t.me/${botUsername}?start=admin` : null,
    primaryChatId: chatIds[0] || null,
  };
});

/**
 * Updates administrator Telegram settings (e.g. manual Chat ID, toggle flags)
 */
export const updateAdminTelegramSettings = createServerFn({ method: "POST" })
  .validator(
    (data: { chatId?: string; notifySignups?: boolean; notifySuspicious?: boolean }) => data,
  )
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    if (!admin) return { success: false, error: "Database client unavailable" };

    try {
      const { data: users } = await admin.auth.admin.listUsers();
      for (const u of users?.users || []) {
        if (u.email && ADMIN_EMAILS.includes(u.email.toLowerCase())) {
          const meta = (u.user_metadata || {}) as Record<string, unknown>;
          await admin.auth.admin.updateUserById(u.id, {
            user_metadata: {
              ...meta,
              ...(data.chatId !== undefined ? { admin_telegram_chat_id: data.chatId.trim() } : {}),
              ...(data.notifySignups !== undefined
                ? { admin_notify_signups: data.notifySignups }
                : {}),
              ...(data.notifySuspicious !== undefined
                ? { admin_notify_suspicious: data.notifySuspicious }
                : {}),
            },
          });

          if (data.chatId) {
            await admin
              .from("profiles")
              .update({ telegram_chat_id: data.chatId.trim() } as never)
              .eq("id", u.id);
          }
        }
      }

      return { success: true, message: "Admin Telegram notification settings saved!" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update settings";
      return { success: false, error: msg };
    }
  });

/**
 * Sends an instant test alert to the administrator's Telegram
 */
export const sendAdminTelegramTestAlert = createServerFn({ method: "POST" }).handler(async () => {
  const result = await sendAdminTelegramAlert({
    type: "TEST_ALERT",
  });

  if (result.sent) {
    return {
      success: true,
      message: `Test alert successfully dispatched to ${result.count} Telegram chat(s)!`,
    };
  } else {
    return {
      success: false,
      error:
        result.error ||
        "Could not deliver test alert. Please click 'Connect Telegram Bot' in the admin panel or provide your Chat ID.",
    };
  }
});

/**
 * Flags a user as suspicious, records audit notes, and alerts admin via Telegram
 */
export const adminFlagUserSuspicious = createServerFn({ method: "POST" })
  .validator(
    (data: { userId: string; reason: string; severity?: AdminAlertSeverity; details?: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    if (!admin) return { success: false, error: "Database client unavailable" };

    try {
      const { data: userData, error: userError } = await admin.auth.admin.getUserById(data.userId);
      if (userError || !userData?.user) {
        return { success: false, error: "Target user not found" };
      }

      const user = userData.user;
      const meta = (user.user_metadata || {}) as Record<string, unknown>;

      const { data: profile } = await admin
        .from("profiles")
        .select("business_name, slug")
        .eq("id", data.userId)
        .maybeSingle();

      // Update user metadata with suspicious flag
      await admin.auth.admin.updateUserById(data.userId, {
        user_metadata: {
          ...meta,
          is_flagged_suspicious: true,
          suspicious_flag_reason: data.reason,
          suspicious_flagged_at: new Date().toISOString(),
          suspicious_severity: data.severity || "HIGH",
        },
      });

      // Dispatch Telegram alert to admin
      await sendAdminTelegramAlert({
        type: "SUSPICIOUS_ACTIVITY",
        severity: data.severity || "HIGH",
        userEmail: user.email,
        businessName: profile?.business_name,
        userId: data.userId,
        reason: data.reason,
        details: data.details,
      });

      return {
        success: true,
        message: `User ${user.email} flagged as suspicious and alert dispatched to Admin Telegram.`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to flag user";
      return { success: false, error: msg };
    }
  });
