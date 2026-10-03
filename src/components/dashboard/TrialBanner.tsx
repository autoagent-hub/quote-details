import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CreditCard,
  Sparkles,
  X,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTrialState } from "@/lib/billing.functions";

export function TrialBanner({
  profile,
}: {
  profile?: { trial_status?: string | null; trial_expiry?: string | null };
} = {}) {
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

  const isSubscribed =
    profile?.trial_status === "SUBSCRIBED" ||
    profile?.trial_status === "ADMIN" ||
    !!trial?.isSubscribed;

  const isCancelled = profile?.trial_status === "CANCELLED" || !!trial?.isCancelled;

  const isSuspended =
    profile?.trial_status === "SUSPENDED" ||
    profile?.trial_status === "BANNED" ||
    !!trial?.isSuspended;

  const effectiveStatus = isSuspended
    ? "SUSPENDED"
    : isSubscribed
      ? "ACTIVE"
      : isCancelled
        ? "CANCELLED"
        : trial?.status ||
          (profile?.trial_status === "TRIAL_PENDING" ? "TRIAL_PENDING" : "TRIALING");

  const effectiveNextBillingDate =
    trial?.nextBillingDateFormatted ||
    (profile?.trial_expiry
      ? new Date(profile.trial_expiry).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null);

  const effectiveRenewalDays =
    trial?.renewalDaysLeft ??
    (profile?.trial_expiry
      ? Math.max(
          0,
          Math.ceil(
            (new Date(profile.trial_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          ),
        )
      : undefined);

  if (isLoading) return null;

  const daysLeft = trial?.daysLeft ?? 7;
  const firstVisitAt = trial?.firstVisitAt ?? null;
  const suspensionReason = trial?.suspensionReason;

  // 1. Account Suspended
  if (effectiveStatus === "SUSPENDED") {
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

  // 2. SUBSCRIBED: Show PRO BADGE and Next Billing Date on Dashboard
  if (effectiveStatus === "ACTIVE" || isSubscribed) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 p-4 sm:p-5 text-xs shadow-md backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="size-10 flex items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
              <Sparkles className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black font-extrabold uppercase tracking-widest text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  PRO MEMBER
                </Badge>
                {effectiveNextBillingDate && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                    <Calendar className="size-3 opacity-80" />
                    Next billing date: <strong>{effectiveNextBillingDate}</strong>
                  </span>
                )}
                {effectiveRenewalDays !== undefined && effectiveRenewalDays > 0 && (
                  <span className="text-[11px] text-muted-foreground font-medium">
                    ({effectiveRenewalDays} {effectiveRenewalDays === 1 ? "day" : "days"} remaining
                    in cycle)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Your Detailr Pro membership is active. You have unlimited customer quotes, custom
                rates, and real-time Telegram alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 rounded-xl font-bold text-xs border-emerald-500/30 bg-background/80 text-emerald-600 hover:bg-emerald-500/10 shadow-sm"
            >
              <Link to="/upgrade">Manage Plan & Billing</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Subscription Cancelled
  if (isCancelled || effectiveStatus === "CANCELLED") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm px-5 py-3.5 text-xs text-amber-950 dark:text-amber-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-8 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <AlertTriangle className="size-4 shrink-0" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-widest text-[10px] text-amber-600 opacity-90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                Subscription Cancelled
              </span>
              {effectiveNextBillingDate && (
                <span className="text-[11px] font-semibold">
                  Access active until: <strong>{effectiveNextBillingDate}</strong>
                </span>
              )}
            </div>
            <p className="font-medium text-muted-foreground">
              Your subscription will not renew. You retain full access through the end of your
              prepaid period.
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="hero"
          size="sm"
          className="h-8 text-[11px] font-bold px-4 rounded-xl shadow-sm shrink-0"
        >
          <Link to="/upgrade">Re-subscribe to Pro</Link>
        </Button>
      </div>
    );
  }

  // 4. Trial Pending First Customer Visit
  if (effectiveStatus === "TRIAL_PENDING") {
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

  // 5. Active Trial Countdown
  if (effectiveStatus === "TRIALING") {
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

  // 6. Trial Expired
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
