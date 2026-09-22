import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/lib/admin-auth";

export const Route = createFileRoute("/master-hq/login")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      throw redirect({ to: "/login" });
    }
    if (isAdminEmail(user.email)) {
      throw redirect({ to: "/master-hq" });
    }
    // Normal logged-in user trying to access admin login -> redirect to their dashboard
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});
