import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { requestAuthCode, verifyRecoveryCode, verifySignupCode } from "@/lib/auth-codes.functions";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — QuoteFlow" },
      {
        name: "description",
        content: "Sign in or create your QuoteFlow account to manage detailing pricing and quotes.",
      },
      { property: "og:title", content: "Sign in — QuoteFlow" },
      { property: "og:description", content: "Access your QuoteFlow detailer dashboard." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");
  const [step, setStep] = useState<"details" | "code">("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setStep("details");
    setCode("");
  };

  const fail = (error: unknown) =>
    toast.error(error instanceof Error ? error.message : "Something went wrong");

  const submitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
        return;
      }
      await requestAuthCode({
        data: { email, purpose: mode === "signup" ? "signup" : "recovery" },
      });
      setStep("code");
      toast.success(`We sent a 6-digit code to ${email}`);
    } catch (error) {
      fail(error);
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await verifySignupCode({ data: { email, code, password } });
      } else {
        await verifyRecoveryCode({ data: { email, code, password } });
        toast.success("Password updated");
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/dashboard" });
    } catch (error) {
      fail(error);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true);
    try {
      await requestAuthCode({
        data: { email, purpose: mode === "signup" ? "signup" : "recovery" },
      });
      toast.success("New code sent");
    } catch (error) {
      fail(error);
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  const title =
    step === "code"
      ? "Enter your code"
      : mode === "signup"
        ? "Start your free trial"
        : mode === "signin"
          ? "Welcome back"
          : "Reset your password";

  const subtitle =
    step === "code"
      ? `We emailed a 6-digit code to ${email}. It expires in 10 minutes.`
      : mode === "signup"
        ? "7 days free. Set your prices in minutes."
        : mode === "signin"
          ? "Sign in to your detailer dashboard."
          : "We'll email you a code to set a new password.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-5 py-10">
      <Link to="/" className="mb-6 flex items-center gap-2 font-display text-lg font-bold">
        <span className="gradient-primary flex size-8 items-center justify-center rounded-lg text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        QuoteFlow
      </Link>

      <Card className="w-full max-w-sm shadow-card">
        <CardContent className="p-6">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

          {step === "details" ? (
            <form onSubmit={submitDetails} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@detailing.co"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">
                  {mode === "forgot" ? "New password" : "Password"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" variant="hero" size="xl" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {mode === "signup"
                  ? "Send confirmation code"
                  : mode === "signin"
                    ? "Sign in"
                    : "Send reset code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={submitCode} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">6-digit code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="text-center text-lg tracking-[0.4em]"
                />
              </div>
              <Button type="submit" variant="hero" size="xl" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {mode === "signup" ? "Confirm & create account" : "Reset password"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={resend}
                  disabled={loading}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Change email
                </button>
              </div>
            </form>
          )}

          {step === "details" && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or{" "}
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button variant="outline" size="xl" onClick={google}>
                Continue with Google
              </Button>

              <button
                type="button"
                onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
                className="mt-5 w-full cursor-pointer text-sm text-muted-foreground hover:text-foreground"
              >
                {mode === "signup"
                  ? "Already have an account? Sign in"
                  : "New here? Create an account"}
              </button>

              {mode !== "forgot" && (
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="mt-2 w-full cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                >
                  Forgot your password?
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
