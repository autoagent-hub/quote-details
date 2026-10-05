import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      throw redirect({ to: "/login?redirect=/master-hq" });
    }

    const email = user.email?.toLowerCase();
    let hasAdmin = isAdminEmail(email);

    if (!hasAdmin) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_status")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.trial_status === "ADMIN") {
        hasAdmin = true;
      }
    }

    if (hasAdmin) {
      throw redirect({ to: "/master-hq" });
    }

    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});
