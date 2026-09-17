import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, ArrowLeft, Send, ShieldCheck, ExternalLink } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SkeletonDashboard } from "@/components/skeletons/SkeletonDashboard";
import { AppNavigation } from "@/components/dashboard/AppNavigation";
import { NotificationSettingsCard } from "@/components/dashboard/NotificationSettingsCard";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/components/dashboard/types";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Telegram Alerts — Detailr Online" },
      {
        name: "description",
        content:
          "Configure real-time Telegram alerts for instant incoming customer detailing quotes on Detailr Online.",
      },
      { property: "og:title", content: "Telegram Alerts — Detailr Online" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
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

  const isConnected = !!profile?.telegram_chat_id;

  return (
    <div className="min-h-screen bg-surface/50 pb-16 text-foreground font-sans">
      <AppNavigation profile={profile ?? null} activeTab="notifications" userEmail={user?.email} />

      <main className="mx-auto max-w-4xl space-y-6 px-4 sm:px-8 py-8">
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
              <span className="text-foreground">Telegram Alerts</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Bell className="size-4" />
                </span>
                <span>Telegram Alerts</span>
              </h1>
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isConnected
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                }`}
              >
                {isConnected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
            <p className="text-xs font-medium text-muted-foreground max-w-2xl">
              Receive new client leads, estimated totals, and uploaded vehicle photos straight to
              your phone in real time.
            </p>
          </div>
        </div>

        <TrialBanner />

        {profile ? (
          <div className="space-y-6">
            <NotificationSettingsCard profile={profile} />

            {/* Explanatory Help Card */}
            <div className="rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Send className="size-4 text-blue-500" />
                How Telegram Lead Delivery Works
              </h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">1.</span>
                  <span>
                    When a vehicle owner submits a quote through your link, Detailr prepares a
                    formatted instant payload.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">2.</span>
                  <span>
                    The lead notification is dispatched directly through the official Detailr
                    Telegram bot (@DetailrBot) in under 1 second.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">3.</span>
                  <span>
                    You receive the client's phone number, email, address, vehicle model, requested
                    services, and full price estimate.
                  </span>
                </li>
              </ul>
            </div>
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
