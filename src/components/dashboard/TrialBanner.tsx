import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTrialState } from "@/lib/billing.functions";

export function TrialBanner() {
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
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-sky-500/30 bg-sky-500/5 backdrop-blur-sm px-5 py-3 text-xs text-sky-950 dark:text-sky-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-8 flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
            <Sparkles className="size-4 shrink-0" />
          </div>
          <div className="space-y-0.5">
            <p className="font-bold uppercase tracking-widest text-[10px] text-sky-600 opacity-80">
              Trial Status: Ready
            </p>
            <p className="font-medium max-w-lg leading-tight">
              Your 7-day free trial will begin automatically after your first customer visits your
              quote link. Zero wasted days during setup!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="rounded-full bg-sky-600/10 border border-sky-600/20 px-3 py-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
            0 / 7 Days Used
          </span>
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
