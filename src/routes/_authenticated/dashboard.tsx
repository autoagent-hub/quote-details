import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { SkeletonDashboard } from "@/components/skeletons/SkeletonDashboard";
import { supabase } from "@/integrations/supabase/client";
import { getTrialState } from "@/lib/billing.functions";

import type { Profile, Quote } from "@/components/dashboard/types";
import { AppNavigation } from "@/components/dashboard/AppNavigation";
import { OPayDashboardHeader } from "@/components/dashboard/OPayDashboardHeader";
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
        activeTab="dashboard"
        userEmail={user?.email}
        onStartTour={tour.startTour}
      />

      {/* Main Workspace Layout */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8 py-8 pb-24 lg:pb-12">
        {profile ? (
          <>
            {/* Minimal Trial Alert (hidden completely for subscribed users) */}
            <TrialBanner profile={profile} hideIfSubscribed={true} />

            {/* Focused Account & Action Hub */}
            <div data-tour="welcome-hero">
              <OPayDashboardHeader
                profile={profile}
                quotes={quotes ?? []}
                isSubscribed={isSubscribed}
              />
            </div>
          </>
        ) : (
          <div className="py-12">
            <Onboarding />
          </div>
        )}

        <footer className="mt-16 border-t border-border/40 pt-8 pb-12 text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary/70">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span>Detailr Edge Cloud Active</span>
            </div>
          </div>
          <p className="text-center sm:text-right">
            © {new Date().getFullYear()} Detailr · Auto Detailing Software · Rights Reserved
          </p>
        </footer>
      </main>

      <DashboardOnboardingTour isOpen={tour.isOpen} onClose={tour.closeTour} />
    </div>
  );
}
