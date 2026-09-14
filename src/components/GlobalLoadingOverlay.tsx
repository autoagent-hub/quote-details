import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GlobalLoadingOverlayProps {
  isLoading: boolean;
  title?: string;
  subtitle?: string;
  iconUrl?: string;
  steps?: string[];
  className?: string;
}

export function GlobalLoadingOverlay({
  isLoading,
  title = "Processing Quote",
  subtitle = "Calculating vehicle modifiers & preparing instant estimate...",
  iconUrl = "/favicon.png",
  steps = [
    "Analyzing vehicle classification...",
    "Applying package pricing & add-ons...",
    "Sending real-time notification...",
  ],
  className,
}: GlobalLoadingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isLoading, steps.length]);

  if (!isLoading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md transition-all animate-in fade-in duration-200 px-4",
        className,
      )}
    >
      <div className="relative flex flex-col items-center max-w-sm w-full rounded-2xl border border-border/80 bg-card p-6 shadow-2xl text-center space-y-4">
        {/* Animated Icon Glow & Pulse Container */}
        <div className="relative flex items-center justify-center">
          {/* Ambient pulse glow */}
          <div className="absolute size-20 rounded-full bg-primary/20 blur-xl animate-pulse" />

          {/* Rotating halo ring */}
          <div className="absolute size-18 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />

          {/* Center Logo Card */}
          <div className="relative size-14 rounded-xl border border-border bg-background p-1.5 shadow-md flex items-center justify-center animate-bounce duration-1000">
            <img
              src={iconUrl}
              alt="Loading"
              className="size-10 rounded-lg object-contain"
              loading="eager"
            />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>

        {/* Animated Progress Step Indicator */}
        <div className="w-full space-y-2 pt-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span className="transition-all duration-300 min-h-[18px]">{steps[stepIndex]}</span>
          </div>

          {/* Subtle Progress Bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 rounded-full bg-primary animate-[shimmer_1.5s_infinite_linear] bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
