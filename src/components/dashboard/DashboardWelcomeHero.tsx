import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  FlaskConical,
  Sparkles,
  X,
  ChevronRight,
  Sliders,
  Send,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Profile } from "./types";

export function DashboardWelcomeHero({
  profile,
  onSelectTab,
}: {
  profile: Profile;
  onSelectTab: (tab: string) => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  const liveUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${profile.slug}`
      : `https://detailr.online/${profile.slug}`;

  const hasTelegram = !!profile.telegram_chat_id;

  const copyLink = () => {
    void navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    toast.success("Quote form link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-card p-6 shadow-xl shadow-primary/5 transition-all">
      {/* Subtle decorative glow background */}
      <div className="absolute -right-12 -top-12 size-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground/50 hover:bg-muted/50 hover:text-foreground transition-colors"
        title="Dismiss welcome guide"
      >
        <X className="size-4" />
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Welcome Text */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="size-3.5" />
            <span>Welcome to Detailr, {profile.business_name || "Detailer"}!</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
            Your Instant Auto Detailing Quote Hub
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Follow these 3 quick steps to start receiving automated customer leads directly on your
            phone.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Button
            variant="default"
            size="sm"
            className="h-10 px-4 text-xs font-bold rounded-xl gap-2 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={copyLink}
          >
            {copied ? <Check className="size-4 text-white" /> : <Copy className="size-4" />}
            <span>{copied ? "Link Copied!" : "Copy Quote Link"}</span>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-10 px-4 text-xs font-bold rounded-xl gap-2 border-border/80 bg-background/50 hover:bg-background"
          >
            <a href={`/${profile.slug}?test=true`} target="_blank" rel="noreferrer">
              <FlaskConical className="size-4 text-amber-500" />
              <span>Test Sandbox</span>
            </a>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-10 px-3 text-xs font-bold rounded-xl gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
              <Globe className="size-4 opacity-70" />
              <span>Live Form</span>
              <ExternalLink className="size-3 opacity-50" />
            </a>
          </Button>
        </div>
      </div>

      {/* 3 Step Navigation Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/40">
        {/* Step 1 */}
        <button
          type="button"
          onClick={() => onSelectTab("pricing")}
          className="group text-left p-3.5 rounded-2xl border border-border/60 bg-background/60 hover:bg-background hover:border-primary/40 transition-all flex items-start gap-3"
        >
          <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">
            1
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Set Your Prices</span>
              <ChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              Set sedan, SUV, and add-on rates
            </p>
          </div>
        </button>

        {/* Step 2 */}
        <button
          type="button"
          onClick={() => onSelectTab("notifications")}
          className="group text-left p-3.5 rounded-2xl border border-border/60 bg-background/60 hover:bg-background hover:border-primary/40 transition-all flex items-start gap-3"
        >
          <div
            className={`size-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-110 transition-transform ${hasTelegram ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}
          >
            {hasTelegram ? "✓" : "2"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Link Telegram Bot</span>
              <ChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {hasTelegram ? "Connected & active" : "Get phone alerts on new quotes"}
            </p>
          </div>
        </button>

        {/* Step 3 */}
        <button
          type="button"
          onClick={copyLink}
          className="group text-left p-3.5 rounded-2xl border border-border/60 bg-background/60 hover:bg-background hover:border-primary/40 transition-all flex items-start gap-3"
        >
          <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">
            3
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Share Your Link</span>
              <Copy className="size-3.5 text-muted-foreground/40 group-hover:text-blue-600 transition-colors" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              Put on Instagram, website & bio
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
