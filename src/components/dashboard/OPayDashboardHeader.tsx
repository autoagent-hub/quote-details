import { useState } from "react";
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
  ChevronRight,
  Store,
  Phone,
  Car,
  Clock,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { money, formatWhen } from "@/lib/pricing";
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
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);
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
    toast.success("Quote link copied to clipboard!", {
      description: "Paste this link into your Instagram bio, TikTok, or text to clients.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPhone = (phone: string, id: string) => {
    void navigator.clipboard.writeText(phone);
    setCopiedQuoteId(id);
    toast.success(`Phone copied: ${phone}`);
    setTimeout(() => setCopiedQuoteId(null), 2000);
  };

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Recent 4 quotes for the high-contrast activity feed
  const recentQuotes = quotes.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. OPay High-Contrast Account Hero Card (Emerald & Deep Teal)            */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00965C] via-[#00A86B] to-[#007F4E] text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/20 border border-emerald-500/30">
        {/* Soft background ambient rings */}
        <div className="absolute -right-16 -top-16 size-72 rounded-full bg-white/10 pointer-events-none blur-3xl" />
        <div className="absolute -left-12 -bottom-12 size-56 rounded-full bg-teal-300/15 pointer-events-none blur-2xl" />

        <div className="relative z-10 space-y-6">
          {/* Header Row: Shop Identity & Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 sm:size-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                {profile.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt={profile.business_name}
                    className="size-full object-contain rounded-xl"
                  />
                ) : (
                  <Store className="size-6 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-100">{greeting},</span>
                  <span className="text-base sm:text-lg font-black text-white tracking-tight">
                    {profile.business_name || "Detailer"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/80 font-mono mt-0.5">
                  <span>/{profile.slug}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-200 font-sans font-bold">
                    <span className="size-2 rounded-full bg-emerald-300 animate-pulse" />
                    Accepting Quotes
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Badge (High Contrast) */}
            <div>
              {isSubscribed ? (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-extrabold text-white shadow-sm">
                  <Sparkles className="size-3.5 text-amber-300 fill-amber-300" />
                  <span>PRO MEMBER</span>
                </div>
              ) : (
                <Link
                  to="/upgrade"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-xs font-bold text-white transition-all shadow-sm"
                >
                  <span>Free Trial</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Center: Total Pipeline Balance Display with OPay Privacy Eye */}
          <div className="pt-2 pb-1 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-100">
              <span>Total Lead Value</span>
              <button
                type="button"
                onClick={toggleShowBalance}
                className="p-1 rounded-lg hover:bg-white/15 text-emerald-100 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                title={showBalance ? "Hide amount" : "Show amount"}
                aria-label={showBalance ? "Hide amount" : "Show amount"}
              >
                {showBalance ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-mono">
                {showBalance ? money(totalPipeline, profile.currency) : "••••••••"}
              </span>
              <span className="text-xs text-emerald-100 font-medium">
                across {quotes.length} total {quotes.length === 1 ? "quote" : "quotes"}
              </span>
            </div>
          </div>

          {/* Sub-Metrics Grid (High-Contrast White Glass Tiles) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={() => onSelectTab("quotes")}
              className="text-left p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <div className="text-[11px] font-semibold text-emerald-100">Customer Leads</div>
              <div className="text-lg sm:text-2xl font-black text-white mt-0.5">
                {showBalance ? quotes.length : "••"}
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab("pricing")}
              className="text-left p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <div className="text-[11px] font-semibold text-emerald-100">Avg. Quote</div>
              <div className="text-lg sm:text-2xl font-black text-white mt-0.5">
                {showBalance ? money(avgQuote, profile.currency) : "••"}
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                isConnected ? onSelectTab("notifications") : setConnectModalOpen(true)
              }
              className="text-left p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <div className="text-[11px] font-semibold text-emerald-100">Phone Alerts</div>
              <div className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 mt-1">
                <span
                  className={`size-2 rounded-full ${
                    isConnected ? "bg-emerald-300" : "bg-amber-300 animate-pulse"
                  }`}
                />
                <span className="truncate">{isConnected ? "Connected" : "Connect"}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Grouped Actions Hub (Logical Sets for Readability & High Contrast)      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Action Group 1: Share & Acquire (Customer Facing) */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Share & Acquire Leads
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">Customer links</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Copy Quote Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-foreground transition-all group active:scale-98"
            >
              <div className="size-11 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 flex items-center justify-center transition-colors shadow-xs">
                {copied ? (
                  <Check className="size-5 text-emerald-600" />
                ) : (
                  <Copy className="size-5" />
                )}
              </div>
              <span className="text-xs font-bold text-center leading-tight">
                {copied ? "Copied!" : "Copy Link"}
              </span>
              <span className="text-[10px] text-muted-foreground text-center">
                Share with clients
              </span>
            </button>

            {/* Test Sandbox */}
            <a
              href={`/${profile.slug}?test=true`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-amber-500/10 hover:border-amber-500/40 text-foreground transition-all group active:scale-98"
            >
              <div className="size-11 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-600 flex items-center justify-center transition-colors shadow-xs">
                <FlaskConical className="size-5" />
              </div>
              <span className="text-xs font-bold text-center leading-tight">Test Sandbox</span>
              <span className="text-[10px] text-muted-foreground text-center">Try calculator</span>
            </a>

            {/* Live Customer Page */}
            <a
              href={`/${profile.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-blue-500/10 hover:border-blue-500/40 text-foreground transition-all group active:scale-98"
            >
              <div className="size-11 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-600 flex items-center justify-center transition-colors shadow-xs">
                <Globe className="size-5" />
              </div>
              <span className="text-xs font-bold text-center leading-tight">Live Form</span>
              <span className="text-[10px] text-muted-foreground text-center">Open shop URL</span>
            </a>
          </div>
        </div>

        {/* Action Group 2: Shop Operations (Internal Controls) */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Shop Operations
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">Settings & alerts</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Edit Services & Rates */}
            <button
              type="button"
              onClick={() => onSelectTab("pricing")}
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-primary/10 hover:border-primary/40 text-foreground transition-all group active:scale-98"
            >
              <div className="size-11 rounded-2xl bg-primary/10 group-hover:bg-primary/20 text-primary flex items-center justify-center transition-colors shadow-xs">
                <Sliders className="size-5" />
              </div>
              <span className="text-xs font-bold text-center leading-tight">Service Rates</span>
              <span className="text-[10px] text-muted-foreground text-center">Adjust pricing</span>
            </button>

            {/* Telegram Phone Alerts */}
            <button
              type="button"
              onClick={() =>
                isConnected ? onSelectTab("notifications") : setConnectModalOpen(true)
              }
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-sky-500/10 hover:border-sky-500/40 text-foreground transition-all group active:scale-98"
            >
              <div className="size-11 rounded-2xl bg-sky-500/10 group-hover:bg-sky-500/20 text-sky-600 flex items-center justify-center transition-colors shadow-xs">
                <Send className="size-5" />
              </div>
              <span className="text-xs font-bold text-center leading-tight">Phone Alerts</span>
              <span className="text-[10px] text-muted-foreground text-center">
                {isConnected ? "Active" : "Connect bot"}
              </span>
            </button>

            {/* Shop Profile */}
            <button
              type="button"
              onClick={() => onSelectTab("settings")}
              className="flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-purple-500/10 hover:border-purple-500/40 text-foreground transition-all group active:scale-98"
            >
              <div className="size-11 rounded-2xl bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-600 flex items-center justify-center transition-colors shadow-xs">
                <Store className="size-5" />
              </div>
              <span className="text-xs font-bold text-center leading-tight">Shop Profile</span>
              <span className="text-[10px] text-muted-foreground text-center">Name & branding</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. OPay-Style Recent Activity Card (High Contrast Transaction Feed)      */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <ReceiptText className="size-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-foreground">Recent Customer Leads</h3>
            <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">
              {quotes.length}
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("quotes")}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {recentQuotes.length > 0 ? (
          <div className="divide-y divide-border/40">
            {recentQuotes.map((q) => (
              <div
                key={q.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-500/20">
                    {(q.customer_name || "C").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {q.customer_name || "Anonymous Lead"}
                      </span>
                      {q.is_test && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          TEST
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="truncate max-w-[200px] sm:max-w-xs font-medium">
                        {q.vehicle_desc || q.vehicle_type} · {q.service_label}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0">{formatWhen(q.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                    {showBalance
                      ? money(q.estimated_price, q.currency || profile.currency)
                      : "••••"}
                  </span>
                  {q.customer_phone && (
                    <div className="flex items-center gap-1">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs font-bold rounded-lg px-2"
                      >
                        <a href={`tel:${q.customer_phone}`}>
                          <Phone className="size-3 mr-1 text-emerald-600" />
                          <span>Call</span>
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs font-bold rounded-lg px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopyPhone(q.customer_phone, q.id)}
                      >
                        {copiedQuoteId === q.id ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-muted/40 text-muted-foreground flex items-center justify-center mx-auto">
              <ReceiptText className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-sm text-foreground">No customer leads received yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Share your public quote form with car owners to start receiving automated price
                estimates.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleCopyLink}
              size="sm"
              className="h-8 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Copy className="size-3.5 mr-1.5" /> Copy Quote Link
            </Button>
          </div>
        )}
      </div>

      {/* Telegram Connect Modal */}
      <TelegramConnectModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        profile={profile}
      />
    </div>
  );
}
