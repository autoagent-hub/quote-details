import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  Sparkles,
  ShieldCheck,
  Clock,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { ChangePlanDialog } from "@/components/dashboard/ChangePlanDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  getUpgradeCheckout,
  getTrialState,
  linkWhopSubscriptionByEmail,
  cancelUserSubscription,
  reconcileCheckout,
} from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/upgrade")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Plans & Billing — Detailr Online" },
      {
        name: "description",
        content:
          "Manage your Detailr Pro subscription, choose between Monthly or Annual billing, and access your Whop invoices.",
      },
      { property: "og:title", content: "Plans & Billing — Detailr Online" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BillingPage,
});

const PERKS = [
  "Unlimited customer quote requests",
  "Real-time Telegram alerts with photos",
  "Custom vehicle pricing & add-ons engine",
  "Your branded shop quote link",
  "Full quote history & CRM dashboard",
  "Zero commission fees on customer leads",
];

function BillingPage() {
  const queryClient = useQueryClient();
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [whopEmailInput, setWhopEmailInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCheckout = useServerFn(getUpgradeCheckout);
  const fetchTrial = useServerFn(getTrialState);
  const doLink = useServerFn(linkWhopSubscriptionByEmail);
  const doCancel = useServerFn(cancelUserSubscription);
  const doReconcile = useServerFn(reconcileCheckout);

  const {
    data: trial,
    isLoading: isTrialLoading,
    refetch: refetchTrial,
  } = useQuery({
    queryKey: ["trial-state"],
    queryFn: () => fetchTrial(),
  });

  const { data: userData } = useQuery({
    queryKey: ["upgrade-account"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_status, business_name, whop_membership_id")
        .eq("id", user.id)
        .maybeSingle();
      const hasMem =
        typeof profile?.whop_membership_id === "string" &&
        (profile.whop_membership_id.startsWith("mem_") ||
          profile.whop_membership_id.startsWith("pay_"));
      return {
        userId: user.id,
        email: user.email ?? "",
        status: hasMem ? "SUBSCRIBED" : ((profile?.trial_status as string | undefined) ?? "TRIAL"),
        hasMembership: hasMem,
      };
    },
  });

  const { data: checkout, isLoading: isCheckoutLoading } = useQuery({
    queryKey: ["upgrade-checkout"],
    queryFn: () => fetchCheckout(),
  });

  // Reconcile checkout on return if ?checkout=success is present in URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setIsReconciling(true);
      void doReconcile()
        .then((res) => {
          if (res.isSubscribed) {
            toast.success("Payment verified! Detailr Pro is now active.");
          } else {
            toast.info("Payment received! Webhook is confirming your subscription...");
          }
          void queryClient.invalidateQueries({ queryKey: ["trial-state"] });
          void queryClient.invalidateQueries({ queryKey: ["profile"] });
          void queryClient.invalidateQueries({ queryKey: ["upgrade-account"] });
        })
        .catch(() => undefined)
        .finally(() => {
          setIsReconciling(false);
        });
    }
  }, [doReconcile, queryClient]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchTrial(),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["upgrade-account"] }),
      ]);
      toast.success("Subscription status re-synchronized.");
    } catch {
      toast.error("Failed to re-sync billing status.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const isSubscribed = !!trial?.isSubscribed;
  const isYearly = isSubscribed && trial?.planType === "yearly";
  const isMonthly = isSubscribed && trial?.planType === "monthly";
  const isTrial = !isSubscribed && (trial?.status === "TRIAL" || trial?.status === "TRIAL_PENDING");
  const cancelAtPeriodEnd = !!trial?.cancelAtPeriodEnd;
  const inGracePeriod = !!trial?.inGracePeriod;

  const renewalDateFormatted = trial?.nextBillingDateFormatted || "End of billing cycle";
  const daysRemaining = trial?.renewalDaysLeft ?? trial?.daysLeft ?? 0;

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await doCancel();
      toast.success(res.message);
      setCancelModalOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trial-state"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["upgrade-account"] }),
      ]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel auto-renew.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLinkWhopEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whopEmailInput.trim()) {
      toast.error("Please enter the email address used during checkout.");
      return;
    }

    setIsLinking(true);
    try {
      const res = await doLink({
        input: { whopEmailOrMembershipId: whopEmailInput.trim() },
      });
      toast.success(res.message);
      setLinkModalOpen(false);
      setWhopEmailInput("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trial-state"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["upgrade-account"] }),
      ]);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Could not link account. Please verify your email.",
      );
    } finally {
      setIsLinking(false);
    }
  };

  const monthlyHref = checkout?.monthlyHref || "https://whop.com/checkout/plan_IrzVc4vCnCiQ1";
  const yearlyHref = checkout?.yearlyHref || "https://whop.com/checkout/plan_Gmhnwjw8YVRyQ";

  // Active plan title
  const activePlanTitle = isYearly
    ? "Detailr Pro Annual Pass ($145/yr)"
    : isMonthly
      ? "Detailr Pro Monthly ($12.99/mo)"
      : isTrial
        ? "7-Day Free Trial"
        : trial?.planName || "Free Plan";

  return (
    <div className="min-h-screen bg-surface pb-20 font-sans">
      {/* Top Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
          <QuoteFlowLogo size="md" linkToHome />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8 sm:py-10 space-y-8">
        {/* Reconciling Payment Notice */}
        {isReconciling && (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex items-center gap-3 text-xs text-primary animate-pulse">
            <RefreshCw className="size-4 animate-spin shrink-0" />
            <span className="font-semibold">Confirming your recent payment with Whop...</span>
          </div>
        )}

        {/* Page Title & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Plans & Billing
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Manage your subscription plan, billing frequency, and invoices.
          </p>
        </div>

        {/* CURRENT ACTIVE PLAN SUMMARY CARD */}
        <Card className="rounded-2xl border-2 border-border/80 bg-card shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Your Current Plan
                </span>

                {/* Status Badges */}
                {isSubscribed ? (
                  cancelAtPeriodEnd ? (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Cancels at Period End
                    </Badge>
                  ) : inGracePeriod ? (
                    <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Payment Past Due
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Pro
                    </Badge>
                  )
                ) : isTrial ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Free Trial
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    Inactive
                  </Badge>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black text-foreground">{activePlanTitle}</h2>

              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                {isSubscribed ? (
                  cancelAtPeriodEnd ? (
                    <span>
                      Access active through <strong>{renewalDateFormatted}</strong>
                    </span>
                  ) : (
                    <span>
                      Next billing date: <strong>{renewalDateFormatted}</strong>
                    </span>
                  )
                ) : isTrial ? (
                  <span>
                    <strong>
                      {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
                    </strong>{" "}
                    in your 7-day trial (ends {renewalDateFormatted})
                  </span>
                ) : (
                  <span>Select a plan below to activate your account.</span>
                )}

                {trial?.whopCustomerEmail && (
                  <>
                    <span className="hidden sm:inline opacity-40">·</span>
                    <span className="truncate">{trial.whopCustomerEmail}</span>
                  </>
                )}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 shrink-0">
              <a
                href={trial?.whopPortalUrl || "https://whop.com/hub/memberships/"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background text-xs font-bold text-foreground hover:bg-muted/40 transition-colors shadow-2xs"
              >
                <span>Invoices in Whop Hub</span>
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                onClick={handleRefresh}
                disabled={isRefreshing || isTrialLoading}
                title="Sync subscription state"
              >
                <RefreshCw
                  className={`size-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
                />
              </Button>

              {isSubscribed && !cancelAtPeriodEnd && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCancelModalOpen(true)}
                  className="h-8 px-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-500/10"
                >
                  Cancel auto-renew
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* SIDE-BY-SIDE PLANS WITH DYNAMIC UPGRADE / DOWNGRADE BUTTONS */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Subscription Plans</h3>
            <p className="text-xs text-muted-foreground">
              Select or change your plan anytime. Zero setup fees, 0% commission on leads, cancel
              anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* 1. MONTHLY PLAN CARD */}
            <Card
              className={`rounded-2xl border-2 transition-all p-6 sm:p-7 flex flex-col justify-between ${
                isMonthly
                  ? "border-emerald-500/60 bg-emerald-500/[0.02] shadow-md ring-1 ring-emerald-500/20"
                  : "border-border/80 bg-card hover:border-border"
              }`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Monthly Membership</h4>
                    <p className="text-xs text-muted-foreground">Flexible month-to-month billing</p>
                  </div>
                  {isMonthly && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                      Current Plan
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-4xl font-extrabold text-foreground">$12.99</span>
                    <span className="text-xs font-sans text-muted-foreground font-medium">
                      / month
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Billed monthly · Cancel anytime with 1 click
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    What&apos;s Included
                  </p>
                  <ul className="space-y-2 text-xs">
                    {PERKS.map((perk) => (
                      <li key={`monthly-${perk}`} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500 font-bold" />
                        <span className="text-foreground leading-snug">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Dynamic Action Button for Monthly Plan */}
              <div className="pt-6 mt-6 border-t border-border/40">
                {isMonthly ? (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full h-11 rounded-xl font-bold text-xs bg-muted/40 border-border/60 text-muted-foreground cursor-default"
                  >
                    <CheckCircle2 className="size-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                    Your Current Plan
                  </Button>
                ) : isYearly ? (
                  <Button
                    variant="outline"
                    onClick={() => setChangePlanOpen(true)}
                    className="w-full h-11 rounded-xl font-bold text-xs border-border/80 hover:bg-muted/30"
                  >
                    Switch to Monthly ($12.99/mo)
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-11 rounded-xl font-bold text-xs border-primary/40 text-primary hover:bg-primary/5"
                  >
                    <a href={monthlyHref}>
                      <CreditCard className="size-4 mr-1.5" />
                      Subscribe Monthly ($12.99/mo)
                    </a>
                  </Button>
                )}
              </div>
            </Card>

            {/* 2. ANNUAL PASS CARD (FEATURED) */}
            <Card
              className={`relative rounded-2xl border-2 transition-all p-6 sm:p-7 flex flex-col justify-between ${
                isYearly
                  ? "border-amber-500/80 bg-amber-500/[0.02] shadow-xl ring-2 ring-amber-500/20"
                  : "border-amber-500/40 bg-card hover:border-amber-500/70 shadow-md"
              }`}
            >
              {/* Top Accent Ribbon */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-amber-500 rounded-t-2xl" />

              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-bold text-foreground">Annual Pass</h4>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-extrabold">
                        Save ~$11/yr
                      </span>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Best Value · 12-Month Access
                    </p>
                  </div>

                  {isYearly && (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold">
                      Current Plan
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-4xl font-extrabold text-foreground">$145</span>
                    <span className="text-xs font-sans text-muted-foreground font-medium">
                      / year
                    </span>
                    <span className="ml-auto text-[11px] font-sans font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      ~$12/mo equivalent
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Billed annually · Full 12 months uninterrupted access
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 flex items-center gap-2">
                    <ShieldCheck className="size-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground">
                      12-Month Locked-in Price Guarantee
                    </span>
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-1">
                    What&apos;s Included
                  </p>
                  <ul className="space-y-2 text-xs">
                    {PERKS.map((perk) => (
                      <li key={`yearly-${perk}`} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500 font-bold" />
                        <span className="text-foreground leading-snug">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Dynamic Action Button for Annual Pass */}
              <div className="pt-6 mt-6 border-t border-border/40">
                {isYearly ? (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full h-11 rounded-xl font-bold text-xs bg-muted/40 border-border/60 text-muted-foreground cursor-default"
                  >
                    <CheckCircle2 className="size-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                    Your Current Plan
                  </Button>
                ) : isMonthly ? (
                  <Button
                    variant="hero"
                    onClick={() => setChangePlanOpen(true)}
                    className="w-full h-11 rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    <Sparkles className="size-4 mr-1.5 text-amber-300" />
                    Upgrade to Annual ($145/yr)
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="hero"
                    className="w-full h-11 rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    <a href={yearlyHref}>
                      <CreditCard className="size-4 mr-1.5" />
                      Subscribe Annual Pass ($145/yr)
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Security & Account Reconciliation Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border/40">
          <p>🔒 Payments are processed securely via Whop with 256-bit SSL encryption.</p>
          <button
            type="button"
            onClick={() => setLinkModalOpen(true)}
            className="text-primary hover:underline font-bold text-xs cursor-pointer shrink-0"
          >
            Already paid with another email?
          </button>
        </div>
      </main>

      {/* PLAN CHANGE & PRORATION DIALOG */}
      <ChangePlanDialog open={changePlanOpen} onOpenChange={setChangePlanOpen} trial={trial} />

      {/* CANCELLATION CONFIRMATION DIALOG */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-5" /> Cancel Detailr Pro Auto-Renew?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to cancel auto-renewal? Your public quote link and Telegram
              alerts will remain 100% active until the end of your prepaid period (
              {renewalDateFormatted}).
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
              className="w-full sm:w-auto text-xs font-bold"
            >
              Keep My Plan
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isCancelling}
              onClick={handleConfirmCancel}
              className="w-full sm:w-auto text-xs font-bold"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="size-3 mr-1.5 animate-spin" /> Cancelling...
                </>
              ) : (
                "Confirm Cancel Auto-Renew"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LINK WHOP EMAIL DIALOG */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-bold text-foreground">
              Link Whop Checkout Email
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              If you purchased Detailr Pro using an Apple ID, alternate Gmail, or Whop account,
              enter that email address to immediately link your active membership to this shop.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLinkWhopEmail} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="whop_email" className="text-xs font-bold text-foreground">
                Whop Checkout Email
              </label>
              <Input
                id="whop_email"
                type="email"
                required
                value={whopEmailInput}
                onChange={(e) => setWhopEmailInput(e.target.value)}
                placeholder="email@example.com"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLinkModalOpen(false)}
                className="w-full sm:w-auto text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="hero"
                size="sm"
                disabled={isLinking}
                className="w-full sm:w-auto text-xs font-bold"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="size-3 mr-1.5 animate-spin" /> Linking...
                  </>
                ) : (
                  "Link Membership"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
