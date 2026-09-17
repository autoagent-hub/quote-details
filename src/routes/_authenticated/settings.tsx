import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Settings,
  User,
  Shield,
  Bell,
  Sliders,
  Store,
  HelpCircle,
  ExternalLink,
  Check,
  Copy,
  KeyRound,
  Send,
  Sparkles,
  ArrowRight,
  ReceiptText,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { SkeletonDashboard } from "@/components/skeletons/SkeletonDashboard";
import { AppNavigation } from "@/components/dashboard/AppNavigation";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/components/dashboard/types";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Account & App Settings — Detailr (detailr.online)" },
      {
        name: "description",
        content: "Manage your Detailr account settings, security, and application preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

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

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    setResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/settings`,
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to send password reset email");
    } finally {
      setResettingPassword(false);
    }
  };

  const quickPages = [
    {
      title: "Dashboard Overview",
      description: "Recent conversion metrics, quick stats, and performance overview.",
      to: "/dashboard",
      icon: Settings,
      badge: "Main",
      color: "text-primary bg-primary/10 border-primary/20",
    },
    {
      title: "Leads & Quotes",
      description: "View all customer submissions, photos, vehicle specs, and contact info.",
      to: "/quotes",
      icon: ReceiptText,
      badge: "Quotes",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Services & Pricing",
      description: "Customize auto detailing packages, tiers, add-ons, and pricing rates.",
      to: "/pricing",
      icon: Sliders,
      badge: "Pricing",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Telegram Phone Alerts",
      description: "Configure instant push notifications directly to your phone via Telegram.",
      to: "/notifications",
      icon: Send,
      badge: profile?.telegram_chat_id ? "Active" : "Action Req",
      badgeVariant: profile?.telegram_chat_id ? "default" : "destructive",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Shop Profile & Branding",
      description: "Manage business name, public URL slug, currency, and social handles.",
      to: "/profile",
      icon: Store,
      badge: "Profile",
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Documentation & Help",
      description: "Setup guides, Telegram bot walkthrough, FAQs, and support channels.",
      to: "/help",
      icon: HelpCircle,
      badge: "Support",
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-surface/50 pb-16 text-foreground font-sans">
      <AppNavigation profile={profile ?? null} activeTab="settings" userEmail={user?.email} />

      <main className="mx-auto max-w-5xl space-y-8 px-4 sm:px-8 py-8">
        <TrialBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Settings className="size-4" />
              </span>
              <span>General Settings & Navigation</span>
            </h1>
            <p className="text-xs font-medium text-muted-foreground max-w-2xl">
              Manage your account authentication, system preferences, and quick links across all
              Detailr workspace modules.
            </p>
          </div>

          {profile?.slug && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl px-3 border-border/60 text-xs font-bold gap-1.5"
                onClick={copyUrl}
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>{copied ? "Copied Link" : "Copy Quote URL"}</span>
              </Button>
              <Button asChild size="sm" className="h-8 rounded-xl px-3 text-xs font-bold gap-1.5">
                <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
                  <span>Visit Shop</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Quick Hub - Direct Access to All Pages */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Workspace Pages & Quick Links
            </h2>
            <span className="text-xs text-muted-foreground">All application sections</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickPages.map((page) => {
              const Icon = page.icon;
              return (
                <Link
                  key={page.to}
                  to={page.to}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex size-9 items-center justify-center rounded-xl border ${page.color}`}
                      >
                        <Icon className="size-4.5" />
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {page.badge}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                        {page.title}
                        <ArrowRight className="size-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {page.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] font-semibold text-primary">
                    <span>Open page</span>
                    <ArrowRight className="size-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Account Details & Security Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Profile */}
          <Card className="rounded-2xl border-border/60 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="size-4 text-primary" />
                <span>Account Credentials</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Your primary login email and identity credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="account-email" className="text-xs font-semibold">
                  Registered Email
                </Label>
                <Input
                  id="account-email"
                  value={user?.email || "Signed in"}
                  disabled
                  className="bg-muted/40 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-id" className="text-xs font-semibold">
                  Account Identifier
                </Label>
                <Input
                  id="user-id"
                  value={user?.id || ""}
                  disabled
                  className="bg-muted/40 font-mono text-[11px] cursor-not-allowed"
                />
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/20 p-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">Authentication Provider</p>
                  <p className="text-[11px] text-muted-foreground">
                    {user?.app_metadata?.provider === "google"
                      ? "Connected via Google Sign-In"
                      : "Email & Password login"}
                  </p>
                </div>
                <Badge variant="outline" className="font-bold text-[10px]">
                  {user?.app_metadata?.provider || "Supabase"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Security & Password */}
          <Card className="rounded-2xl border-border/60 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="size-4 text-emerald-500" />
                <span>Security & Access</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your password, session security, and access tokens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <KeyRound className="size-4 text-amber-500" />
                  <span>Password Reset</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Need to change or set a password for your account? We'll email a secure password
                  reset link to <strong className="text-foreground">{user?.email}</strong>.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-bold gap-1.5"
                  onClick={handleSendPasswordReset}
                  disabled={resettingPassword || !user?.email}
                >
                  <Send className="size-3.5" />
                  <span>
                    {resettingPassword ? "Sending Email..." : "Send Password Reset Email"}
                  </span>
                </Button>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
                <Check className="size-4 shrink-0 text-emerald-500" />
                <p className="text-[11px] leading-relaxed">
                  Your session is protected with secure cryptographic tokens and encrypted in
                  transit.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Status Card */}
        <Card className="rounded-2xl border-border/60 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              <span>Workspace Integration Status</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Live status of key components powering your detailing business.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Telegram Alerts</span>
                  <span
                    className={`size-2 rounded-full ${
                      profile?.telegram_chat_id ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {profile?.telegram_chat_id
                    ? "Connected to phone alerts"
                    : "Not linked yet — leads won't reach your phone"}
                </p>
                <Link
                  to="/notifications"
                  className="inline-block text-[11px] font-bold text-primary hover:underline pt-1"
                >
                  Configure Alerts →
                </Link>
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Public Quote Link</span>
                  <span className="size-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {profile?.slug ? `Active at /${profile.slug}` : "Slug not configured"}
                </p>
                <Link
                  to="/profile"
                  className="inline-block text-[11px] font-bold text-primary hover:underline pt-1"
                >
                  Edit Shop Profile →
                </Link>
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Pricing Catalog</span>
                  <span className="size-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Configured in {profile?.currency || "USD"} with vehicle categories
                </p>
                <Link
                  to="/pricing"
                  className="inline-block text-[11px] font-bold text-primary hover:underline pt-1"
                >
                  Manage Services →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
