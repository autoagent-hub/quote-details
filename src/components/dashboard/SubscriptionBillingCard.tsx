import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  RefreshCw,
  Sparkles,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ArrowUpRight,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getTrialState, cancelUserSubscription } from "@/lib/billing.functions";

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
  const doCancelSubscription = useServerFn(cancelUserSubscription);

  const [copiedId, setCopiedId] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

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
      toast.success("Billing status re-synchronized with server.");
    } catch {
      toast.error("Failed to re-sync billing status.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyMembershipId = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(true);
    toast.success("Membership ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await doCancelSubscription();
      toast.success(res.message);
      setCancelModalOpen(false);
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["upgrade-account"] }),
      ]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel subscription.");
    } finally {
      setIsCancelling(false);
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

  const isSubscribed = !!trial?.isSubscribed;
  const isCancelled = !!trial?.isCancelled;
  const isPendingFirstVisit = !!trial?.isPendingFirstVisit;

  const isYearly = trial?.renewalDaysLeft !== undefined && trial.renewalDaysLeft > 60;

  const planName = isSubscribed
    ? isYearly
      ? "Detailr Pro Annual Pass ($110.99/yr)"
      : "Detailr Pro Monthly ($9.99/mo)"
    : isCancelled
      ? "Detailr Pro (Cancelled)"
      : isPendingFirstVisit
        ? "7-Day Free Trial (Pending First Visit)"
        : "7-Day Free Trial";

  const nextBillingFormatted =
    trial?.nextBillingDateFormatted ||
    (trial?.expiresAt
      ? new Date(trial.expiresAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null);

  const daysRemaining = isSubscribed ? trial?.renewalDaysLeft : trial?.daysLeft;

  const startDateFormatted = trial?.subscriptionStartedAt
    ? new Date(trial.subscriptionStartedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <>
      <Card
        className={`rounded-2xl border-2 transition-all shadow-xl bg-card overflow-hidden ${
          isSubscribed
            ? "border-emerald-500/40 dark:border-emerald-500/30 shadow-emerald-500/5"
            : isCancelled
              ? "border-amber-500/40 dark:border-amber-500/30 shadow-amber-500/5"
              : "border-primary/40 shadow-primary/5"
        } ${className}`}
      >
        {/* Top Accent Header Bar */}
        <div
          className={`h-1.5 w-full ${
            isSubscribed
              ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"
              : isCancelled
                ? "bg-gradient-to-r from-amber-500 to-rose-500"
                : "bg-gradient-to-r from-primary via-indigo-500 to-sky-400"
          }`}
        />

        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <CreditCard className="size-5 text-primary" />
                  Subscription & Billing
                </CardTitle>
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 px-2 py-0.5 rounded-full"
                >
                  <ShieldCheck className="size-3" />
                  Verified Server Sync
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Cryptographically synchronized with Whop Payment Network
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Main Status Badge */}
              {isSubscribed ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 px-3 py-1 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1.5 rounded-full shadow-sm">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <CheckCircle2 className="size-3.5" />
                  Active Pro Member
                </Badge>
              ) : isCancelled ? (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 px-3 py-1 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1.5 rounded-full">
                  <AlertCircle className="size-3.5" />
                  Cancelled (Active)
                </Badge>
              ) : isPendingFirstVisit ? (
                <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 px-3 py-1 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1.5 rounded-full">
                  <Clock className="size-3.5" />
                  Trial Pending
                </Badge>
              ) : (
                <Badge className="bg-primary/15 text-primary border-primary/30 px-3 py-1 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1.5 rounded-full">
                  <Sparkles className="size-3.5" />
                  Free Trial
                </Badge>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={handleRefresh}
                disabled={isRefreshing || isRefetching}
                title="Re-sync subscription state with database"
              >
                <RefreshCw
                  className={`size-3.5 ${isRefreshing || isRefetching ? "animate-spin text-primary" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Plan Highlight Banner */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isSubscribed
                ? "bg-emerald-500/5 border-emerald-500/20"
                : isCancelled
                  ? "bg-amber-500/5 border-amber-500/20"
                  : "bg-primary/5 border-primary/20"
            }`}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap className="size-3.5 text-amber-500" /> Current Active Plan
              </span>
              <h4 className="text-base sm:text-lg font-extrabold text-foreground">{planName}</h4>
              <p className="text-xs text-muted-foreground">
                {isSubscribed
                  ? "Unlimited quote requests, real-time Telegram alerts & vehicle pricing engine."
                  : isCancelled
                    ? "Your access remains fully functional until the end of your billing cycle."
                    : "Trial access active. Upgrade anytime to guarantee uninterrupted delivery."}
              </p>
            </div>

            {!isSubscribed && showActions && (
              <Button
                asChild
                variant="hero"
                size="sm"
                className="font-bold text-xs shrink-0 shadow-md"
              >
                <Link to="/upgrade">
                  <span>{isCancelled ? "Reactivate Pro" : "Upgrade to Pro"}</span>
                  <ChevronRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Next Billing / Renewal Date */}
            <div className="p-3.5 rounded-xl bg-surface border border-border/60 space-y-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Calendar className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                {isSubscribed ? "Next Renewal Date:" : "Trial Expiry Date:"}
              </span>
              <p className="font-bold text-foreground text-sm flex items-center justify-between gap-1">
                <span>{nextBillingFormatted || "Active"}</span>
                {daysRemaining !== undefined && daysRemaining > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                  </span>
                )}
              </p>
            </div>

            {/* Subscription Started Date */}
            {startDateFormatted && (
              <div className="p-3.5 rounded-xl bg-surface border border-border/60 space-y-1">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  Subscription Started:
                </span>
                <p className="font-bold text-foreground text-sm">{startDateFormatted}</p>
              </div>
            )}

            {/* Linked Email */}
            {trial?.whopCustomerEmail && (
              <div className="p-3.5 rounded-xl bg-surface border border-border/60 space-y-1">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-sky-500" />
                  Whop Checkout Email:
                </span>
                <p className="font-mono font-bold text-foreground truncate text-xs">
                  {trial.whopCustomerEmail}
                </p>
              </div>
            )}

            {/* Membership ID Reference */}
            {trial?.whopMembershipId && (
              <div className="p-3.5 rounded-xl bg-surface border border-border/60 space-y-1 sm:col-span-2 lg:col-span-1">
                <span className="text-muted-foreground font-medium flex items-center justify-between gap-1">
                  <span>Membership Ref ID:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyMembershipId(trial.whopMembershipId!)}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  >
                    {copiedId ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    {copiedId ? "Copied" : "Copy"}
                  </button>
                </span>
                <p className="font-mono font-bold text-foreground truncate text-xs">
                  {trial.whopMembershipId}
                </p>
              </div>
            )}
          </div>

          {/* Action Links */}
          {showActions && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60">
              <div className="flex items-center gap-2">
                <a
                  href={trial?.whopPortalUrl || "https://whop.com/hub/memberships/"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline py-1"
                >
                  <span>Open Whop Customer Portal</span>
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                {isSubscribed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30"
                    onClick={() => setCancelModalOpen(true)}
                  >
                    Cancel Plan
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isRefetching}
                >
                  <RefreshCw
                    className={`size-3 mr-1.5 ${isRefreshing || isRefetching ? "animate-spin" : ""}`}
                  />
                  Sync Billing
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Confirmation Dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
              <AlertCircle className="size-5" />
              Cancel Detailr Pro Subscription?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to cancel your subscription? Your quote requests and public link
              will remain active until the end of your paid billing cycle (
              {nextBillingFormatted || "current period"}).
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
              disabled={isCancelling}
              className="w-full sm:w-auto font-bold text-xs"
            >
              Keep My Subscription
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="w-full sm:w-auto font-bold text-xs"
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
