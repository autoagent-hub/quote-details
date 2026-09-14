import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Create Account — Detailr Free Trial (detailr.online)" },
      {
        name: "description",
        content:
          "Start your 7-day free trial of Detailr on detailr.online. Instant web quotes and Telegram alerts for mobile detailers.",
      },
      { property: "og:title", content: "Create Account — Detailr (detailr.online)" },
      {
        property: "og:description",
        content:
          "7-day free trial. Start closing detailing leads with instant pricing on detailr.online.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="min-h-screen bg-surface px-4 py-8 sm:px-6 lg:py-12">
      {/* Top clean bar */}
      <div className="mx-auto mb-6 flex max-w-5xl items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to home
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Already have an account?
          </span>
          <Link
            to="/login"
            className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground hover:bg-secondary"
          >
            Log In
          </Link>
        </div>
      </div>

      <AuthCard initialMode="signup" />
    </div>
  );
}
