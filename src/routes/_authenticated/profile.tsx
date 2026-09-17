import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Store, ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { SkeletonDashboard } from "@/components/skeletons/SkeletonDashboard";
import { AppNavigation } from "@/components/dashboard/AppNavigation";
import { BusinessProfileCard } from "@/components/dashboard/BusinessProfileCard";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/components/dashboard/types";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Shop Profile — Detailr Online" },
      {
        name: "description",
        content:
          "Manage your auto detailing company profile, quote URL slug, currency, and branding on Detailr Online.",
      },
      { property: "og:title", content: "Shop Profile — Detailr Online" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [copied, setCopied] = useState(false);

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

  const copyUrl = () => {
    if (!profile?.slug) return;
    const url = `${window.location.origin}/${profile.slug}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Public quote link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-surface/50 pb-16 text-foreground font-sans">
      <AppNavigation profile={profile ?? null} activeTab="settings" userEmail={user?.email} />

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
              <span className="text-foreground">Shop Profile</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <Store className="size-4" />
              </span>
              <span>Shop Profile & Branding</span>
            </h1>
            <p className="text-xs font-medium text-muted-foreground max-w-2xl">
              Configure your business name, direct booking URL slug, contact details, currency, and
              timezone.
            </p>
          </div>

          {profile?.slug && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl px-3 border-border/60 text-xs font-bold gap-1.5"
                onClick={copyUrl}
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>{copied ? "Copied!" : "Copy URL"}</span>
              </Button>
              <Button asChild size="sm" className="h-8 rounded-xl px-3 text-xs font-bold gap-1.5">
                <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  <span>View Form</span>
                </a>
              </Button>
            </div>
          )}
        </div>

        <TrialBanner />

        {profile ? (
          <div className="space-y-6">
            <BusinessProfileCard profile={profile} />
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
