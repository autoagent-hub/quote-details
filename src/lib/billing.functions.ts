import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getUpgradeCheckout = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const checkoutUrl = process.env["WHOP_CHECKOUT_URL"];
    if (!checkoutUrl) return { href: null };

    const { data } = await context.supabase.auth.getUser();
    const url = new URL(checkoutUrl);
    url.searchParams.set("metadata[user_id]", context.userId);
    if (data.user?.email) url.searchParams.set("email", data.user.email);

    return { href: url.toString() };
  });