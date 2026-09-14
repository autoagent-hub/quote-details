import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_CHECKOUT_URL = "https://whop.com/checkout/plan_IrzVc4vCnCiQ1";
const DEFAULT_APP_URL = "https://quote-details.lovable.app";

export const getUpgradeCheckout = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const checkoutUrl = process.env["WHOP_CHECKOUT_URL"] ?? DEFAULT_CHECKOUT_URL;
    const appUrl = process.env["PUBLIC_APP_URL"] ?? DEFAULT_APP_URL;

    const { data } = await context.supabase.auth.getUser();
    const url = new URL(checkoutUrl);
    url.searchParams.set("metadata[user_id]", context.userId);
    url.searchParams.set("d2c", "true");
    url.searchParams.set("redirect_url", `${appUrl.replace(/\/$/, "")}/upgrade?checkout=success`);
    if (data.user?.email) url.searchParams.set("email", data.user.email);

    return { href: url.toString() };
  });

/**
 * Returns the caller's plan state, downgrading a lapsed paid/expired account
 * back to TRIAL once the 7-day trial window has passed.
 */
export const getTrialState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("trial_status, trial_expiry")
      .eq("id", context.userId)
      .maybeSingle();

    if (!profile) return { status: "TRIAL", expiresAt: null as string | null, expired: false };

    let status = profile.trial_status ?? "TRIAL";
    const expiresAt = profile.trial_expiry ?? null;
    const expired = !!expiresAt && new Date(expiresAt).getTime() < Date.now();

    if (status !== "SUBSCRIBED" && status !== "TRIAL") {
      // Cancelled / past due accounts fall back to the trial tier.
      await context.supabase
        .from("profiles")
        .update({ trial_status: "TRIAL" })
        .eq("id", context.userId);
      status = "TRIAL";
    }

    return { status, expiresAt, expired: status === "TRIAL" && expired };
  });
