import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  ExternalLink,
  FlaskConical,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sliders,
  Send,
  Globe,
  HelpCircle,
  Smartphone,
  Tag,
  Share2,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { sendQuoteAlert } from "@/lib/telegram.functions";
import type { Profile } from "./types";
import { TelegramConnectModal } from "./TelegramConnectModal";

export function DashboardWelcomeHero({
  profile,
  onSelectTab,
}: {
  profile: Profile;
  onSelectTab: (tab: string) => void;
}) {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [creatingTestQuote, setCreatingTestQuote] = useState(false);

  const liveUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${profile.slug}`
      : `https://detailr.online/${profile.slug}`;

  const hasTelegram = !!profile.telegram_chat_id;

  // Calculate setup steps:
  // Step 1: Link generated (Always 100%)
  // Step 2: Telegram connected (1 if connected, 0 if not)
  // Step 3: Prices reviewed
  const stepsCompleted = 1 + (hasTelegram ? 1 : 0) + 1; // 2 of 3 or 3 of 3
  const progressPercent = Math.round((stepsCompleted / 3) * 100);

  const copyLink = () => {
    void navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    toast.success("Quote link copied! Share this with your customers.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateTestQuote = async () => {
    setCreatingTestQuote(true);
    try {
      // 1. Insert sample quote into Supabase
      const { data: newQuote, error } = await supabase
        .from("quotes")
        .insert({
          detailer_id: profile.id,
          customer_name: "Alex Morgan (Sample Test Lead)",
          customer_phone: profile.phone || "+1 555-019-2834",
          vehicle_type: "suv",
          vehicle_desc: "2024 Tesla Model Y (Midsize SUV)",
          service_key: "full-detail",
          service_label: "Full Detail Package",
          service_price: 190,
          addons: ["pet-hair"],
          estimated_price: 230,
          notes: "Sample lead created to show you how customer requests appear on your dashboard.",
          is_test: true,
          currency: profile.currency || "USD",
        })
        .select()
        .single();

      if (error) throw error;

      // 2. If Telegram is connected, also send a test alert!
      if (hasTelegram) {
        try {
          await sendQuoteAlert({
            data: {
              detailerId: profile.id,
              customerName: "Alex Morgan (Sample Test Lead)",
              customerPhone: profile.phone || "+1 555-019-2834",
              vehicle: "2024 Tesla Model Y (Midsize SUV)",
              service: { label: "Full Detail Package", price: 190 },
              addons: [{ label: "Pet Hair Removal", price: 40 }],
              estimate: 230,
              notes: "Sample lead test! Check your Detailr dashboard to see the full lead details.",
              isTest: true,
            },
          });
        } catch {
          // non-critical
        }
      }

      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Sample quote created!", {
        description: hasTelegram
          ? "Check your Telegram app and the Customer Leads tab below."
          : "Check the Customer Leads tab below to see how leads look.",
      });
      onSelectTab("quotes");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not generate sample quote.");
    } finally {
      setCreatingTestQuote(false);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-card p-6 sm:p-7 shadow-xl shadow-primary/5 transition-all">
        {/* Decorative ambient gradient */}
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Sparkles className="size-3.5" />
                <span>Simple Setup Guide</span>
              </span>

              {hasTelegram ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="size-3.5" /> All Systems Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600">
                  ⚠️ 1 Quick Step Remaining
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
              Welcome, {profile.business_name || "Detailer"}!
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your instant quote form is live. Follow these 3 easy steps to start taking customer
              bookings.
            </p>
          </div>

          {/* Quick Collapse / Expand & Help Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl px-2.5 text-xs font-bold border-border/80 bg-background/50 hover:bg-background gap-1.5"
              onClick={() => setShowHowItWorks(!showHowItWorks)}
            >
              <HelpCircle className="size-3.5 text-primary" />
              <span>{showHowItWorks ? "Hide Guide" : "How it works"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-xl px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand setup steps" : "Collapse setup steps"}
            >
              {collapsed ? (
                <span className="flex items-center gap-1">
                  <span>Show Steps</span>
                  <ChevronDown className="size-4" />
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span>Minimize</span>
                  <ChevronUp className="size-4" />
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* "How Detailr Works" Simple Visual Explainer for Beginners */}
        {showHowItWorks && (
          <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3 animate-in fade-in-50 duration-200">
            <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              How Detailr works in 3 simple steps:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="rounded-xl bg-background/80 p-3.5 border border-border/50 space-y-1">
                <div className="size-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="text-xs font-bold text-foreground">Customer Clicks Your Link</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Put your link on Instagram, TikTok, or text it when customers ask "how much?".
                </p>
              </div>

              <div className="rounded-xl bg-background/80 p-3.5 border border-border/50 space-y-1">
                <div className="size-6 rounded-lg bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="text-xs font-bold text-foreground">Gets Instant Accurate Price</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  They select Sedan, SUV, or Truck + package. Total calculates automatically in
                  seconds.
                </p>
              </div>

              <div className="rounded-xl bg-background/80 p-3.5 border border-border/50 space-y-1">
                <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="text-xs font-bold text-foreground">You Get Alert & Close the Job</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  You get their name, phone, and vehicle sent straight to your phone so you can call
                  or text to book!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {!collapsed && (
          <div className="mt-5 pt-4 border-t border-border/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-2">
                <span>Setup Progress:</span>
                <span className="text-primary font-mono">{stepsCompleted} of 3 completed</span>
              </span>
              <span className="font-mono font-bold text-muted-foreground">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* The 3 Main Interactive Setup Cards */}
        {!collapsed && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Step 1: Your Quote Link (Always Ready) */}
            <div className="rounded-2xl border border-border/70 bg-background/80 backdrop-blur-sm p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all shadow-xs">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="size-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    ✓
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                  >
                    Step 1: READY
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Globe className="size-4 text-emerald-600" />
                    Your Quote Link is Live
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Your personal vehicle pricing calculator is active and ready to take customer
                    inquiries.
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-2 font-mono text-[11px] font-semibold truncate text-foreground select-all">
                  {liveUrl.replace(/^https?:\/\//, "")}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="default"
                  size="sm"
                  className="h-9 flex-1 text-xs font-bold rounded-xl gap-1.5 bg-primary text-white hover:bg-primary/90 shadow-sm"
                  onClick={copyLink}
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs font-bold rounded-xl border-border/80 hover:bg-surface"
                  title="View live customer form"
                >
                  <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5 opacity-70" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Step 2: Connect Phone for Alerts (Telegram) */}
            <div
              className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all shadow-xs ${
                hasTelegram
                  ? "border-border/70 bg-background/80 hover:border-emerald-500/40"
                  : "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`size-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                      hasTelegram
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/20 text-amber-700"
                    }`}
                  >
                    {hasTelegram ? "✓" : "2"}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      hasTelegram
                        ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                        : "border-amber-500/40 text-amber-700 bg-amber-500/10"
                    }`}
                  >
                    {hasTelegram ? "Step 2: CONNECTED" : "Step 2: 30-SEC SETUP"}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Smartphone className="size-4 text-blue-500" />
                    Phone Alerts (Telegram)
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {hasTelegram
                      ? "Your phone will alert you instantly when a customer requests a quote."
                      : "Connect the free Telegram bot so new quotes ring your phone immediately."}
                  </p>
                </div>

                <div className="text-[11px] text-muted-foreground/90 font-medium">
                  {hasTelegram ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      Receiving instant alerts
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium">
                      💡 Free app, takes 1 tap to link.
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-1">
                {hasTelegram ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-full text-xs font-bold rounded-xl border-border/80 hover:bg-surface gap-1.5 text-foreground"
                    onClick={() => setConnectModalOpen(true)}
                  >
                    <Send className="size-3.5 text-blue-500" />
                    <span>Manage Connection</span>
                  </Button>
                ) : (
                  <Button
                    variant="hero"
                    size="sm"
                    className="h-9 w-full text-xs font-bold rounded-xl gap-1.5 shadow-md shadow-primary/10"
                    onClick={() => setConnectModalOpen(true)}
                  >
                    <Send className="size-3.5" />
                    <span>Connect Telegram Bot</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Step 3: Review Prices & Services */}
            <div className="rounded-2xl border border-border/70 bg-background/80 backdrop-blur-sm p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all shadow-xs">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="size-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    ✓
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                  >
                    Step 3: PRE-LOADED
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="size-4 text-amber-500" />
                    Prices & Packages
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Standard industry rates are already loaded ($150 Full Detail, $40 SUV fee,
                    etc.). Adjust them anytime.
                  </p>
                </div>

                <div className="text-[11px] text-muted-foreground">
                  Sedan, SUV, Truck & Add-ons configured.
                </div>
              </div>

              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full text-xs font-bold rounded-xl border-border/80 hover:bg-surface gap-1.5 text-foreground"
                  onClick={() => onSelectTab("pricing")}
                >
                  <Sliders className="size-3.5 text-amber-500" />
                  <span>Customize My Rates</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Helpful Quick-Action Bottom Bar: Test Quote & Sharing Tips */}
        {!collapsed && (
          <div className="mt-4 pt-4 border-t border-border/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-muted/20 -mx-6 -mb-6 p-4 sm:px-6 rounded-b-3xl">
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Share2 className="size-3.5 text-primary" />
                Where to share your link:
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-background/80 border border-border/60 text-[11px] font-medium text-foreground">
                Instagram Bio
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-background/80 border border-border/60 text-[11px] font-medium text-foreground">
                Google Business
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-background/80 border border-border/60 text-[11px] font-medium text-foreground">
                SMS to Clients
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-background/80 border border-border/60 text-[11px] font-medium text-foreground">
                Facebook / TikTok
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl px-3 text-xs font-bold border-border/80 bg-background/60 hover:bg-background gap-1.5 text-foreground"
                disabled={creatingTestQuote}
                onClick={handleCreateTestQuote}
                title="Create a sample customer lead to test your dashboard"
              >
                {creatingTestQuote ? (
                  <Loader2 className="size-3.5 animate-spin mr-1 text-primary" />
                ) : (
                  <FlaskConical className="size-3.5 text-amber-500" />
                )}
                <span>{creatingTestQuote ? "Creating..." : "Try Sample Test Lead"}</span>
              </Button>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground gap-1"
              >
                <a href={`/${profile.slug}?test=true`} target="_blank" rel="noreferrer">
                  <span>Open Sandbox</span>
                  <ArrowRight className="size-3" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>

      <TelegramConnectModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        profile={profile}
      />
    </>
  );
}
