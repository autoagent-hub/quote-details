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
  Link as LinkIcon,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      { title: "Upgrade to Detailr Pro — Detailr Online" },
      {
        name: "description",
        content:
          "Choose between $9.99/month or $110.99/year for unlimited auto detailing quote requests and real-time Telegram alerts on detailr.online.",
      },
      { property: "og:title", content: "Upgrade to Detailr Pro — Detailr Online" },
      {
        property: "og:description",
        content:
          "Unlimited quote requests, Telegram alerts and your branded quote link for $9.99/month or $110.99/year on Detailr Online.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://detailr.online/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://detailr.online/og-image.jpg" },
    ],
  }),
  component: Upgrade,
});

const perks = [
  "Unlimited customer quote requests",
  "Real-time Telegram alerts with photos",
  "Custom pricing per vehicle & add-on",
  "Your own branded quote link",
  "Full quote history & CRM dashboard",
];

const statusCopy: Record<string, { label: string; note: string }> = {
  TRIAL: {
    label: "Free trial",
    note: "You're currently on trial. Pick a plan to lock in uninterrupted access.",
  },
  TRIAL_PENDING: {
    label: "7-Day Trial (Pending First Customer)",
    note: "Your trial starts only after your first customer visit. Pick a plan anytime.",
  },
  ACTIVE: {
    label: "Active Pro Member",
    note: "Your account is active — thank you for being a subscriber!",
  },
  SUBSCRIBED: {
    label: "Active Pro Member",
    note: "Your account is active — thank you for being a subscriber!",
  },
  CANCELLED: {
    label: "Subscription Cancelled",
    note: "Your plan was cancelled. You retain access until the end of your billing cycle.",
  },
  EXPIRED: {
    label: "Trial Expired",
    note: "Your 7-day trial has concluded. Subscribe below to restore customer quote requests.",
  },
  PAST_DUE: {
    label: "Payment failed",
    note: "The last payment attempt failed. Please update your payment method below.",
  },
};

