import { useEffect } from "react";
import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { RefreshCw, Home } from "lucide-react";
import { getTrialState } from "@/lib/billing.functions";
import { TrialExpiredLock } from "@/components/dashboard/TrialExpiredLock";
import { ensureGoogleUserOnboarded } from "@/lib/auth-codes.functions";

function isModuleImportError(error?: Error | null): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("importing a module script failed") ||
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("loading chunk") ||
    msg.includes("dynamically imported module")
  );
}

function AuthenticatedErrorComponent({ error, reset }: { error: Error | null; reset: () => void }) {
  const isChunkError = isModuleImportError(error);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_ALL_CACHES" });
      }
      window.location.href = window.location.pathname + "?_v=" + Date.now();
      return;
    }
    reset();
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md text-center rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5">
        <div className="mb-6 flex justify-center">
          <QuoteFlowLogo size="lg" linkToHome />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {isChunkError ? "Dashboard Update Available" : "Dashboard Error Encountered"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {isChunkError
            ? "A newer version of the Detailr application was deployed. Please reload your dashboard to load the newest components."
            : "An unexpected error occurred while loading your dashboard or data. Please try again or return to the main view."}
        </p>
        {error?.message && !isChunkError && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-left">
            <p className="font-mono text-xs text-destructive break-all">{error.message}</p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={handleReload}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-105 transition-all"
          >
            <RefreshCw className="size-4" /> {isChunkError ? "Reload Dashboard" : "Try Again"}
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
  const queryClient = useQueryClient();
  const routerState = useRouterState();
  const isUpgradePage = routerState.location.pathname.includes("/upgrade");

  const fetchTrial = useServerFn(getTrialState);
  const { data: trial } = useQuery({
    queryKey: ["trial-state"],
    queryFn: async () => fetchTrial(),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5000,
  });

  // Supabase Realtime: instantly sync database changes (like telegram_chat_id link) without manual page refresh
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`profile-live-sync-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["profile"] });
          void queryClient.invalidateQueries({ queryKey: ["telegram-status"] });
          void queryClient.invalidateQueries({ queryKey: ["trial-state"] });
        },
      )
      .subscribe();

    // Auto-refetch when user switches back to Detailr from Telegram app or browser tab
    const handleFocus = () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["telegram-status"] });
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [profile?.id, queryClient]);

  // Lock dashboard access when trial or prepaid subscription access has expired
  if (!isUpgradePage && trial && !trial.hasActiveAccess) {
    return <TrialExpiredLock profile={profile} trial={trial} />;
  }

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
    const user = sessionData?.session?.user;

    if (user) {
      if (user.email && !user.user_metadata?.welcome_email_sent) {
        try {
          await ensureGoogleUserOnboarded({
            data: { email: user.email, userId: user.id },
          });
        } catch (err) {
          console.warn("[_authenticated] onboarding trigger warning:", err);
        }
      }
      return { user };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }

    if (data.user.email && !data.user.user_metadata?.welcome_email_sent) {
      try {
        await ensureGoogleUserOnboarded({
          data: { email: data.user.email, userId: data.user.id },
        });
      } catch (err) {
        console.warn("[_authenticated] onboarding trigger warning:", err);
      }
    }

    return { user: data.user };
  },
  errorComponent: AuthenticatedErrorComponent,
  component: AuthenticatedLayout,
});
