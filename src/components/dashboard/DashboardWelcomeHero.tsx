import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  ExternalLink,
  FlaskConical,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Send,
  Globe,
  Smartphone,
  Store,
  Tag,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  X,
  Bell,
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    duration: 25,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [creatingTestQuote, setCreatingTestQuote] = useState(false);

  // Hideable state persisted in localStorage
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("detailr_hide_setup_card") === "true";
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem("detailr_hide_setup_card", "true");
    } catch {
      // ignore
    }
    toast.info("Setup guide hidden", {
      description: "You can reopen it anytime using the Show Setup Guide button.",
    });
  };

  const handleRestore = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem("detailr_hide_setup_card");
    } catch {
      // ignore
    }
  };

  const liveUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${profile.slug}`
      : `https://detailr.online/${profile.slug}`;

  const hasTelegram = !!profile.telegram_chat_id;
  const hasProfile = Boolean(profile.business_name && profile.phone);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setProgress(0);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-swiping timer (swipes by itself every 5 seconds)
  useEffect(() => {
    if (!emblaApi || isPaused || isHovered || isDismissed) return;

    const intervalMs = 50;
    const totalDuration = 5000;
    const step = (intervalMs / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          emblaApi.scrollNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [emblaApi, isPaused, isHovered, isDismissed]);

  const copyLink = () => {
    void navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    toast.success("Quote link copied! Ready to share with clients.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateTestQuote = async () => {
    setCreatingTestQuote(true);
    try {
      const { error } = await supabase.from("quotes").insert({
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
      });

      if (error) throw error;

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

  const stepsMeta = [
    {
      id: "profile",
      num: 1,
      title: "Profile Setup",
      completed: hasProfile,
    },
    {
      id: "pricing",
      num: 2,
      title: "Review Prices & Packages",
      completed: true,
    },
    {
      id: "telegram",
      num: 3,
      title: "Connect Phone Alerts (Telegram)",
      completed: hasTelegram,
    },
    {
      id: "link",
      num: 4,
      title: "Your Quote Link is Live",
      completed: true,
    },
  ];

  // If dismissed, render a clean restore bar
  if (isDismissed) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-4 sm:px-5 py-2.5 rounded-2xl border border-primary/20 bg-card/70 backdrop-blur-md text-xs text-muted-foreground shadow-sm">
        <div className="flex items-center gap-2.5 font-medium">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          <span>Setup Guide (4 Steps) is hidden</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestore}
          className="h-7 px-3 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-xl gap-1.5"
        >
          <RotateCcw className="size-3.5" />
          <span>Show Setup Guide</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div
        className="w-full max-w-4xl mx-auto space-y-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display flex items-center gap-2">
              <span>Welcome back, {profile.business_name || "Detailer"}</span>
              <span className="text-base font-normal text-muted-foreground">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Complete these 4 quick steps to launch your automated quote calculator and capture
              leads.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded-full shadow-xs">
              Step {selectedIndex + 1} of 4: {stepsMeta[selectedIndex].title}
            </span>
          </div>
        </div>

        {/* Outer Glow Wrapper: Rich Animated Ambient Glow */}
        <div className="relative group w-full">
          {/* Animated Glow Halo */}
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-primary/30 via-emerald-500/25 to-primary/30 opacity-75 blur-xl group-hover:opacity-100 transition duration-1000 animate-pulse pointer-events-none" />

          {/* Main Fitted Card */}
          <div className="relative w-full rounded-[1.75rem] border border-primary/30 bg-card/95 backdrop-blur-xl shadow-xl shadow-primary/10 overflow-hidden flex flex-col justify-between">
            {/* Auto-advance progress indicator bar across top edge */}
            {!isPaused && !isHovered && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-muted/30 z-20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary transition-all duration-75 shadow-xs shadow-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Top Control Bar */}
            <div className="relative z-10 px-5 sm:px-6 pt-4 pb-3 flex items-center justify-between gap-3 border-b border-border/40 bg-background/50 backdrop-blur-md">
              {/* Step Counter Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary shadow-xs shadow-primary/10">
                  <Sparkles className="size-3.5" />
                  <span>Step {selectedIndex + 1} of 4</span>
                </span>

                <span className="hidden sm:inline text-xs font-bold text-foreground">
                  {stepsMeta[selectedIndex].title}
                </span>
              </div>

              {/* Center: Sleek Interactive Glowing Dots */}
              <div className="flex items-center gap-1.5">
                {stepsMeta.map((s, idx) => {
                  const isActive = selectedIndex === idx;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => emblaApi?.scrollTo(idx)}
                      className={`transition-all rounded-full h-2 ${
                        isActive
                          ? "w-6 bg-primary shadow-xs shadow-primary/50"
                          : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                      }`}
                      title={`Step ${s.num}: ${s.title}`}
                      aria-label={`Step ${s.num}: ${s.title}`}
                    />
                  );
                })}
              </div>

              {/* Right Controls: Auto-Swipe Play/Pause, Arrows & Close Button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-xl border border-border/50 bg-background/60 hover:bg-background transition-colors"
                  title={isPaused ? "Resume auto-swipe" : "Pause auto-swipe"}
                >
                  {isPaused ? (
                    <>
                      <Play className="size-3 text-primary fill-primary" />
                      <span>Paused</span>
                    </>
                  ) : (
                    <>
                      <Pause className="size-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Auto-swiping</span>
                    </>
                  )}
                </button>

                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-xl border-border/60 bg-background/60 hover:bg-background text-foreground"
                  onClick={() => emblaApi?.scrollPrev()}
                  title="Previous step"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-xl border-border/60 bg-background/60 hover:bg-background text-foreground"
                  onClick={() => emblaApi?.scrollNext()}
                  title="Next step"
                  aria-label="Next step"
                >
                  <ChevronRight className="size-4" />
                </Button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="size-8 rounded-xl border border-border/60 bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors ml-1"
                  title="Hide setup guide"
                  aria-label="Hide setup guide"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Embla Carousel Swiping Container: Snugly Fitted Widget Content */}
            <div className="relative z-10 overflow-hidden w-full flex-1 flex" ref={emblaRef}>
              <div className="flex w-full select-none cursor-grab active:cursor-grabbing">
                {/* ========================================================================= */}
                {/* STEP 1: Profile Setup */}
                {/* ========================================================================= */}
                <div className="flex-[0_0_100%] min-w-0 w-full overflow-hidden p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3.5 min-w-0 w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-2xl bg-purple-500/15 text-purple-600 flex items-center justify-center font-bold shrink-0 shadow-xs shadow-purple-500/20">
                        <Store className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-display">
                            1. Profile Setup
                          </h2>
                          {hasProfile ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                            >
                              ✓ Configured
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold border-amber-500/40 text-amber-700 bg-amber-500/10"
                            >
                              Action Needed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Personalize your shop identity, phone number, and quote URL slug.
                        </p>
                      </div>
                    </div>

                    {/* In-Flow Profile Preview Card */}
                    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/60 bg-muted/20 min-w-0 w-full">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="size-9 rounded-xl bg-primary/15 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                          {profile.business_name?.[0] || "D"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs sm:text-sm text-foreground truncate">
                            {profile.business_name || "Apex Auto Detailing"}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {profile.phone || "No phone added yet"} • detailr.online/{profile.slug}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-primary shrink-0 hidden sm:inline">
                        {hasProfile ? "✓ Ready" : "Setup Required"}
                      </span>
                    </div>
                  </div>

                  {/* Prominent Call to Action */}
                  <div className="pt-2 flex items-center justify-between gap-3 border-t border-border/40">
                    <Button
                      variant="default"
                      size="default"
                      className="h-10 px-5 rounded-xl text-xs font-bold gap-2 bg-gradient-to-r from-primary to-primary/90 text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                      onClick={() => onSelectTab("settings")}
                    >
                      <Store className="size-4" />
                      <span>Complete Shop Profile</span>
                      <ArrowRight className="size-4 ml-1" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5"
                      onClick={() => emblaApi?.scrollNext()}
                    >
                      <span>Next: Prices</span>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* STEP 2: Review Prices & Packages */}
                {/* ========================================================================= */}
                <div className="flex-[0_0_100%] min-w-0 w-full overflow-hidden p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3.5 min-w-0 w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold shrink-0 shadow-xs shadow-amber-500/20">
                        <Tag className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-display">
                            2. Review Prices & Packages
                          </h2>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                          >
                            ✓ Pre-Loaded Rates
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Standard detailing rates loaded for Sedan, SUV, and Truck with add-ons.
                        </p>
                      </div>
                    </div>

                    {/* Price Tiers Strip */}
                    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/60 bg-muted/20 min-w-0 w-full text-xs">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-bold text-foreground">Sedan $150</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-bold text-foreground">SUV $190</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-bold text-foreground">Truck $210</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 shrink-0 hidden sm:inline">
                        Instant Live Estimates
                      </span>
                    </div>
                  </div>

                  {/* Prominent Call to Action */}
                  <div className="pt-2 flex items-center justify-between gap-3 border-t border-border/40">
                    <Button
                      variant="default"
                      size="default"
                      className="h-10 px-5 rounded-xl text-xs font-bold gap-2 bg-gradient-to-r from-primary to-primary/90 text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                      onClick={() => onSelectTab("pricing")}
                    >
                      <Sliders className="size-4" />
                      <span>Review & Customize Rates</span>
                      <ArrowRight className="size-4 ml-1" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5"
                      onClick={() => emblaApi?.scrollNext()}
                    >
                      <span>Next: Phone Alerts</span>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* STEP 3: Connect Phone Alerts (Telegram) — Fixed Overflow & Fitted */}
                {/* ========================================================================= */}
                <div className="flex-[0_0_100%] min-w-0 w-full overflow-hidden p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3.5 min-w-0 w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`size-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                          hasTelegram
                            ? "bg-emerald-500/15 text-emerald-600 shadow-xs shadow-emerald-500/20"
                            : "bg-blue-500/15 text-blue-600 shadow-xs shadow-blue-500/20"
                        }`}
                      >
                        <Smartphone className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-display">
                            3. Connect Phone Alerts
                          </h2>
                          {hasTelegram ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 bg-emerald-500/10 flex items-center gap-1"
                            >
                              <CheckCircle2 className="size-3" /> Connected
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold border-blue-500/40 text-blue-700 bg-blue-500/10"
                            >
                              Takes 30 seconds
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Receive instant push notifications on your phone for every customer
                          inquiry.
                        </p>
                      </div>
                    </div>

                    {/* Alert Mockup Strip: Strictly Constrained with min-w-0 to Never Overflow */}
                    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/60 bg-muted/20 min-w-0 w-full overflow-hidden text-xs">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="size-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                          <Bell className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-foreground truncate">
                            {hasTelegram
                              ? "Phone Notifications Active"
                              : "Free Instant Telegram Alerts"}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {hasTelegram
                              ? "Ready to ping your phone with customer leads"
                              : "Includes client phone number, car type & requested service"}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`size-2.5 rounded-full shrink-0 ${
                          hasTelegram ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Prominent Call to Action */}
                  <div className="pt-2 flex items-center justify-between gap-3 border-t border-border/40">
                    <Button
                      variant="default"
                      size="default"
                      className="h-10 px-5 rounded-xl text-xs font-bold gap-2 bg-gradient-to-r from-primary to-primary/90 text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                      onClick={() => setConnectModalOpen(true)}
                    >
                      <Send className="size-4" />
                      <span>
                        {hasTelegram ? "Manage Telegram Alerts" : "Connect Free Telegram Bot"}
                      </span>
                      <ArrowRight className="size-4 ml-1" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5"
                      onClick={() => emblaApi?.scrollNext()}
                    >
                      <span>Next: Quote Link</span>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* STEP 4: Your Quote Link is Live */}
                {/* ========================================================================= */}
                <div className="flex-[0_0_100%] min-w-0 w-full overflow-hidden p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3.5 min-w-0 w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold shrink-0 shadow-xs shadow-emerald-500/20">
                        <Globe className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-display">
                            4. Your Quote Link is Live
                          </h2>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 bg-emerald-500/10 flex items-center gap-1"
                          >
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ready for Leads
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Your automated price calculator is live and ready to take customer
                          inquiries.
                        </p>
                      </div>
                    </div>

                    {/* Live Link Strip */}
                    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/60 bg-muted/20 min-w-0 w-full text-xs">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-mono font-bold text-primary truncate">
                          detailr.online/{profile.slug}
                        </span>
                      </div>

                      <a
                        href={`/${profile.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
                      >
                        <span>Preview</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>

                  {/* Prominent Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-border/40">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="default"
                        size="default"
                        className="h-10 px-5 rounded-xl text-xs font-bold gap-2 bg-gradient-to-r from-primary to-primary/90 text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                        onClick={copyLink}
                      >
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        <span>{copied ? "Copied!" : "Copy Quote Link"}</span>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-10 px-3.5 text-xs font-bold rounded-xl border-border/80 hover:bg-surface"
                        title="Preview public form"
                      >
                        <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-4 opacity-70 mr-1.5" />
                          <span>Open Form</span>
                        </a>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-3.5 rounded-xl text-xs font-bold border-border/80 bg-background/60 hover:bg-background gap-1.5 text-foreground"
                        disabled={creatingTestQuote}
                        onClick={handleCreateTestQuote}
                        title="Generate a sample lead to test the dashboard"
                      >
                        {creatingTestQuote ? (
                          <Loader2 className="size-4 animate-spin mr-1 text-primary" />
                        ) : (
                          <FlaskConical className="size-4 text-amber-500" />
                        )}
                        <span>{creatingTestQuote ? "Creating..." : "Try Sample Lead"}</span>
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5"
                      onClick={() => emblaApi?.scrollTo(0)}
                    >
                      <span>Back to Step 1</span>
                      <RotateCcw className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TelegramConnectModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        profile={profile}
      />
    </>
  );
}
