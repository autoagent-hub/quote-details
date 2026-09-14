import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/auth", search: { mode: "signin" } });
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="text-center">
        <h2 className="text-lg font-medium text-foreground">Completing sign in...</h2>
        <p className="mt-1 text-sm text-muted-foreground">Please wait while we redirect you to your dashboard.</p>
      </div>
    </div>
  );
}
