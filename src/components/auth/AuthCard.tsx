import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RotateCcw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { supabase } from "@/integrations/supabase/client";
import { requestAuthCode, verifyRecoveryCode, verifySignupCode } from "@/lib/auth-codes.functions";

export type AuthMode = "signin" | "signup" | "forgot";

interface AuthCardProps {
  initialMode?: AuthMode;
}

export function AuthCard({ initialMode = "signin" }: AuthCardProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<"details" | "code">("details");

  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Status
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // If already logged in or auth state changes, redirect to dashboard
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data?.session) {
          window.location.href = "/dashboard";
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve session:", err);
      });

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          window.location.href = "/dashboard";
        }
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      console.warn("Could not bind auth change listener:", err);
    }
  }, []);

  // Sync mode if initialMode prop changes (e.g. navigation between /login and /signup)
  useEffect(() => {
    setMode(initialMode);
    setStep("details");
    setCode("");
  }, [initialMode]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setStep("details");
    setCode("");
    if (typeof window !== "undefined") {
      if (next === "signup" && window.location.pathname === "/login") {
        window.location.href = "/signup";
      } else if (next === "signin" && window.location.pathname === "/signup") {
        window.location.href = "/login";
      }
    }
  };

  const fail = (error: unknown) => {
    let msg = error instanceof Error ? error.message : "Something went wrong";
    if (
      msg.toLowerCase().includes("load failed") ||
      msg.toLowerCase().includes("failed to fetch")
    ) {
      msg =
        "Network connection failed. Please ensure your Supabase URL & anon key are configured in your Render environment variables and that your internet connection is active.";
    }
    toast.error(msg);
  };

  const submitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in both email and password.");
      return;
    }
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        window.location.href = "/dashboard";
        return;
      }

      // Signup or recovery flow uses verification codes
      await requestAuthCode({
        data: { email, purpose: mode === "signup" ? "signup" : "recovery" },
      });
      setStep("code");
      setResendCooldown(45);
      toast.success(`Verification code sent to ${email}`);
    } catch (error) {
      fail(error);
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);

    try {
      if (mode === "signup") {
        await verifySignupCode({ data: { email, code, password } });
      } else {
        await verifyRecoveryCode({ data: { email, code, password } });
        toast.success("Password updated successfully.");
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Update business name if provided on signup
      if (mode === "signup" && businessName.trim() && authData.user?.id) {
        try {
          const slug = businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 40);

          await supabase
            .from("profiles")
            .update({
              business_name: businessName.trim(),
              slug: slug || undefined,
            } as never)
            .eq("id", authData.user.id);
        } catch (e) {
          console.warn("Could not set business name immediately", e);
        }
      }

      toast.success(
        mode === "signup" ? "Account created! Welcome to Detailr." : "Logged in successfully.",
      );
      window.location.href = "/dashboard";
    } catch (error) {
      fail(error);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await requestAuthCode({
        data: { email, purpose: mode === "signup" ? "signup" : "recovery" },
      });
      setResendCooldown(45);
      toast.success("New verification code sent!");
    } catch (error) {
      fail(error);
    } finally {
      setLoading(false);
    }
  };

  interface CustomWindow extends Window {
    __PUBLIC_CONFIG__?: {
      googleClientId?: string;
      VITE_GOOGLE_CLIENT_ID?: string;
      supabaseUrl?: string;
      supabaseAnonKey?: string;
    };
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              width?: number | string;
            },
          ) => void;
          prompt: (
            notificationHandler?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
            }) => void,
          ) => void;
        };
        oauth2?: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode?: "popup" | "redirect";
            callback: (response: { code?: string; error?: string }) => void;
          }) => {
            requestCode: () => void;
          };
        };
      };
    };
  }

  const handleGoogleCredentialResponse = async (response: { credential?: string }) => {
    if (!response?.credential) {
      toast.error("No credential received from Google");
      return;
    }

    setGoogleLoading(true);
    try {
      // 1. First try Supabase signInWithIdToken
      try {
        const { data: idAuthData, error: idAuthError } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });

        if (!idAuthError && idAuthData?.user) {
          toast.success("Successfully signed in with Google!");
          window.location.href = "/dashboard";
          return;
        }
      } catch (directErr) {
        console.warn(
          "[google-auth] Direct signInWithIdToken error, attempting server exchange:",
          directErr,
        );
      }

      // 2. Server verification fallback (generates verified magiclink token_hash)
      const res = await fetch("/api/public/google-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = (await res.json()) as {
        token_hash?: string;
        id_token?: string;
        email?: string;
        error?: string;
      };

      if (!res.ok || data.error) {
        throw new Error(data.error || "Google authentication failed");
      }

      if (data.token_hash) {
        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });

        if (otpError) throw otpError;

        if (otpData?.user) {
          toast.success("Successfully signed in with Google!");
          window.location.href = "/dashboard";
          return;
        }
      }

      throw new Error("Unable to establish authenticated session");
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to sign in with Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "forgot") return;

    let mounted = true;
    const customWin =
      typeof window !== "undefined" ? (window as unknown as CustomWindow) : undefined;
    const clientId =
      customWin?.__PUBLIC_CONFIG__?.googleClientId ||
      customWin?.__PUBLIC_CONFIG__?.VITE_GOOGLE_CLIENT_ID ||
      import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) return;

    const renderWidget = () => {
      if (!mounted) return;
      if (customWin?.google?.accounts?.id) {
        try {
          customWin.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const container = document.getElementById("google-embedded-btn-container");
          if (container) {
            container.innerHTML = "";
            customWin.google.accounts.id.renderButton(container, {
              type: "standard",
              theme: "outline",
              size: "large",
              text: mode === "signup" ? "signup_with" : "continue_with",
              shape: "rectangular",
              logo_alignment: "left",
              width: 320,
            });
          }
        } catch (initErr) {
          console.warn("[google-gsi] Widget render failed:", initErr);
        }
      }
    };

    if (customWin?.google?.accounts?.id) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (customWin?.google?.accounts?.id) {
          clearInterval(interval);
          renderWidget();
        }
      }, 250);
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      mounted = false;
    };
  }, [mode]);

  // Password strength helper
  const passwordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };
  const strengthScore = passwordStrength(password);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl lg:grid-cols-12">
        {/* Left Column: Visual Showcase & Telegram Demo (Desktop) */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-8 text-background lg:col-span-5 lg:flex lg:p-10">
          {/* Subtle background glow effect */}
          <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full bg-primary-glow/20 blur-3xl" />

          {/* Top Branding */}
          <div className="relative z-10 space-y-4">
            <QuoteFlowLogo size="lg" linkToHome className="text-white" />
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-xs">
              <Sparkles className="size-3.5 text-primary-glow" />
              <span>For Professional Mobile Detailers</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Turn website & bio traffic into booked detailing jobs.
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              Give customers instant transparent quotes in 30 seconds, and get an instant Telegram
              alert the second they submit.
            </p>
          </div>

          {/* Center: Live Telegram Alert Mockup */}
          <div className="relative z-10 my-8">
            <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-4.5 backdrop-blur-md shadow-xl transition-transform hover:scale-[1.02]">
              {/* Alert Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500 text-white">
                    <Send className="size-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Detailr Bot</span>
                      <CheckCircle2 className="size-3 text-blue-400" />
                    </div>
                    <span className="text-[10px] text-white/50">Instant Telegram Alert</span>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  NEW LEAD
                </span>
              </div>

              {/* Alert Body */}
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between font-medium text-white">
                  <span>🚗 2024 Porsche Macan (SUV)</span>
                  <span className="font-display font-bold text-emerald-400">$340.00</span>
                </div>
                <p className="text-white/80">
                  <span className="font-semibold text-white">Package:</span> Full Ceramic Wash &
                  Interior Shampoo
                </p>
                <p className="text-white/70">
                  <span className="font-semibold text-white">Add-ons:</span> Pet Hair Removal +
                  Engine Bay Detail
                </p>
                <div className="rounded-lg bg-white/5 p-2 text-[11px] text-white/90">
                  <p className="font-semibold">👤 Marcus Vance</p>
                  <p className="text-white/60">📞 (512) 555-0193 · South Austin</p>
                </div>
              </div>

              {/* 1-Tap CTA Mockup */}
              <div className="mt-3 grid grid-cols-2 gap-2 pt-1 text-center">
                <span className="flex items-center justify-center gap-1 rounded-md bg-emerald-500/30 py-1.5 text-[11px] font-semibold text-emerald-200">
                  <Smartphone className="size-3" /> Call Customer
                </span>
                <span className="flex items-center justify-center gap-1 rounded-md bg-blue-500/30 py-1.5 text-[11px] font-semibold text-blue-200">
                  <Send className="size-3" /> Send SMS
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Trust & Feature List */}
          <div className="relative z-10 border-t border-white/10 pt-4">
            <div className="grid grid-cols-2 gap-3 text-xs text-white/80">
              <div className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-400" />
                <span>7-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-400" />
                <span>No Credit Card Needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-400" />
                <span>Unlimited Quotes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-400" />
                <span>Real-Time Telegram</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Interactive Form */}
        <div className="flex flex-col justify-center bg-card p-6 sm:p-10 lg:col-span-7">
          {/* Mobile Header with Logo */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <QuoteFlowLogo size="md" linkToHome />
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
              7-Day Free Trial
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          {step === "details" && (
            <div className="mb-6 flex rounded-xl bg-surface p-1 border border-border/70">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`flex-1 rounded-lg py-2 text-center text-sm font-semibold transition-all ${
                  mode === "signin"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`flex-1 rounded-lg py-2 text-center text-sm font-semibold transition-all ${
                  mode === "signup"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Header Title & Subtitle */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {step === "code"
                ? "Enter 6-Digit Verification Code"
                : mode === "signup"
                  ? "Start Your 7-Day Free Trial"
                  : mode === "signin"
                    ? "Welcome Back to Detailr"
                    : "Reset Your Password"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {step === "code"
                ? `We sent a code to ${email}. Check your inbox or spam.`
                : mode === "signup"
                  ? "Launch your instant detailing quote link in under 3 minutes. No credit card required."
                  : mode === "signin"
                    ? "Enter your credentials to access your pricing, quote history, and Telegram alerts."
                    : "Enter your registered email address and we'll send you a password reset code."}
            </p>
          </div>

          {/* Verification Code Step */}
          {step === "code" ? (
            <form onSubmit={submitCode} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-semibold">
                  6-Digit Verification Code
                </Label>
                <div className="relative">
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="h-14 text-center font-mono text-2xl font-bold tracking-[0.4em]"
                    autoFocus
                  />
                  <KeyRound className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">The code expires in 10 minutes.</p>
              </div>

              <Button type="submit" variant="hero" size="xl" disabled={loading || code.length < 6}>
                {loading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-5" />
                )}
                {mode === "signup" ? "Verify & Launch My Dashboard" : "Set New Password & Sign In"}
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={resend}
                  disabled={loading || resendCooldown > 0}
                  className="cursor-pointer text-primary hover:underline disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Change email address
                </button>
              </div>
            </form>
          ) : (
            /* Standard Details Step (Sign In / Sign Up / Forgot) */
            <div className="space-y-5">
              {/* Main Form */}
              <form onSubmit={submitDetails} className="space-y-4">
                {/* Business Name (Only on Signup) */}
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="business-name"
                      className="text-xs font-semibold text-foreground"
                    >
                      Detailing Business Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="business-name"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Apex Mobile Detailing"
                        className="h-11 pl-10"
                      />
                      <Building2 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="marcus@apexdetail.com"
                      className="h-11 pl-10"
                    />
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                      {mode === "forgot" ? "New Password" : "Password"}
                    </Label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="cursor-pointer text-xs font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pr-10 pl-10"
                    />
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>

                  {/* Password strength bar for signup */}
                  {mode === "signup" && password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full flex-1 rounded-full transition-all ${
                            strengthScore >= 1 ? "bg-amber-500" : "bg-transparent"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-all ${
                            strengthScore >= 2 ? "bg-amber-400" : "bg-transparent"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-all ${
                            strengthScore >= 3 ? "bg-emerald-500" : "bg-transparent"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-all ${
                            strengthScore >= 4 ? "bg-emerald-600" : "bg-transparent"
                          }`}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {strengthScore <= 1
                          ? "Weak — enter at least 6 characters"
                          : strengthScore === 2
                            ? "Fair — add numbers or symbols"
                            : "Strong password"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Remember Me / Trial Note */}
                {mode === "signin" ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="remember-me" className="text-xs text-muted-foreground">
                      Remember this browser for 30 days
                    </label>
                  </div>
                ) : mode === "signup" ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <span className="font-semibold text-foreground">
                          7-Day Fair Trial · Starts on 1st Customer Visit
                        </span>
                        <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                          Your 7-day trial only begins counting down after your first customer
                          visits your quote link. Take your time setting up your pricing with zero
                          wasted days.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Submit CTA */}
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  disabled={loading || googleLoading}
                  className="mt-2 text-base font-semibold shadow-lift hover:brightness-105"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {mode === "signup" ? (
                    <>
                      <span>Start 7-Day Free Trial</span>
                      <ArrowRight className="size-4" />
                    </>
                  ) : mode === "signin" ? (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="size-4" />
                    </>
                  ) : (
                    <>
                      <span>Send Password Reset Code</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Google Embedded Widget & OAuth at Bottom of Form */}
              {mode !== "forgot" && (
                <div className="space-y-4 pt-1">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <span className="relative bg-card px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Or continue with
                    </span>
                  </div>

                  <div className="flex justify-center items-center w-full min-h-[44px]">
                    {/* Google Embedded Official Widget */}
                    <div
                      id="google-embedded-btn-container"
                      className="flex justify-center w-full min-h-[44px] overflow-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Bottom Switcher Links */}
              <div className="border-t border-border/70 pt-4 text-center text-xs text-muted-foreground">
                {mode === "signup" ? (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Sign in here
                    </button>
                  </p>
                ) : mode === "signin" ? (
                  <p>
                    New to Detailr?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signup")}
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Start your 7-day free trial
                    </button>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <RotateCcw className="size-3" /> Back to Sign In
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-primary" />
          <span>256-bit encrypted & secure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="size-4 text-primary" />
          <span>Instant setup in under 3 minutes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Bell className="size-4 text-primary" />
          <span>Works with any smartphone & Telegram</span>
        </div>
      </div>
    </div>
  );
}
