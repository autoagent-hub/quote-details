import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Sliders,
  Send,
  Globe,
  FlaskConical,
  ReceiptText,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/pricing";
import type { Profile, Quote } from "./types";
import { TelegramConnectModal } from "./TelegramConnectModal";

interface OPayDashboardHeaderProps {
  profile: Profile;
  quotes: Quote[];
  onSelectTab: (tab: string) => void;
  isSubscribed?: boolean;
}

export function OPayDashboardHeader({
  profile,
  quotes,
  onSelectTab,
  isSubscribed = false,
}: OPayDashboardHeaderProps) {
  const [showBalance, setShowBalance] = useState(() => {
    try {
      return localStorage.getItem("detailr_show_balance") !== "false";
    } catch {
      return true;
    }
  });

  const [copied, setCopied] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  const toggleShowBalance = () => {
    setShowBalance((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("detailr_show_balance", next ? "true" : "false");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const totalPipeline = quotes.reduce((acc, q) => acc + (Number(q.estimated_price) || 0), 0);
  const avgQuote = quotes.length ? Math.round(totalPipeline / quotes.length) : 0;
  const isConnected = !!profile.telegram_chat_id;

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${profile.slug}`
      : `https://detailr.online/${profile.slug}`;

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Quote form link copied!", {
      description: "Send this link to customers or put it on your Instagram bio.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Check setup checklist items
  const hasPhone = !!profile.phone;
  const hasTelegram = !!profile.telegram_chat_id;
  const completedSteps = (hasPhone ? 1 : 0) + (hasTelegram ? 1 : 0) + (quotes.length > 0 ? 1 : 0);
  const totalSteps = 3;
  const isAllSetup = completedSteps === totalSteps;

  return (
    <div className="space-y-6">
      {/* 1. OPay-Inspired Account Balance & Identity Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/15">
        {/* Subtle decorative curved ambient rings */}
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/5 pointer-events-none blur-2xl" />
        <div className="absolute -left-12 -bottom-12 size-48 rounded-full bg-teal-400/10 pointer-events-none blur-xl" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: Greeting & Shop Profile */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-11 sm:size-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                {profile.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt={profile.business_name}
                    className="size-full object-contain rounded-xl"
                  />
                ) : (
                  <Store className="size-5 text-white/90" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white/80">{greeting},</span>
                  <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {profile.business_name || "Detailer"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/70">
                  <span>/{profile.slug}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-200 font-semibold">
                    <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Badge */}
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-extrabold text-white shadow-sm">
                  <Sparkles className="size-3.5 text-amber-300 fill-amber-300" />
                  <span>PRO PLAN</span>
                </div>
              ) : (
                <Link
                  to="/upgrade"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 text-xs font-bold text-white transition-all shadow-sm"
                >
                  <span>Free Trial Active</span>
                  <ArrowUpRight className="size-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Center: Total Pipeline Value with OPay Eye Toggle */}
          <div className="pt-2 pb-1 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-100/80">
              <span>Total Lead Pipeline</span>
              <button
                type="button"
                onClick={toggleShowBalance}
                className="p-1 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white transition-colors"
                title={showBalance ? "Hide balance" : "Show balance"}
                aria-label={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
              </button>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-mono">
                {showBalance ? money(totalPipeline, profile.currency) : "••••••••"}
              </span>
              <span className="text-xs text-emerald-200/90 font-medium">
                across {quotes.length} {quotes.length === 1 ? "quote" : "quotes"}
              </span>
            </div>
          </div>

          {/* Bottom Summary Metrics Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-white/15">
            <button
              type="button"
              onClick={() => onSelectTab("quotes")}
              className="text-left p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-sm transition-all"
            >
              <div className="text-[10px] sm:text-xs font-medium text-white/70">Total Leads</div>
              <div className="text-base sm:text-xl font-extrabold text-white">
                {showBalance ? quotes.length : "••"}
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab("pricing")}
              className="text-left p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-sm transition-all"
            >
              <div className="text-[10px] sm:text-xs font-medium text-white/70">Average Ticket</div>
              <div className="text-base sm:text-xl font-extrabold text-white">
                {showBalance ? money(avgQuote, profile.currency) : "••"}
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                isConnected ? onSelectTab("notifications") : setConnectModalOpen(true)
              }
              className="text-left p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-sm transition-all"
            >
              <div className="text-[10px] sm:text-xs font-medium text-white/70">Phone Alerts</div>
              <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 mt-1">
                <span
                  className={`size-2 rounded-full ${
                    isConnected ? "bg-emerald-300" : "bg-amber-300 animate-pulse"
                  }`}
                />
                <span className="truncate">{isConnected ? "Active" : "Connect"}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 2. OPay-Style Quick Action Hub */}
      <div className="rounded-3xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h3>
          <span className="text-xs text-muted-foreground font-medium">Tap to manage</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 pt-4">
          {/* Action 1: Copy Quote Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border border-border/50 bg-background/80 hover:bg-emerald-500/5 hover:border-emerald-500/40 text-foreground transition-all group shadow-xs active:scale-98"
          >
            <div className="size-11 sm:size-12 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 flex items-center justify-center transition-colors shadow-xs">
              {copied ? <Check className="size-5 text-emerald-600" /> : <Copy className="size-5" />}
            </div>
            <span className="text-xs font-bold text-center leading-tight">
              {copied ? "Copied!" : "Copy Link"}
            </span>
            <span className="text-[10px] text-muted-foreground text-center">
              Share with clients
            </span>
          </button>

          {/* Action 2: Sandbox Preview */}
          <a
            href={`/${profile.slug}?test=true`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border border-border/50 bg-background/80 hover:bg-amber-500/5 hover:border-amber-500/40 text-foreground transition-all group shadow-xs active:scale-98"
          >
            <div className="size-11 sm:size-12 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-600 flex items-center justify-center transition-colors shadow-xs">
              <FlaskConical className="size-5" />
            </div>
            <span className="text-xs font-bold text-center leading-tight">Test Sandbox</span>
            <span className="text-[10px] text-muted-foreground text-center">Safe test quotes</span>
          </a>

          {/* Action 3: Services & Rates */}
          <button
            type="button"
            onClick={() => onSelectTab("pricing")}
            className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border border-border/50 bg-background/80 hover:bg-blue-500/5 hover:border-blue-500/40 text-foreground transition-all group shadow-xs active:scale-98"
          >
            <div className="size-11 sm:size-12 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-600 flex items-center justify-center transition-colors shadow-xs">
              <Sliders className="size-5" />
            </div>
            <span className="text-xs font-bold text-center leading-tight">Services & Prices</span>
            <span className="text-[10px] text-muted-foreground text-center">Edit your rates</span>
          </button>

          {/* Action 4: Telegram Phone Alerts */}
          <button
            type="button"
            onClick={() => (isConnected ? onSelectTab("notifications") : setConnectModalOpen(true))}
            className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border border-border/50 bg-background/80 hover:bg-sky-500/5 hover:border-sky-500/40 text-foreground transition-all group shadow-xs active:scale-98"
          >
            <div className="size-11 sm:size-12 rounded-2xl bg-sky-500/10 group-hover:bg-sky-500/20 text-sky-600 flex items-center justify-center transition-colors shadow-xs">
              <Send className="size-5" />
            </div>
            <span className="text-xs font-bold text-center leading-tight">Phone Alerts</span>
            <span className="text-[10px] text-muted-foreground text-center">
              {isConnected ? "Manage Telegram" : "Connect bot"}
            </span>
          </button>

          {/* Action 5: Live Customer Page */}
          <a
            href={`/${profile.slug}`}
            target="_blank"
            rel="noreferrer"
            className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border border-border/50 bg-background/80 hover:bg-purple-500/5 hover:border-purple-500/40 text-foreground transition-all group shadow-xs active:scale-98"
          >
            <div className="size-11 sm:size-12 rounded-2xl bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-600 flex items-center justify-center transition-colors shadow-xs">
              <Globe className="size-5" />
            </div>
            <span className="text-xs font-bold text-center leading-tight">Live Form</span>
            <span className="text-[10px] text-muted-foreground text-center">View client page</span>
          </a>
        </div>
      </div>

      {/* 3. Clean Setup Strip (only if setup is not complete) */}
      {!isAllSetup && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border/60 bg-muted/20 text-xs">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="font-bold text-foreground">
                Shop Setup: {completedSteps} of {totalSteps} items complete
              </p>
              <p className="text-muted-foreground text-[11px]">
                {!hasTelegram
                  ? "Connect Telegram so new quote requests instantly ping your phone."
                  : !quotes.length
                    ? "Send your first test quote or share your link with clients."
                    : "Finish adding your phone number."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!hasTelegram ? (
              <Button
                size="sm"
                onClick={() => setConnectModalOpen(true)}
                className="h-8 rounded-xl text-xs font-bold bg-primary text-white"
              >
                Connect Telegram
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 rounded-xl text-xs font-bold"
              >
                <Link to="/quotes">View Quotes</Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Telegram Connect Modal */}
      <TelegramConnectModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        profile={profile}
      />
    </div>
  );
}
