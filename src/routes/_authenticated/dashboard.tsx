import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  LogOut,
  ReceiptText,
  Sliders,
  Shield,
  Bell,
  Store,
  Copy,
  Check,
  Globe,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";

import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { SkeletonDashboard } from "@/components/skeletons/SkeletonDashboard";
import { isAdminEmail } from "@/lib/admin-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { parseServices, parseVehicleCategories } from "@/lib/pricing";

import type { Profile, Quote } from "@/components/dashboard/types";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("quotes");
  const [headerCopied, setHeaderCopied] = useState(false);

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

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  };

  const copyHeaderLink = () => {
    if (!profile?.slug) return;
    const url = `${window.location.origin}/${profile.slug}`;
    void navigator.clipboard.writeText(url);
    setHeaderCopied(true);
    toast.success("Quote link copied!");
    setTimeout(() => setHeaderCopied(false), 2000);
  };

  const isUserAdmin = isAdminEmail(user?.email);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-surface/50 pb-16 text-foreground font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-8">
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <QuoteFlowLogo size="sm" linkToHome />
            {profile && (
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Shop Online
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {profile && (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl px-3 border-border/60 font-bold text-[11px] gap-1.5 transition-all hover:bg-surface"
                  onClick={copyHeaderLink}
                  title="Copy your quote form link"
                >
                  {headerCopied ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5 opacity-70" />
                  )}
                  <span>{headerCopied ? "Copied!" : "Copy Link"}</span>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl px-2.5 text-muted-foreground hover:text-foreground text-[11px] font-bold gap-1.5 hidden md:flex"
                  title="Preview quote calculator in test sandbox"
                >
                  <a href={`/${profile.slug}?test=true`} target="_blank" rel="noreferrer">
                    <FlaskConical className="size-3.5 text-amber-500" />
                    <span>Test Sandbox</span>
                  </a>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl px-2.5 text-muted-foreground hover:text-foreground text-[11px] font-bold gap-1.5 hidden lg:flex"
                  title="View live quote calculator"
                >
                  <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
                    <Globe className="size-3.5 opacity-60" />
                    <span>View Live</span>
                  </a>
                </Button>
              </div>
            )}

            <div className="h-4 w-px bg-border/60 hidden sm:block" />

            <div className="flex items-center gap-1.5 sm:gap-2">
              {isUserAdmin && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl px-2.5 sm:px-3 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-bold text-[10px] uppercase tracking-wider"
                >
                  <Link to="/admin">
                    <Shield className="size-3.5 mr-1 sm:mr-1.5" />{" "}
                    <span className="hidden xs:inline">Admin</span>
                  </Link>
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 rounded-xl px-2.5 sm:px-3 border-border/60 font-bold text-[10px] uppercase tracking-wider transition-all hover:bg-surface"
              >
                <Link to="/upgrade">
                  <CreditCard className="size-3.5 mr-1 sm:mr-1.5 opacity-60" /> Upgrade
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl px-2.5 sm:px-3 text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase tracking-wider transition-all"
                onClick={signOut}
              >
                <LogOut className="size-3.5 mr-1 sm:mr-1.5 opacity-60" /> Exit
              </Button>
            </div>
          </div>
        </div>
      </header>

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
              <TabsContent value="quotes" className="focus-visible:outline-none ring-0">
                <QuoteHistoryCard
                  quotes={quotes ?? []}
                  currency={profile.currency}
                  timezone={profile.timezone}
                  services={parseServices(profile.services)}
                  categories={parseVehicleCategories(profile.vehicle_categories)}
                />
              </TabsContent>

              {/* Tab 2: Pricing & Rates */}
              <TabsContent value="pricing" className="focus-visible:outline-none ring-0">
                <PricingCard profile={profile} />
              </TabsContent>

              {/* Tab 3: Telegram Phone Alerts */}
              <TabsContent value="notifications" className="focus-visible:outline-none ring-0">
                <div className="max-w-3xl mx-auto">
                  <NotificationSettingsCard profile={profile} />
                </div>
              </TabsContent>

              {/* Tab 4: Shop Profile */}
              <TabsContent value="settings" className="focus-visible:outline-none ring-0">
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
