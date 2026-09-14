import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Log In — Detailr (detailr.online)" },
      {
        name: "description",
        content:
          "Sign in to your Detailr mobile detailer dashboard to manage pricing, quotes, and alerts on detailr.online.",
      },
      { property: "og:title", content: "Log In — Detailr (detailr.online)" },
      { property: "og:description", content: "Access your Detailr mobile detailer dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
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
          <span className="text-xs text-muted-foreground hidden sm:inline">Need an account?</span>
          <Link
            to="/signup"
            className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground hover:bg-secondary"
          >
            Start Free Trial
          </Link>
        </div>
      </div>

      <AuthCard initialMode="signin" />
    </div>
  );
}
