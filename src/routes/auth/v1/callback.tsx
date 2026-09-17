import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    let unmounted = false;

    // Listen for auth state changes (e.g. session established from hash or PKCE exchange)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !unmounted) {
        toast.success("Successfully signed in with Google!");
        navigate({ to: "/dashboard" });
      }
    });

    const handleOAuthCallback = async () => {
      try {
        // 0. Immediate check: if user already has an active Supabase session, redirect to dashboard right away
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (currentSession?.user) {
          if (unmounted) return;
          toast.success("Welcome back!");
          navigate({ to: "/dashboard" });
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        if (error || errorDescription) {
          throw new Error(errorDescription || error || "Google authentication was cancelled");
        }

        // 1. Try standard Supabase PKCE code exchange first
        if (code) {
          try {
            const { data: exchangeData, error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeError && exchangeData?.session?.user) {
              if (unmounted) return;
              toast.success("Successfully signed in with Google!");
              navigate({ to: "/dashboard" });
              return;
            }
          } catch (pkceErr) {
            console.warn("[auth] Supabase code exchange skipped or failed:", pkceErr);
          }
        }

        // 2. Check hash parameters for direct implicit flow or id_token
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const idTokenFromHash = hashParams.get("id_token");
        const accessTokenFromHash = hashParams.get("access_token");

        let idToken = idTokenFromHash;

        // 3. If code was not a Supabase code and idToken is missing, try direct Google code exchange
        if (!idToken && code) {
          try {
            const redirectUri = `${window.location.origin}/auth/v1/callback`;
            const res = await fetch("/api/public/google-callback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code, redirectUri }),
            });

            const data = (await res.json()) as {
              id_token?: string;
              token_hash?: string;
              error?: string;
            };

            if (data.token_hash) {
              const { data: otpData, error: otpErr } = await supabase.auth.verifyOtp({
                token_hash: data.token_hash,
                type: "magiclink",
              });
              if (!otpErr && otpData?.user) {
                if (unmounted) return;
                toast.success("Successfully signed in with Google!");
                navigate({ to: "/dashboard" });
                return;
              }
            }

            if (res.ok && data.id_token) {
              idToken = data.id_token;
            }
          } catch (googleCodeErr) {
            console.warn("[auth] Direct Google code exchange failed:", googleCodeErr);
          }
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

          toast.success("Successfully signed in with Google!");
          navigate({ to: "/dashboard" });
          return;
        }

        // 4. Fallback: Check existing active session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          if (unmounted) return;
          navigate({ to: "/dashboard" });
          return;
        }

        // Give a short 1-second grace window for background token parsing before redirecting to login
        setTimeout(async () => {
          if (unmounted) return;
          const { data: retrySession } = await supabase.auth.getSession();
          if (retrySession?.session?.user) {
            navigate({ to: "/dashboard" });
          } else {
            navigate({ to: "/login" });
          }
        }, 1200);
      } catch (err: unknown) {
        const e = err as Error;
        console.error("Direct Google OAuth callback error:", e);
        if (!unmounted) {
          setErrorMsg(e.message || "Failed to complete Google authentication");
          toast.error(e.message || "Failed to sign in with Google");
          setTimeout(() => {
            if (!unmounted) navigate({ to: "/login" });
          }, 2500);
        }
      }
    };

    void handleOAuthCallback();

    return () => {
      unmounted = true;
      subscription.unsubscribe();
    };
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
