import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Check,
  ArrowRight,
  Calendar,
  CreditCard,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUpgradeCheckout, type TrialStateResponse } from "@/lib/billing.functions";

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trial: TrialStateResponse | undefined;
}

const MONTHLY_PRICE = 12.99;
const ANNUAL_PRICE = 145.0;

export function ChangePlanDialog({ open, onOpenChange, trial }: ChangePlanDialogProps) {
  const fetchCheckout = useServerFn(getUpgradeCheckout);

  const { data: checkout, isLoading: isCheckoutLoading } = useQuery({
    queryKey: ["upgrade-checkout"],
    queryFn: () => fetchCheckout(),
    enabled: open,
    staleTime: 60000,
  });

  const isCurrentYearly = trial?.planType === "yearly";
  const [selectedTarget, setSelectedTarget] = useState<"monthly" | "yearly">(
    isCurrentYearly ? "monthly" : "yearly",
  );

  // Sync selected target when opening
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelectedTarget(isCurrentYearly ? "monthly" : "yearly");
    }
    onOpenChange(nextOpen);
  };

  // Calculations for proration
  const daysRemaining = Math.max(0, trial?.renewalDaysLeft ?? trial?.daysLeft ?? 0);
  const currentCycleDays = isCurrentYearly ? 365 : 30;
  const currentPlanCost = isCurrentYearly ? ANNUAL_PRICE : MONTHLY_PRICE;
  const dailyRate = currentPlanCost / currentCycleDays;

  // Unused credit on current cycle
  const unusedCredit = Math.min(
    currentPlanCost,
    Number((dailyRate * Math.min(daysRemaining, currentCycleDays)).toFixed(2)),
  );

  const isUpgradingToAnnual = !isCurrentYearly && selectedTarget === "yearly";
  const isDowngradingToMonthly = isCurrentYearly && selectedTarget === "monthly";
  const isSamePlan =
    (isCurrentYearly && selectedTarget === "yearly") ||
    (!isCurrentYearly && selectedTarget === "monthly");

  // Prorated amount due today for upgrade
  const proratedDueToday = Math.max(0, Number((ANNUAL_PRICE - unusedCredit).toFixed(2)));

  const renewalDateFormatted = trial?.nextBillingDateFormatted || "end of billing cycle";

  const handleProceed = () => {
    if (!checkout) return;

    if (selectedTarget === "yearly") {
      window.location.href = checkout.yearlyHref;
    } else {
      window.location.href = checkout.monthlyHref;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-3xl border border-border shadow-2xl bg-card">
        {/* Header Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-500 to-amber-500" />

        <div className="p-6 sm:p-8 space-y-6">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Zap className="size-4" />
              </div>
              <DialogTitle className="text-xl font-black tracking-tight text-foreground">
                Change Subscription Plan
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Switch between month-to-month flexibility and the discounted Annual Pass. Proration
              credits are calculated dynamically based on your unused days.
            </DialogDescription>
          </DialogHeader>

          {/* Current Plan Summary Card */}
          <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" /> Current Active Plan
              </span>
              <p className="font-extrabold text-foreground text-sm">
                {isCurrentYearly
                  ? `Detailr Pro Annual Pass ($${ANNUAL_PRICE}/yr)`
                  : `Detailr Pro Monthly ($${MONTHLY_PRICE}/mo)`}
              </p>
              <p className="text-muted-foreground text-[11px]">
                {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining in current cycle ·
                Renews {renewalDateFormatted}
              </p>
            </div>

            <Badge
              variant="outline"
              className="self-start sm:self-center font-mono font-bold text-[11px] bg-background border-border/80 px-2.5 py-1"
            >
              Unused Credit: ${unusedCredit.toFixed(2)}
            </Badge>
          </div>

          {/* Plan Selection Cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Select Your Target Plan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monthly Option */}
              <div
                onClick={() => setSelectedTarget("monthly")}
                className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedTarget === "monthly"
                    ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                    : "border-border/60 hover:border-border hover:bg-muted/20"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Monthly Plan</span>
                    {selectedTarget === "monthly" && (
                      <span className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-3xl font-black text-foreground">
                      ${MONTHLY_PRICE.toFixed(2)}
                    </span>
                    <span className="text-xs font-sans text-muted-foreground">/ month</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Month-to-month billing. Cancel anytime with one click.
                  </p>
                </div>

                {!isCurrentYearly && (
                  <span className="mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    • Your Current Plan
                  </span>
                )}
              </div>

              {/* Annual Option */}
              <div
                onClick={() => setSelectedTarget("yearly")}
                className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedTarget === "yearly"
                    ? "border-amber-500 bg-amber-500/5 shadow-lg ring-1 ring-amber-500/20"
                    : "border-border/60 hover:border-border hover:bg-muted/20"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">Annual Pass</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-extrabold">
                        Save ~$11/yr
                      </span>
                    </div>
                    {selectedTarget === "yearly" && (
                      <span className="size-4 rounded-full bg-amber-500 text-black flex items-center justify-center">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-3xl font-black text-foreground">
                      ${ANNUAL_PRICE.toFixed(0)}
                    </span>
                    <span className="text-xs font-sans text-muted-foreground">/ year</span>
                    <span className="text-[10px] font-sans font-bold text-emerald-600 dark:text-emerald-400 ml-auto">
                      ~$12/mo eq.
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Full 12-month access. Locked-in price guarantee.
                  </p>
                </div>

                {isCurrentYearly && (
                  <span className="mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    • Your Current Plan
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Proration Breakdown Card */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-primary/10 pb-2.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Dynamic Proration Summary
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Standard SaaS Math
              </span>
            </div>

            {isUpgradingToAnnual && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>New Annual Pass Rate (365 days):</span>
                  <span className="font-mono text-foreground font-semibold">
                    ${ANNUAL_PRICE.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="size-3" /> Unused Monthly Time ({daysRemaining} days @
                    ${dailyRate.toFixed(2)}/day):
                  </span>
                  <span className="font-mono font-bold">-${unusedCredit.toFixed(2)} credit</span>
                </div>
                <div className="pt-2 border-t border-primary/10 flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-foreground text-sm block">
                      Net Estimated Charge Today:
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Applied via Whop Checkout with 12 months added immediately
                    </span>
                  </div>
                  <span className="text-xl font-black font-mono text-primary">
                    ${proratedDueToday.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {isDowngradingToMonthly && (
              <div className="space-y-2 text-xs">
                <p className="text-foreground leading-relaxed">
                  <strong>Standard Proration Policy:</strong> Because your Annual Pass was prepaid
                  in full, switching to Monthly takes effect at the end of your prepaid period (
                  <strong>{renewalDateFormatted}</strong>).
                </p>
                <div className="rounded-xl bg-background/60 p-3 border border-border/60 space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Active Annual Pass Access Until:</span>
                    <span className="font-bold text-foreground">{renewalDateFormatted}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>First Monthly Charge on {renewalDateFormatted}:</span>
                    <span className="font-bold font-mono text-foreground">
                      ${MONTHLY_PRICE.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  You retain full Pro access and 0% commission fees with no interruption.
                </p>
              </div>
            )}

            {isSamePlan && (
              <p className="text-xs text-muted-foreground">
                You are currently subscribed to this plan. Select the other plan above to calculate
                proration and switch billing frequency.
              </p>
            )}
          </div>

          {/* Security & Reliability Footer Note */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
            <span>
              <strong>Zero-Downtime Guarantee:</strong> Your public quote link, vehicle pricing, and
              real-time Telegram alerts remain active without interruption during plan changes.
            </span>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>

            {!isSamePlan && (
              <Button
                variant={selectedTarget === "yearly" ? "hero" : "default"}
                size="sm"
                disabled={isCheckoutLoading || !checkout}
                onClick={handleProceed}
                className="w-full sm:w-auto h-11 px-6 rounded-xl font-bold text-xs shadow-lg shadow-primary/20 gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <CreditCard className="size-4" />
                <span>
                  {selectedTarget === "yearly"
                    ? `Switch to Annual ($${ANNUAL_PRICE}/yr)`
                    : `Switch to Monthly ($${MONTHLY_PRICE}/mo)`}
                </span>
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
