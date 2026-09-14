import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  KeyRound,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAdminEmail } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Portal Sign In — Detailr" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("me@detailr.online");
  const [password, setPassword] = useState("Hello10122@");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!isAdminEmail(cleanEmail)) {
        toast.error("Unauthorized email. You do not have administrator privileges.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password.trim(),
      });

      if (error) {
        toast.error(`Authentication failed: ${error.message}`);
        setLoading(false);
        return;
      }

      toast.success("Administrator session verified! Welcome back.");
      navigate({ to: "/admin" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Admin login error";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 selection:bg-primary selection:text-primary-foreground">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Shield className="size-3.5" /> Detailr Headquarters Admin
          </div>
          <div className="flex justify-center">
            <QuoteFlowLogo size="lg" linkToHome />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Platform Master Console
          </h1>
          <p className="text-xs text-slate-400">
            Authorized administrative access for Detailr platform oversight, users, and quote
            analytics.
          </p>
        </div>

        {/* Credentials Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md sm:p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-300">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="me@detailr.online"
                  required
                  className="h-11 border-slate-700 bg-slate-950/80 pl-9 text-sm text-white placeholder:text-slate-600 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-300">Admin Password</Label>
                <span className="text-[11px] text-slate-500 font-mono">Master Key</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="h-11 border-slate-700 bg-slate-950/80 pl-9 text-sm text-white placeholder:text-slate-600 focus-visible:ring-primary font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Verifying Admin Session...
                </>
              ) : (
                <>
                  <KeyRound className="size-4" /> Sign In to Admin Console{" "}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick 1-click Preset Box */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Sparkles className="size-3.5" /> Configured Master Credentials
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>
                Email: <strong className="text-slate-200">me@detailr.online</strong>
              </span>
              <span>
                Pass: <strong className="text-slate-200">Hello10122@</strong>
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("me@detailr.online");
                setPassword("Hello10122@");
                handleLogin();
              }}
              disabled={loading}
              className="mt-1 h-8 w-full border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <CheckCircle2 className="mr-1.5 size-3.5 text-emerald-400" /> 1-Click Instant Master
              Login
            </Button>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link to="/" className="text-xs text-slate-500 transition-colors hover:text-slate-400">
            ← Return to public website
          </Link>
        </div>

        <footer className="text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Detailr · A Nerochaze Company. Master Administration.
        </footer>
      </div>
    </div>
  );
}
