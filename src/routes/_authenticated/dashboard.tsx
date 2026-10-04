import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ReceiptText, Tag, Bell, Store } from "lucide-react";

import { SkeletonDashboard } from "@/components/skeletons/SkeletonDashboard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { parseServices, parseVehicleCategories } from "@/lib/pricing";
import { getTrialState } from "@/lib/billing.functions";

import type { Profile, Quote } from "@/components/dashboard/types";
import { AppNavigation } from "@/components/dashboard/AppNavigation";
import { OPayDashboardHeader } from "@/components/dashboard/OPayDashboardHeader";
import { QuoteHistoryCard } from "@/components/dashboard/QuoteHistoryCard";
import { PricingCard } from "@/components/dashboard/PricingCard";
import { BusinessProfileCard } from "@/components/dashboard/BusinessProfileCard";
import { NotificationSettingsCard } from "@/components/dashboard/NotificationSettingsCard";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { Onboarding } from "@/components/dashboard/Onboarding";
import {
  DashboardOnboardingTour,
  useDashboardTour,
} from "@/components/dashboard/DashboardOnboardingTour";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Detailr Online" },
      {
        name: "description",
        content:
          "Manage your auto detailing quote requests, pricing rates, and Telegram alerts on Detailr Online.",
      },
      { property: "og:title", content: "Dashboard — Detailr Online" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [activeTab, setActiveTab] = useState("quotes");
  const tour = useDashboardTour();

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

  const fetchTrial = useServerFn(getTrialState);
  const { data: trial } = useQuery({
    queryKey: ["trial-state"],
    queryFn: () => fetchTrial(),
  });

  const isSubscribed =
    profile?.trial_status === "SUBSCRIBED" ||
    profile?.trial_status === "ADMIN" ||
    (typeof profile?.whop_membership_id === "string" &&
      (profile.whop_membership_id.startsWith("mem_") ||
        profile.whop_membership_id.startsWith("pay_"))) ||
    !!trial?.isSubscribed;

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
        onStartTour={tour.startTour}
      />

      {/* Main Workspace Layout */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8 py-8 pb-24 lg:pb-12">
        {profile ? (
          <>
            {/* Minimal Trial Alert (hidden completely for subscribed users) */}
            <TrialBanner profile={profile} hideIfSubscribed={true} />

            {/* OPay-Style Account & Quick Action Center */}
            <div data-tour="welcome-hero">
              <OPayDashboardHeader
                profile={profile}
                quotes={quotes ?? []}
                onSelectTab={setActiveTab}
                isSubscribed={isSubscribed}
              />
            </div>

            {/* Clear Intuitive Tabs Workspace */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="border-b border-border/40 pb-2">
                <TabsList className="bg-slate-100 dark:bg-slate-800/80 p-1.5 h-auto rounded-2xl border border-slate-200/90 dark:border-slate-700/80 backdrop-blur-sm grid grid-cols-2 md:grid-cols-4 gap-1.5 shadow-xs">
                  <TabsTrigger
                    value="quotes"
                    data-tour="quotes-tab"
                    className="text-xs font-bold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex flex-col items-start text-left sm:flex-row sm:items-center text-muted-foreground hover:text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <ReceiptText className="size-4 opacity-90 text-emerald-600" />
                      <span>Leads & Quotes</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 h-4 min-w-[18px] text-[9px] font-mono border-none bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold"
                    >
                      {quotes?.length ?? 0}
                    </Badge>
                  </TabsTrigger>

                  <TabsTrigger
                    value="pricing"
                    data-tour="pricing-tab"
                    className="text-xs font-bold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex flex-col items-start text-left sm:flex-row sm:items-center text-muted-foreground hover:text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="size-4 opacity-90 text-primary" />
                      <span>Services & Prices</span>
                    </div>
                  </TabsTrigger>

                  <TabsTrigger
                    value="notifications"
                    data-tour="notifications-tab"
                    className="text-xs font-bold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex flex-col items-start text-left sm:flex-row sm:items-center text-muted-foreground hover:text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="size-4 opacity-90 text-sky-500" />
                      <span>Telegram Alerts</span>
                    </div>
                    <span
                      className={`size-2 rounded-full ${profile.telegram_chat_id ? "bg-emerald-500" : "bg-amber-500"}`}
                    />
                  </TabsTrigger>

                  <TabsTrigger
                    value="settings"
                    data-tour="settings-tab"
                    className="text-xs font-bold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex flex-col items-start text-left sm:flex-row sm:items-center text-muted-foreground hover:text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="size-4 opacity-90 text-purple-500" />
                      <span>Shop Profile</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab 1: Customer Leads */}
              <TabsContent value="quotes" className="focus-visible:outline-none ring-0 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Customer Leads & Quotes</h2>
                    <p className="text-xs text-muted-foreground">
                      Every quote requested from your link appears here with customer name, phone
                      number, and vehicle details.
                    </p>
                  </div>
                </div>
                <QuoteHistoryCard
                  quotes={quotes ?? []}
                  currency={profile.currency}
                  timezone={profile.timezone}
                  services={parseServices(profile.services)}
                  categories={parseVehicleCategories(profile.vehicle_categories)}
                  slug={profile.slug}
                  detailerId={profile.id}
                />
              </TabsContent>

              {/* Tab 2: Pricing & Rates */}
              <TabsContent value="pricing" className="focus-visible:outline-none ring-0 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      Services & Pricing Rates
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Adjust what you charge. Customers receive automated quotes based on vehicle
                      size and chosen packages.
                    </p>
                  </div>
                </div>
                <PricingCard profile={profile} />
              </TabsContent>

              {/* Tab 3: Telegram Phone Alerts */}
              <TabsContent
                value="notifications"
                className="focus-visible:outline-none ring-0 space-y-4"
              >
                <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Telegram Phone Alerts</h2>
                    <p className="text-xs text-muted-foreground">
                      Receive real-time lead alerts directly on your phone whenever a customer
                      submits a quote.
                    </p>
                  </div>
                </div>
                <div className="max-w-3xl mx-auto">
                  <NotificationSettingsCard profile={profile} />
                </div>
              </TabsContent>

              {/* Tab 4: Shop Profile */}
              <TabsContent value="settings" className="focus-visible:outline-none ring-0 space-y-4">
                <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Shop Profile & Link</h2>
                    <p className="text-xs text-muted-foreground">
                      Manage your business name, quote link address, currency, and company branding.
                    </p>
                  </div>
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

      <DashboardOnboardingTour
        isOpen={tour.isOpen}
        onClose={tour.closeTour}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}
