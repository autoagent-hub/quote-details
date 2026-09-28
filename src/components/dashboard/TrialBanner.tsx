import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTrialState } from "@/lib/billing.functions";

export function TrialBanner() {
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem("detailr_dismissed_pending_trial_banner") === "true";
    } catch {
      return false;
    }
  });

  const fetchTrial = useServerFn(getTrialState);
  const { data: trial, isLoading } = useQuery({
    queryKey: ["trial-state"],
    queryFn: async () => fetchTrial(),
  });

  if (isLoading || !trial) return null;
  const { status, daysLeft, firstVisitAt, isSuspended, suspensionReason } = trial;

  if (isSuspended) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-sm px-5 py-3 text-xs text-rose-950 dark:text-rose-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-8 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
            <CreditCard className="size-4 shrink-0" />
          </div>
          <div className="space-y-0.5">
            <p className="font-bold uppercase tracking-widest text-[10px] text-rose-600 opacity-80">
              Account Suspended
            </p>
            <p className="font-medium">
              {suspensionReason ||
                "Your account has been restricted by administration. Contact support@detailr.online."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "ACTIVE") return null;

  if (status === "TRIAL_PENDING") {
    if (isDismissed) return null;

    return (
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-primary/10 p-4 sm:p-5 text-xs shadow-md backdrop-blur-md transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="size-9 flex items-center justify-center rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 shrink-0 mt-0.5">
              <Sparkles className="size-4 animate-pulse" />
            </div>
            <div className="space-y-1 pr-6 md:pr-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold uppercase tracking-widest text-[10px] text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
                  7-Day Free Trial Guarantee · 0 / 7 Days Used
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Your 7-Day Free Trial Starts Only After Your First Customer Visit
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                Before subscribing, your 7-day free trial stays completely paused and only begins
                counting down after your very first customer visits your quote link or submits a
                quote. Take all the time you need to set up your services and pricing with zero
                wasted trial days!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-center pt-2 md:pt-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsDismissed(true);
                try {
                  localStorage.setItem("detailr_dismissed_pending_trial_banner", "true");
                } catch {
                  // ignore localStorage errors
                }
              }}
              className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Dismiss banner"
            >
              <X className="size-4" />
              <span className="sr-only">Dismiss banner</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "TRIALING") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm px-5 py-3 text-xs text-amber-950 dark:text-amber-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-8 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Sparkles className="size-4 shrink-0" />
          </div>
          <div className="space-y-0.5">
            <p className="font-bold uppercase tracking-widest text-[10px] text-amber-600 opacity-80">
              Free Trial Active
            </p>
            <p className="font-medium">
              You have{" "}
              <strong className="font-bold">
                {daysLeft} {daysLeft === 1 ? "day" : "days"}
              </strong>{" "}
              remaining in your premium trial.
              {firstVisitAt && (
                <span className="opacity-60 ml-1.5 font-normal">· Triggered by first visitor</span>
              )}
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="hero"
          size="sm"
          className="h-8 text-[11px] font-bold px-4 rounded-xl shadow-lg shadow-amber-500/10"
        >
          <Link to="/upgrade">Upgrade to Pro</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-sm px-5 py-3 text-xs text-rose-950 dark:text-rose-200 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="size-8 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
          <CreditCard className="size-4 shrink-0" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold uppercase tracking-widest text-[10px] text-rose-600 opacity-80">
            Trial Expired
          </p>
          <p className="font-medium">
            Your free trial has ended. Upgrade now to keep receiving customer quote requests and
            Telegram alerts.
          </p>
        </div>
      </div>
      <Button
        asChild
        variant="hero"
        size="sm"
        className="h-8 text-[11px] font-bold px-4 rounded-xl shadow-lg shadow-rose-500/10"
      >
        <Link to="/upgrade">Activate Pro</Link>
      </Button>
    </div>
  );
}
