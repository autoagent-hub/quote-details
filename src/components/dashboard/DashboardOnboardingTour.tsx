import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  ReceiptText,
  Sliders,
  Send,
  Store,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  HelpCircle,
  Play,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface TourStep {
  id: string;
  targetSelector: string;
  tabKey?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badgeText: string;
  badgeColor?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    targetSelector: '[data-tour="welcome-hero"]',
    title: "Account Overview & Pipeline 🚗",
    description:
      "Monitor your total quote revenue with the privacy toggle, track lead conversion metrics, and see live shop status at a glance.",
    icon: <Sparkles className="size-5 text-primary" />,
    badgeText: "Step 1 of 4 · Overview",
  },
  {
    id: "share",
    targetSelector: '[data-tour="share-actions"]',
    title: "Share & Acquire Leads 🔗",
    description:
      "1-tap copy your customized quote calculator link to put in your Instagram bio, TikTok, or send directly to car owners.",
    icon: <Globe className="size-5 text-primary" />,
    badgeText: "Step 2 of 4 · Acquisition",
  },
  {
    id: "operations",
    targetSelector: '[data-tour="shop-actions"]',
    title: "Shop Operations & Alerts ⚙️",
    description:
      "Adjust vehicle pricing rates, connect your instant Telegram push alerts, and manage your branding in one place.",
    icon: <Sliders className="size-5 text-primary" />,
    badgeText: "Step 3 of 4 · Operations",
  },
  {
    id: "leads",
    targetSelector: '[data-tour="recent-leads"]',
    title: "Live Customer Leads Feed 📋",
    description:
      "Customer quote inquiries appear here with vehicle details, estimated totals, and 1-tap call and text shortcuts.",
    icon: <ReceiptText className="size-5 text-primary" />,
    badgeText: "Step 4 of 4 · Leads Stream",
  },
];

interface DashboardOnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

export function DashboardOnboardingTour({
  isOpen,
  onClose,
  onSelectTab,
}: DashboardOnboardingTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Auto switch dashboard tab if step defines tabKey
  useEffect(() => {
    if (!isOpen || !step) return;
    if (step.tabKey && onSelectTab) {
      onSelectTab(step.tabKey);
    }
  }, [isOpen, currentStepIndex, step, onSelectTab]);

  // Update highlighted target position
  const updateTargetRect = useCallback(() => {
    if (!isOpen || !step) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) return;
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    const timer = setTimeout(updateTargetRect, 100);

    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
      clearTimeout(timer);
    };
  }, [isOpen, currentStepIndex, updateTargetRect]);

  if (!isOpen || !step) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem("detailr_dashboard_tour_completed", "true");
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Darkened backdrop overlay with spotlight highlight cutout effect */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in-50"
        onClick={handleComplete}
      />

      {/* Target Element Highlight Spotlight Ring if found */}
      {targetRect && (
        <div
          className="fixed pointer-events-none z-50 rounded-2xl border-2 border-primary ring-8 ring-primary/20 shadow-2xl transition-all duration-300 ease-out"
          style={{
            top: `${Math.max(8, targetRect.top - 6)}px`,
            left: `${Math.max(8, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        />
      )}

      {/* Main Tooltip Popover Card */}
      <div className="relative z-50 w-full max-w-lg overflow-hidden rounded-3xl border border-primary/30 bg-card/95 p-6 shadow-2xl shadow-primary/20 backdrop-blur-xl animate-in zoom-in-95 duration-200 space-y-5">
        {/* Step Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-xs">
              {step.icon}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                {step.badgeText}
              </span>
              <h3 className="text-lg font-bold text-foreground font-display mt-1">{step.title}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleComplete}
            className="size-8 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
            title="Close tour"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Step Description */}
        <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {step.description}
        </div>

        {/* Step Indicator Dots & Navigation Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-3">
          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
                title={s.title}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-9 px-3 text-xs font-bold rounded-xl border-border/60 gap-1"
              >
                <ChevronLeft className="size-4" />
                <span>Back</span>
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              className="h-9 px-4 text-xs font-bold rounded-xl bg-primary text-white shadow-md shadow-primary/20 hover:shadow-lg gap-1.5"
            >
              <span>{isLast ? "Got it! Finish Tour" : "Next Step"}</span>
              {isLast ? <CheckCircle2 className="size-4" /> : <ChevronRight className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useDashboardTour() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const completed = localStorage.getItem("detailr_dashboard_tour_completed");
      if (!completed) {
        // Auto start tour for first-time user after 1s delay
        const timer = setTimeout(() => setIsOpen(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  const startTour = () => setIsOpen(true);
  const closeTour = () => setIsOpen(false);

  return { isOpen, startTour, closeTour };
}
