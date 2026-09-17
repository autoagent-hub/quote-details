import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ReceiptText, ArrowLeft, RefreshCw, Sliders, Send, Store, HelpCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SkeletonDashboard } from "@/components/skeletons/SkeletonDashboard";
import { AppNavigation } from "@/components/dashboard/AppNavigation";
import { QuoteHistoryCard } from "@/components/dashboard/QuoteHistoryCard";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseServices, parseVehicleCategories } from "@/lib/pricing";
import type { Profile, Quote } from "@/components/dashboard/types";

export const Route = createFileRoute("/_authenticated/quotes")({
  head: () => ({
    meta: [
      { title: "Customer Leads & Quotes — Detailr (detailr.online)" },
      {
        name: "description",
        content:
          "View all customer detailing quote requests, customer phone numbers, and job requests.",
      },
    ],
  }),
  component: QuotesPage,
});

function QuotesPage() {
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      return userData.user;
    },
  });

  const { data: profile, isLoading: isProfileLoading } = useQuery({
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
      return data as Profile | null;
    },
  });

  const {
    data: quotes,
    isLoading: isQuotesLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["quotes", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Quote[];
    },
  });

  if (isProfileLoading || isQuotesLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-surface/50 pb-16 text-foreground font-sans">
      <AppNavigation profile={profile ?? null} activeTab="quotes" userEmail={user?.email} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8 py-8">
        <TrialBanner />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
              <Link
                to="/dashboard"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="size-3.5" />
                <span>Dashboard</span>
              </Link>
              <span>/</span>
              <span className="text-foreground">Leads & Quotes</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <ReceiptText className="size-4" />
              </span>
              <span>Customer Leads & Quotes</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {quotes?.length ?? 0}
              </Badge>
            </h1>
            <p className="text-xs font-medium text-muted-foreground max-w-2xl">
              All incoming customer quote requests submitted via your public quote builder. View
              phone numbers, vehicle specifications, requested packages, and photos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl px-3 border-border/60 text-xs font-bold gap-1.5"
              onClick={() => void refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              <span>{isRefetching ? "Refreshing..." : "Refresh"}</span>
            </Button>
          </div>
        </div>

        {/* Quick Tabs Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-3">
          <span className="text-xs font-bold text-muted-foreground mr-1">Quick Pages:</span>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Sliders className="size-3 text-amber-500" />
            Services & Pricing
          </Link>
          <Link
            to="/notifications"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Send className="size-3 text-blue-500" />
            Telegram Alerts
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Store className="size-3 text-purple-500" />
            Shop Profile
          </Link>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Settings
          </Link>
          <Link
            to="/help"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="size-3 text-cyan-500" />
            Help
          </Link>
        </div>

        {/* Content Card */}
        {profile && (
          <QuoteHistoryCard
            quotes={quotes ?? []}
            currency={profile.currency}
            timezone={profile.timezone}
            services={parseServices(profile.services)}
            categories={parseVehicleCategories(profile.vehicle_categories)}
          />
        )}
      </main>
    </div>
  );
}
