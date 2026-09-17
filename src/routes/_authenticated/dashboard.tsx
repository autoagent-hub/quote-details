import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ReceiptText, Sliders, Bell, Store, ExternalLink, ChevronRight } from "lucide-react";

import { SkeletonDashboard } from "@/components/skeletons/SkeletonDashboard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { parseServices, parseVehicleCategories } from "@/lib/pricing";

import type { Profile, Quote } from "@/components/dashboard/types";
import { AppNavigation } from "@/components/dashboard/AppNavigation";
import { TopMetricsGrid } from "@/components/dashboard/TopMetricsGrid";
import { QuoteHistoryCard } from "@/components/dashboard/QuoteHistoryCard";
import { PricingCard } from "@/components/dashboard/PricingCard";
import { BusinessProfileCard } from "@/components/dashboard/BusinessProfileCard";
import { NotificationSettingsCard } from "@/components/dashboard/NotificationSettingsCard";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { Onboarding } from "@/components/dashboard/Onboarding";
import { DashboardWelcomeHero } from "@/components/dashboard/DashboardWelcomeHero";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Detailr (detailr.online)" },
      {
        name: "description",
        content: "Manage your auto detailing quote requests, pricing rates, and Telegram alerts.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [activeTab, setActiveTab] = useState("quotes");

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

  const { data: quotes } = useQuery({
    queryKey: ["quotes", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Quote[];
    },
  });

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-surface/50 pb-16 text-foreground font-sans">
      {/* Unified App Navigation Bar & Header */}
      <AppNavigation
        profile={profile}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userEmail={user?.email}
      />

      {/* Main Workspace Layout */}
      <main className="mx-auto max-w-7xl space-y-8 px-4 sm:px-8 py-8">
        {profile ? (
          <>
            <TrialBanner />

            {/* Welcome Guide */}
            <DashboardWelcomeHero profile={profile} onSelectTab={setActiveTab} />

            {/* Top Metrics Grid */}
            <TopMetricsGrid profile={profile} quotes={quotes ?? []} onSelectTab={setActiveTab} />

            {/* Clear Intuitive Tabs Workspace */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="border-b border-border/40 pb-2">
                <TabsList className="bg-muted/40 p-1.5 h-auto rounded-2xl border border-border/40 backdrop-blur-sm grid grid-cols-2 md:grid-cols-4 gap-1.5">
                  <TabsTrigger
                    value="quotes"
                    className="text-xs font-bold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:shadow-primary/5 transition-all flex flex-col items-start text-left sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-2">
                      <ReceiptText className="size-4 opacity-80 text-primary" />
                      <span>Leads & Quotes</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 h-4 min-w-[18px] text-[9px] font-mono border-none bg-primary/10 text-primary font-bold"
                    >
                      {quotes?.length ?? 0}
                    </Badge>
                  </TabsTrigger>

                  <TabsTrigger
                    value="pricing"
                    className="text-xs font-bold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:shadow-primary/5 transition-all flex flex-col items-start text-left sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="size-4 opacity-80 text-amber-500" />
                      <span>Services & Prices</span>
                    </div>
                  </TabsTrigger>

                  <TabsTrigger
                    value="notifications"
                    className="text-xs font-bold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:shadow-primary/5 transition-all flex flex-col items-start text-left sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="size-4 opacity-80 text-blue-500" />
                      <span>Telegram Alerts</span>
                    </div>
                    <span
                      className={`size-2 rounded-full ${profile.telegram_chat_id ? "bg-emerald-500" : "bg-amber-500"}`}
                    />
                  </TabsTrigger>

                  <TabsTrigger
                    value="settings"
                    className="text-xs font-bold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:shadow-primary/5 transition-all flex flex-col items-start text-left sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="size-4 opacity-80 text-purple-500" />
                      <span>Shop Profile</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab 1: Customer Leads */}
              <TabsContent value="quotes" className="focus-visible:outline-none ring-0 space-y-4">
                <div className="flex justify-end">
                  <Link
                    to="/quotes"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors py-1 px-3 rounded-lg bg-muted/40 hover:bg-muted"
                  >
                    <span>Open Standalone Leads & Quotes Page</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
                <QuoteHistoryCard
                  quotes={quotes ?? []}
                  currency={profile.currency}
                  timezone={profile.timezone}
                  services={parseServices(profile.services)}
                  categories={parseVehicleCategories(profile.vehicle_categories)}
                />
              </TabsContent>

              {/* Tab 2: Pricing & Rates */}
              <TabsContent value="pricing" className="focus-visible:outline-none ring-0 space-y-4">
                <div className="flex justify-end">
                  <Link
                    to="/pricing"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors py-1 px-3 rounded-lg bg-muted/40 hover:bg-muted"
                  >
                    <span>Open Standalone Services Page</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
                <PricingCard profile={profile} />
              </TabsContent>

              {/* Tab 3: Telegram Phone Alerts */}
              <TabsContent
                value="notifications"
                className="focus-visible:outline-none ring-0 space-y-4"
              >
                <div className="max-w-3xl mx-auto flex justify-end">
                  <Link
                    to="/notifications"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors py-1 px-3 rounded-lg bg-muted/40 hover:bg-muted"
                  >
                    <span>Open Standalone Alerts Page</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
                <div className="max-w-3xl mx-auto">
                  <NotificationSettingsCard profile={profile} />
                </div>
              </TabsContent>

              {/* Tab 4: Shop Profile */}
              <TabsContent value="settings" className="focus-visible:outline-none ring-0 space-y-4">
                <div className="max-w-3xl mx-auto flex justify-end">
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors py-1 px-3 rounded-lg bg-muted/40 hover:bg-muted"
                  >
                    <span>Open Standalone Profile Page</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
                <div className="max-w-3xl mx-auto">
                  <BusinessProfileCard profile={profile} />
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="py-12">
            <Onboarding />
          </div>
        )}

        <footer className="mt-16 border-t border-border/40 pt-8 pb-12 text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-600/60">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Detailr Edge Cloud Active</span>
            </div>
          </div>
          <p className="text-center sm:text-right">
            © {new Date().getFullYear()} Detailr · Auto Detailing Software · Rights Reserved
          </p>
        </footer>
      </main>
    </div>
  );
}
