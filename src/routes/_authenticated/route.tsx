import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { RefreshCw, Home } from "lucide-react";

function AuthenticatedErrorComponent({ error, reset }: { error: Error | null; reset: () => void }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md text-center rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5">
        <div className="mb-6 flex justify-center">
          <QuoteFlowLogo size="lg" linkToHome />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Dashboard Error Encountered
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          An unexpected error occurred while loading your dashboard or data. Please try again or
          return to the main view.
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
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all"
          >
            <Home className="size-4" /> Dashboard Home
          </a>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedLayout() {
  return (
    <ErrorBoundary boundaryName="authenticated_layout">
      <Outlet />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // If OAuth returned with a code in query params, exchange it first
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch (err) {
          console.warn("OAuth code exchange:", err);
        }
      }
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      return { user: sessionData.session.user };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
    return { user: data.user };
  },
  errorComponent: AuthenticatedErrorComponent,
  component: AuthenticatedLayout,
});
