import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Coins,
  CheckCircle2,
  Calendar,
  CreditCard,
  RefreshCw,
  Sparkles,
  Clock,
  AlertCircle,
  ChevronRight,
  Zap,
  ShieldCheck,
  TrendingUp,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getTrialState } from "@/lib/billing.functions";

interface SubscriptionBillingCardProps {
  className?: string;
  showActions?: boolean;
}

export function SubscriptionBillingCard({
  className = "",
  showActions = true,
}: SubscriptionBillingCardProps) {
  const queryClient = useQueryClient();
  const fetchTrialState = useServerFn(getTrialState);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: trial,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["trial-state"],
    queryFn: () => fetchTrialState(),
    staleTime: 30000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["upgrade-account"] }),
      ]);
      toast.success("Credit balance and billing status re-synchronized.");
    } catch {
      toast.error("Failed to re-sync billing status.");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={`rounded-2xl border border-border/80 bg-card p-6 shadow-md ${className}`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </div>
      </Card>
    );
  }

  const creditsBalance = trial?.creditsBalance ?? 50;
  const isPendingFirstVisit = !!trial?.isPendingFirstVisit;
  const isTrialActive = trial?.status === "TRIALING";
  const daysRemaining = trial?.daysLeft ?? 7;
  const isOutOfCredits = creditsBalance === 0;
  const isLowCredits = creditsBalance > 0 && creditsBalance <= 10;

  const trialExpiryFormatted = trial?.expiresAt
    ? new Date(trial.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card
      className={`rounded-2xl border-2 transition-all shadow-xl bg-card overflow-hidden ${
        isOutOfCredits
          ? "border-rose-500/40 shadow-rose-500/5"
          : isLowCredits
            ? "border-amber-500/40 shadow-amber-500/5"
            : "border-emerald-500/30 shadow-emerald-500/5"
      } ${className}`}
    >
      {/* Top Accent Header Bar */}
      <div
        className={`h-1.5 w-full ${
          isOutOfCredits
            ? "bg-gradient-to-r from-rose-500 via-orange-500 to-rose-600"
            : isLowCredits
              ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"
              : "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"
        }`}
      />

      <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Coins className="size-5 text-emerald-500" />
              Credits & Billing Overview
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Pay-as-you-go lead alerts · Zero recurring subscriptions · 7-day free trial guarantee
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status Badges */}
            {isOutOfCredits ? (
              <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 px-3 py-1 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1.5 rounded-full shadow-sm">
                <AlertCircle className="size-3.5" />
                Credits Depleted
              </Badge>
            ) : isLowCredits ? (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 px-3 py-1 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1.5 rounded-full shadow-sm">
                <AlertCircle className="size-3.5" />
                Low Credits ({creditsBalance} left)
              </Badge>
            ) : isPendingFirstVisit ? (
              <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 px-3 py-1 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1.5 rounded-full shadow-sm">
                <Clock className="size-3.5" />
                Trial Paused · Pending 1st Visit
              </Badge>
            ) : isTrialActive ? (
              <Badge className="bg-primary/15 text-primary border-primary/30 px-3 py-1 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1.5 rounded-full shadow-sm">
                <Sparkles className="size-3.5" />
                Free Trial ({daysRemaining}d left)
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 px-3 py-1 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1.5 rounded-full shadow-sm">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <CheckCircle2 className="size-3.5" />
                Credits Active
              </Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={handleRefresh}
              disabled={isRefreshing || isRefetching}
              title="Re-sync credits balance with database"
            >
              <RefreshCw
                className={`size-3.5 ${isRefreshing || isRefetching ? "animate-spin text-primary" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Credit Balance Highlight Hero */}
        <div
          className={`rounded-2xl p-4 sm:p-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${
            isOutOfCredits
              ? "bg-rose-500/5 border-rose-500/25"
              : isLowCredits
                ? "bg-amber-500/5 border-amber-500/25"
                : "bg-emerald-500/5 border-emerald-500/25"
          }`}
        >
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="size-3.5 text-emerald-500" /> Current Available Balance
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                {creditsBalance}
              </h3>
              <span className="text-sm font-bold text-muted-foreground">Credits Available</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              1 credit is deducted per successful customer quote sent to your Telegram phone alert.
              Visits to your quote link, admin tests, and pricing calculations do not consume
              credits.
            </p>
          </div>

          {showActions && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <Button
                asChild
                variant="hero"
                size="default"
                className="font-bold text-xs shadow-md rounded-xl px-5 gap-1.5"
              >
                <Link to="/upgrade">
                  <Coins className="size-4" />
                  <span>Top Up Credits ($10 min)</span>
                  <ChevronRight className="size-3.5 ml-0.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Billing Model */}
          <div className="p-4 rounded-xl bg-surface border border-border/60 space-y-1.5">
            <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
              <CreditCard className="size-3.5 text-emerald-500" />
              Billing Structure:
            </span>
            <p className="font-bold text-foreground text-sm">Pay-As-You-Go</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              No monthly or annual recurring charges. Top up on demand. Purchased credits never
              expire.
            </p>
          </div>

          {/* 7-Day Trial Status */}
          <div className="p-4 rounded-xl bg-surface border border-border/60 space-y-1.5">
            <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              7-Day Trial Status:
            </span>
            <p className="font-bold text-foreground text-sm">
              {isPendingFirstVisit
                ? "Paused (0/7 Used)"
                : isTrialActive
                  ? `${daysRemaining} Days Left`
                  : trialExpiryFormatted
                    ? `Ended on ${trialExpiryFormatted}`
                    : "Included on Signup"}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isPendingFirstVisit
                ? "Activates strictly when your first real customer visits your shop link."
                : isTrialActive
                  ? "Full quote alerts and dashboard access active during your trial."
                  : "Covered by active credit balance."}
            </p>
          </div>

          {/* Pricing & Deductions */}
          <div className="p-4 rounded-xl bg-surface border border-border/60 space-y-1.5">
            <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-sky-500" />
              Lead Rate:
            </span>
            <p className="font-bold text-foreground text-sm">$10 for 50 Credits</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Equivalent to $0.20 per verified customer quote alert. 0% booking commission taken.
            </p>
          </div>
        </div>

        {/* Bottom Actions & Policy Guarantee */}
        {showActions && (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
              <span>Zero recurring pain: no unexpected auto-renewals or monthly contracts.</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold gap-1.5 rounded-xl border-border/70 hover:bg-muted/50"
              >
                <Link to="/upgrade">
                  <History className="size-3.5 text-muted-foreground" />
                  <span>Purchase History</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold rounded-xl"
                onClick={handleRefresh}
                disabled={isRefreshing || isRefetching}
              >
                <RefreshCw
                  className={`size-3 mr-1.5 ${isRefreshing || isRefetching ? "animate-spin" : ""}`}
                />
                Sync Balance
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