function Upgrade() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [whopEmailInput, setWhopEmailInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  const fetchCheckout = useServerFn(getUpgradeCheckout);
  const fetchTrial = useServerFn(getTrialState);
  const doLink = useServerFn(linkWhopSubscriptionByEmail);
  const doCancel = useServerFn(cancelUserSubscription);
  const doReconcile = useServerFn(reconcileCheckout);

  const { data: trial, isLoading: isTrialLoading } = useQuery({
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
        .select("trial_status, business_name")
        .eq("id", user.id)
        .maybeSingle();
      return {
        userId: user.id,
        email: user.email ?? "",
        status: (profile?.trial_status as string | undefined) ?? "TRIAL",
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

  const subscribed = !!trial?.isSubscribed;
  const isCancelled = !!trial?.isCancelled;
  const statusKey = subscribed
    ? "ACTIVE"
    : isCancelled
      ? "CANCELLED"
      : (trial?.status ?? userData?.status ?? "TRIAL");
  const copy = statusCopy[statusKey] ?? statusCopy["TRIAL"]!;

  const handleLinkWhopEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whopEmailInput.trim()) {
      toast.error("Please enter the email address you used during checkout.");
      return;
    }

    setIsLinking(true);
    try {
      const res = await doLink({
        input: { whopEmailOrMembershipId: whopEmailInput.trim() },
      });
      toast.success(res.message);
      setWhopEmailInput("");
      await queryClient.invalidateQueries({ queryKey: ["trial-state"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["upgrade-account"] });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Could not link email. Please check and try again.",
      );
    } finally {
      setIsLinking(false);
    }
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await doCancel();
      toast.success(res.message);
      setCancelModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["trial-state"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["upgrade-account"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to process cancellation.");
    } finally {
      setIsCancelling(false);
    }
  };

  const monthlyHref = checkout?.monthlyHref || "https://whop.com/checkout/plan_IrzVc4vCnCiQ1";
  const yearlyHref = checkout?.yearlyHref || "https://whop.com/checkout/plan_Gmhnwjw8YVRyQ";

  return (
    <div className="min-h-screen bg-surface pb-16 font-sans">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
          <QuoteFlowLogo size="md" linkToHome />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10 space-y-8">
        {/* Checkout Reconciling Notice */}
        {isReconciling && (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex items-center gap-3 text-xs text-primary animate-pulse">
            <RefreshCw className="size-4 animate-spin shrink-0" />
            <span className="font-semibold">Reconciling recent payment with Whop...</span>
          </div>
        )}

        {/* Status Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <Badge
              variant="outline"
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                subscribed
                  ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                  : isCancelled
                    ? "border-amber-500/30 text-amber-600 bg-amber-500/10"
                    : "border-primary/30 text-primary bg-primary/5"
              }`}
            >
              {copy.label}
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {subscribed ? "Your Detailr Pro Subscription" : "Choose Your Detailr Pro Billing Plan"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {subscribed
              ? "Your Pro membership is active. You have full access to unlimited quote requests and real-time Telegram alerts."
              : copy.note}
          </p>

          {!subscribed && (
            /* Billing Cycle Selector Tabs */
            <div className="inline-flex items-center rounded-2xl bg-muted p-1 border border-border/60 shadow-inner mt-2">
              <button
                type="button"
                onClick={() => setSelectedPlan("monthly")}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedPlan === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly Billing ($9.99/mo)
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan("yearly")}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedPlan === "yearly"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Annual Pass ($110.99/yr)</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-extrabold">
                  Best Value
                </span>
              </button>
            </div>
          )}
        </div>

        {/* SUBSCRIBED ACTIVE STATE CARD */}
        {subscribed && (
          <Card className="rounded-2xl border-2 border-emerald-500/40 bg-card p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    Detailr Pro Active
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 uppercase">
                      Subscribed
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">Connected to Whop Billing System</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  asChild
                  variant="hero"
                  className="w-full sm:w-auto font-bold text-xs shadow-sm"
                >
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto font-bold text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30"
                  onClick={() => setCancelModalOpen(true)}
                >
                  Cancel Plan
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface border border-border/60 space-y-1">
                <span className="text-muted-foreground font-semibold">Account Login Email:</span>
                <p className="font-mono font-bold text-foreground">
                  {userData?.email || "Unknown"}
                </p>
              </div>

              {trial?.whopCustomerEmail && (
                <div className="p-4 rounded-xl bg-surface border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-semibold">Whop Checkout Email:</span>
                  <p className="font-mono font-bold text-foreground">{trial.whopCustomerEmail}</p>
                </div>
              )}

              {trial?.whopMembershipId && (
                <div className="p-4 rounded-xl bg-surface border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-semibold">
                    Membership Reference ID:
                  </span>
                  <p className="font-mono font-bold text-foreground truncate">
                    {trial.whopMembershipId}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-surface border border-border/60 space-y-1">
                <span className="text-muted-foreground font-semibold">
                  Self-Service Customer Portal:
                </span>
                <p>
                  <a
                    href={trial?.whopPortalUrl || "https://whop.com/hub/memberships/"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                  >
                    Open Whop Member Hub <ExternalLink className="size-3" />
                  </a>
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* CANCELLED ACTIVE NOTICE */}
        {isCancelled && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Subscription Cancelled</h4>
              <p className="leading-relaxed">
                Your subscription has been cancelled. Your quote link will remain active through the
                end of your prepaid billing period. You can choose a plan below to reactivate at any
                time.
              </p>
            </div>
          </div>
        )}

        {/* EMAIL RECONCILIATION / CLAIM SUBSCRIPTION TOOL */}
        <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <LinkIcon className="size-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                Paid with a different email on Whop or Apple Pay?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If your registered Detailr email (
                <strong>{userData?.email || "this account"}</strong>) differs from the email you
                entered at checkout (or if you used Apple Pay/PayPal), enter your checkout email
                below to instantly link your Pro membership:
              </p>
            </div>
          </div>

          <form onSubmit={handleLinkWhopEmail} className="flex flex-col sm:flex-row gap-3 pt-1">
            <Input
              type="text"
              placeholder="e.g. checkout-email@example.com or mem_..."
              value={whopEmailInput}
              onChange={(e) => setWhopEmailInput(e.target.value)}
              className="h-10 text-xs rounded-xl bg-background border-border flex-1"
            />
            <Button
              type="submit"
              disabled={isLinking || !whopEmailInput.trim()}
              className="h-10 font-bold text-xs rounded-xl px-5"
            >
              {isLinking ? (
                <>
                  <Loader2 className="size-3.5 mr-2 animate-spin" /> Linking...
                </>
              ) : (
                "Link & Activate Pro"
              )}
            </Button>
          </form>
        </Card>

        {/* PRICING CARDS (Always visible if not subscribed, or shown below as plan choices) */}
        {!subscribed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-2">
            {/* 1 Month Plan Card */}
            <Card
              className={`relative overflow-hidden transition-all duration-200 flex flex-col justify-between cursor-pointer rounded-2xl border p-6 sm:p-8 ${
                selectedPlan === "monthly"
                  ? "border-primary/60 bg-card shadow-lg ring-1 ring-primary/30"
                  : "border-border/60 bg-card/50 hover:border-border hover:bg-card/80"
              }`}
              onClick={() => setSelectedPlan("monthly")}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Monthly Membership</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Month-to-month flexibility
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-md"
                  >
                    1 Month
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                      $9.99
                    </span>
                    <span className="text-xs font-sans font-medium text-muted-foreground">
                      / month
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Billed monthly · Cancel anytime with 1 click
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Included in Monthly Plan
                  </p>
                  <ul className="space-y-3 text-xs">
                    {perks.map((perk) => (
                      <li key={`monthly-${perk}`} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-500 font-bold" />
                        <span className="text-foreground leading-snug">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8 mt-6 border-t border-border/40">
                <Button
                  asChild
                  variant={selectedPlan === "monthly" ? "hero" : "outline"}
                  className="w-full h-12 rounded-xl font-bold text-sm shadow-sm transition-all"
                >
                  <a href={monthlyHref} target="_blank" rel="noreferrer">
                    <CreditCard className="size-4 mr-2" />
                    Subscribe Monthly ($9.99/mo)
                  </a>
                </Button>
              </div>
            </Card>

            {/* 1 Year Plan Card (Featured) */}
            <Card
              className={`relative overflow-hidden transition-all duration-200 flex flex-col justify-between cursor-pointer rounded-2xl border p-6 sm:p-8 ${
                selectedPlan === "yearly"
                  ? "border-primary bg-card shadow-2xl ring-2 ring-primary/30"
                  : "border-border/60 bg-card/50 hover:border-border hover:bg-card/80"
              }`}
              onClick={() => setSelectedPlan("yearly")}
            >
              {/* Top Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-amber-500" />

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                      <Sparkles className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        Annual Membership
                      </h3>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Best Value · 12 Months Access
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                    Annual Pass
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                      $110.99
                    </span>
                    <span className="text-xs font-sans font-medium text-muted-foreground">
                      / year
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-sans text-[11px] font-bold ml-auto">
                      ~$9/mo equivalent
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Billed annually · Full 12 months uninterrupted access
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center gap-2.5">
                    <ShieldCheck className="size-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground">
                      12-Month Price Guarantee & Locked-in Access
                    </span>
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-1">
                    Included in Annual Plan
                  </p>
                  <ul className="space-y-3 text-xs">
                    {perks.map((perk) => (
                      <li key={`yearly-${perk}`} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-500 font-bold" />
                        <span className="text-foreground leading-snug">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8 mt-6 border-t border-border/40">
                <Button
                  asChild
                  variant="hero"
                  className="w-full h-12 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  <a href={yearlyHref} target="_blank" rel="noreferrer">
                    <CreditCard className="size-4 mr-2" />
                    Subscribe Yearly ($110.99/yr)
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-center space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            🔒 Payments are processed securely via Whop. Subscriptions activate immediately upon
            checkout completion.
          </p>
        </div>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Detailr. All rights reserved.
        </footer>
      </main>

      {/* CANCELLATION CONFIRMATION DIALOG */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-5" /> Cancel Detailr Pro Subscription?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to cancel your Detailr Pro subscription? Your public quote link
              and Telegram lead alerts will remain active until the end of your current prepaid
              billing cycle.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-surface border border-border/70 space-y-2 text-xs">
            <p className="font-semibold text-foreground">
              You can also manage receipts or billing details:
            </p>
            <a
              href="https://whop.com/hub/memberships/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline"
            >
              Open Whop Customer Billing Hub <ExternalLink className="size-3" />
            </a>
          </div>

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
                "Confirm Cancellation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
