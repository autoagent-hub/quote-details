import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureWelcomeEmail } from "@/lib/auth-codes.functions";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let unmounted = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !unmounted) {
        void ensureWelcomeEmail({
          data: { userId: session.user.id, email: session.user.email },
        }).catch((err) => console.warn("[welcome-email] dispatch error:", err));
        navigate({ to: "/dashboard" });
      }
    });

    const checkSession = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch (err) {
          console.warn("OAuth code exchange:", err);
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        if (!unmounted) {
          void ensureWelcomeEmail({
            data: { userId: session.user.id, email: session.user.email },
          }).catch((err) => console.warn("[welcome-email] dispatch error:", err));
          navigate({ to: "/dashboard" });
        }
      } else {
        setTimeout(async () => {
          if (unmounted) return;
          const { data: retry } = await supabase.auth.getSession();
          if (retry?.session?.user) {
            navigate({ to: "/dashboard" });
          } else {
            navigate({ to: "/login" });
          }
        }, 1000);
      }
    };

    void checkSession();

    return () => {
      unmounted = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="text-center">
        <h2 className="text-lg font-medium text-foreground">Completing sign in...</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please wait while we redirect you to your dashboard.
        </p>
      </div>
    </div>
  );
}
