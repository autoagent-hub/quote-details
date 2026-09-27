import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Lock,
  CreditCard,
  Sparkles,
  LogOut,
  ArrowRight,
  ShieldAlert,
  Globe,
  Send,
  Sliders,
  CheckCircle2,
} from "lucide-react";

import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { getUpgradeCheckout } from "@/lib/billing.functions";

interface TrialExpiredLockProps {
  profile?: {
    slug?: string | null;
    business_name?: string | null;
  } | null;
  trial?: {
    status?: string;
    isSuspended?: boolean;
    suspensionReason?: string;
    expiresAt?: string | null;
  } | null;
}

export function TrialExpiredLock({ profile, trial }: TrialExpiredLockProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchCheckout = useServerFn(getUpgradeCheckout);

  const { data: checkout } = useQuery({
    queryKey: ["upgrade-checkout"],
    queryFn: () => fetchCheckout(),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  };

  const businessName = profile?.business_name || "Your Business";
  const slug = profile?.slug || "";
  const checkoutHref = checkout?.href || "/upgrade";

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* Header Bar */}
      <header className="mx-auto w-full max-w-4xl flex items-center justify-between pb-6 border-b border-border/40">
        <QuoteFlowLogo size="md" linkToHome={false} />
        <div className="flex items-center gap-3">
          <Badge
            variant="destructive"
            className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <Lock className="size-3" /> Trial Expired
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground text-xs font-bold gap-1.5"
          >
            <LogOut className="size-3.5" /> Sign Out
          </Button>
        </div>
      </header>

      {/* Main Lockout Hero Section */}
      <main className="mx-auto w-full max-w-xl my-auto py-10 space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex size-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500 shadow-xl shadow-rose-500/5 ring-1 ring-rose-500/20">
            <ShieldAlert className="size-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Your 7-Day Free Trial Has Ended
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
              Your business quote link{" "}
              {slug ? (
                <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground font-semibold">
                  detailr.online/{slug}
                </code>
              ) : (
                "page"
              )}{" "}
              is currently locked and inactive. Upgrade to Detailr Pro to immediately reactivate
              your link and keep receiving customer quote requests and phone alerts.
            </p>
          </div>
        </div>

        {/* Locked Features Card */}
        <div className="rounded-3xl border border-rose-500/20 bg-card p-6 shadow-xl shadow-black/5 text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
              <Lock className="size-3.5" /> Temporarily Locked Features
            </span>
            <span className="text-xs font-mono text-muted-foreground">Detailr Pro ($9.99/mo)</span>
          </div>

          <ul className="space-y-3 text-xs text-muted-foreground">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <Globe className="size-4 text-rose-500" /> Public Quote Link (detailr.online/{slug})
              </span>
              <span className="text-rose-500 font-bold uppercase text-[10px]">Disabled</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <Send className="size-4 text-rose-500" /> Real-time Telegram Phone Alerts
              </span>
              <span className="text-rose-500 font-bold uppercase text-[10px]">Paused</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <Sliders className="size-4 text-rose-500" /> Dashboard & Pricing Controls
              </span>
              <span className="text-rose-500 font-bold uppercase text-[10px]">Locked</span>
            </li>
          </ul>
        </div>

        {/* Upgrade Action Box */}
        <div className="space-y-3">
          <Button
            asChild
            variant="hero"
            size="xl"
            className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 gap-2"
          >
            <a
              href={checkoutHref}
              target={checkoutHref.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
            >
              <CreditCard className="size-5" />
              <span>Upgrade to Pro ($9.99/month)</span>
              <ArrowRight className="size-5 ml-auto" />
            </a>
          </Button>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" /> Instant reactivation
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" /> Cancel anytime
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-4xl text-center pt-6 border-t border-border/40 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Detailr · A Nerochaze Company. All rights reserved.
      </footer>
    </div>
  );
}
