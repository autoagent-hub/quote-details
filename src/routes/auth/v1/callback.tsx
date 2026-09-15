import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureWelcomeEmail } from "@/lib/auth-codes.functions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/v1/callback")({
  ssr: false,
  component: AuthV1CallbackPage,
});

function AuthV1CallbackPage() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        if (error || errorDescription) {
          throw new Error(errorDescription || error || "Google authentication was cancelled");
        }

        // Check hash parameters for direct implicit flow or id_token
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const idTokenFromHash = hashParams.get("id_token");
        const accessTokenFromHash = hashParams.get("access_token");

        let idToken = idTokenFromHash;

        if (!idToken && code) {
          const redirectUri = `${window.location.origin}/auth/v1/callback`;
          const res = await fetch("/api/public/google-callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, redirectUri }),
          });

          const data = (await res.json()) as { id_token?: string; error?: string };
          if (!res.ok || !data.id_token) {
            throw new Error(data.error || "Failed to exchange Google OAuth code for session token");
          }
          idToken = data.id_token;
        }

        if (idToken) {
          const { data: authData, error: sessionError } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: idToken,
            access_token: accessTokenFromHash || undefined,
          });

          if (sessionError) {
            throw sessionError;
          }

          if (authData?.user) {
            void ensureWelcomeEmail({
              data: { userId: authData.user.id, email: authData.user.email },
            }).catch((err) => console.warn("[welcome-email] dispatch error:", err));
          }

          toast.success("Successfully signed in with Google!");
          navigate({ to: "/dashboard" });
          return;
        }

        // Fallback: Check existing session if available
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          void ensureWelcomeEmail({
            data: { userId: session.user.id, email: session.user.email },
          }).catch((err) => console.warn("[welcome-email] dispatch error:", err));
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/login" });
        }
      } catch (err: unknown) {
        const e = err as Error;
        console.error("Direct Google OAuth callback error:", e);
        setErrorMsg(e.message || "Failed to complete Google authentication");
        toast.error(e.message || "Failed to sign in with Google");
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 3000);
      }
    };

    void handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        {errorMsg ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
            <h2 className="text-lg font-bold">Authentication Failed</h2>
            <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
            <p className="mt-4 text-xs text-muted-foreground">Redirecting to login page...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Validating Google Authentication...
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Please wait while we establish your session on detailr.online.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
