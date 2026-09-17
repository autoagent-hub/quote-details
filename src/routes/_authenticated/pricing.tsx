import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sliders, ArrowLeft, ExternalLink, FlaskConical } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SkeletonDashboard } from "@/components/skeletons/SkeletonDashboard";
import { AppNavigation } from "@/components/dashboard/AppNavigation";
import { PricingCard } from "@/components/dashboard/PricingCard";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/components/dashboard/types";

export const Route = createFileRoute("/_authenticated/pricing")({
  head: () => ({
    meta: [
      { title: "Services & Prices — Detailr Online" },
      {
        name: "description",
        content: "Configure your vehicle categories, packages, and add-on rates on Detailr Online.",
      },
      { property: "og:title", content: "Services & Prices — Detailr Online" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      return userData.user;
    },
  });

  const { data: profile, isLoading } = useQuery({
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

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-surface/50 pb-16 text-foreground font-sans">
      <AppNavigation profile={profile ?? null} activeTab="pricing" userEmail={user?.email} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8 py-8">
        {/* Navigation Breadcrumb & Page Header */}
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
              <span className="text-foreground">Services & Prices</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Sliders className="size-4" />
              </span>
              <span>Services & Prices</span>
            </h1>
            <p className="text-xs font-medium text-muted-foreground max-w-2xl">
              Customize vehicle sizes, package tiers, and add-on services. Your live quote
              calculator updates automatically.
            </p>
          </div>

          {profile?.slug && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 rounded-xl px-3 border-border/60 text-xs font-bold gap-1.5"
              >
                <a href={`/${profile.slug}?test=true`} target="_blank" rel="noreferrer">
                  <FlaskConical className="size-3.5 text-amber-500" />
                  <span>Test Sandbox</span>
                </a>
              </Button>
              <Button asChild size="sm" className="h-8 rounded-xl px-3 text-xs font-bold gap-1.5">
                <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  <span>Live Form</span>
                </a>
              </Button>
            </div>
          )}
        </div>

        <TrialBanner />

        {profile ? (
          <div className="space-y-6">
            <PricingCard profile={profile} />
          </div>
        ) : (
          <div className="p-8 text-center bg-card rounded-2xl border border-border">
            <p className="text-sm text-muted-foreground">
              Please complete your business profile setup first.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
