import { createServerFn } from "@tanstack/react-start";
import { getAdminClient } from "@/lib/admin.server";

export interface LinkVisitResult {
  ok: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  trialActivated?: boolean;
  viewsCount?: number;
}

/**
 * Server function invoked when a visitor opens a detailer's public quote page (detailr.online/$slug).
 *
 * 1. Checks if the detailer is banned / suspended.
 * 2. Increments the detailer's link view counter.
 * 3. Starts the 7-day free trial IF this is the first customer visit (trial_status === 'TRIAL_PENDING').
 */
export const recordPublicLinkVisit = createServerFn({ method: "POST" })
  .validator((data: { slug: string; isTest?: boolean }) => data)
  .handler(async ({ data }): Promise<LinkVisitResult> => {
    const admin = getAdminClient();
    if (!admin || !data.slug) {
      return { ok: false, isSuspended: false };
    }

    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("id, trial_status, trial_expiry, telegram_chat_id, business_name, notify_telegram")
        .eq("slug", data.slug)
        .maybeSingle();

      if (!profile) {
        return { ok: false, isSuspended: false };
      }

      // 1. Check if user is suspended or banned
      if (profile.trial_status === "SUSPENDED" || profile.trial_status === "BANNED") {
        return {
          ok: true,
          isSuspended: true,
          suspensionReason: "This shop quote link is currently inactive or under review.",
        };
      }

      // 2. Fetch current auth user metadata to increment views & read visit status
      const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
      const currentMetadata = authUser?.user?.user_metadata || {};
      const currentViews =
        typeof currentMetadata["link_views"] === "number" ? currentMetadata["link_views"] : 0;
      const newViews = currentViews + 1;

      let trialActivated = false;
      const updates: Record<string, unknown> = {
        link_views: newViews,
        last_visited_at: new Date().toISOString(),
      };

      // 3. If trial has not started yet (TRIAL_PENDING), activate the 7-day countdown now!
      const isPending =
        profile.trial_status === "TRIAL_PENDING" ||
        (!profile.trial_expiry &&
          profile.trial_status !== "SUBSCRIBED" &&
          profile.trial_status !== "ADMIN");

      if (isPending && !data.isTest) {
        const now = new Date();
        const expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        updates["trial_started_at"] = now.toISOString();
        updates["first_customer_visit_at"] = now.toISOString();

        // Update profile in DB
        await admin
          .from("profiles")
          .update({
            trial_status: "TRIAL",
            trial_expiry: expiryDate,
          })
          .eq("id", profile.id);

        trialActivated = true;

        // Send Telegram alert to detailer if bot is connected
        if (profile.telegram_chat_id && profile.notify_telegram !== false) {
          const botToken = process.env["TELEGRAM_BOT_TOKEN"];
          if (botToken) {
            const appUrl = process.env["PUBLIC_APP_URL"] || "https://detailr.online";
            const message = [
              `🎉 <b>First Customer Link Visit!</b>`,
              ``,
              `A potential customer just opened your quote link (<code>detailr.online/${data.slug}</code>).`,
              ``,
              `⏱️ <b>Your 7-Day Free Trial is now officially active!</b>`,
              `You have 7 full days of instant quote requests and real-time Telegram alerts.`,
              ``,
              `👉 <a href="${appUrl}/dashboard">Open Detailer Dashboard</a>`,
            ].join("\n");

            fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                chat_id: profile.telegram_chat_id,
                text: message,
                parse_mode: "HTML",
                disable_web_page_preview: true,
              }),
            }).catch((e) => console.error("[telegram] First visit alert failed:", e));
          }
        }
      }

      // Save updated metadata to auth user
      await admin.auth.admin.updateUserById(profile.id, {
        user_metadata: {
          ...currentMetadata,
          ...updates,
        },
      });

      return {
        ok: true,
        isSuspended: false,
        trialActivated,
        viewsCount: newViews,
      };
    } catch (err) {
      console.error("[link-tracker] Error recording link visit:", err);
      return { ok: false, isSuspended: false };
    }
  });
