import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, Home } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { supabase } from "@/integrations/supabase/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";

function LoginErrorComponent({ error, reset }: { error: Error | null; reset: () => void }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface px-4 py-12">
      <div className="max-w-md text-center rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5">
        <div className="mb-6 flex justify-center">
          <QuoteFlowLogo size="lg" linkToHome />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Sign In Error</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Something went wrong loading the authentication view. Please try again.
        </p>
        {error?.message && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-left">
            <p className="font-mono text-xs text-destructive break-all">{error.message}</p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-105 transition-all"
          >
            <RefreshCw className="size-4" /> Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all"
          >
            <Home className="size-4" /> Home Page
          </a>
        </div>
      </div>
    </div>
  );
}

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
      { title: "Log In — Detailr Online" },
      {
        name: "description",
        content:
          "Sign in to your Detailr Online mobile detailer dashboard to manage pricing, quotes, and alerts.",
      },
      { property: "og:title", content: "Log In — Detailr Online" },
      { property: "og:description", content: "Access your Detailr mobile detailer dashboard." },
    ],
  }),
  errorComponent: LoginErrorComponent,
  component: LoginPage,
});

function LoginPage() {
  return (
    <ErrorBoundary boundaryName="login_page">
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

        <footer className="mx-auto mt-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Detailr · A Nerochaze Company. All rights reserved.
        </footer>
      </div>
    </ErrorBoundary>
  );
}
