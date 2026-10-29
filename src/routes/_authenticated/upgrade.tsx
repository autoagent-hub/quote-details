import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Check,
  Zap,
  CreditCard,
  Loader2,
  AlertTriangle,
  Globe,
  Receipt,
  History,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { getTrialState } from "@/lib/billing.functions";
import {
  initiateFlutterwaveTopup,
  verifyFlutterwaveTopup,
  getUserCreditPurchases,
  getCreditDashboardData,
  updateBillingCurrency,
  FX_RATES,
} from "@/lib/flutterwave.functions";
import { money } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/upgrade")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Credit Dashboard & Billing — Detailr Online" },
      {
        name: "description",
        content:
          "Manage your bot credits, view purchase history, and top up via Flutterwave on Detailr Online.",
      },
    ],
  }),
  component: UpgradePage,
});

const BASE_CREDIT_PACKAGES = [
  { credits: 50, baseAmount: 10, label: "Starter Pack (50 Credits)" },
  { credits: 250, baseAmount: 45, label: "Pro Pack (250 Credits) — Best Value", featured: true },
  { credits: 600, baseAmount: 100, label: "Scale Pack (600 Credits)" },
];

const SUPPORTED_CURRENCIES = [
  { code: "USD", label: "USD ($) — US Dollar" },
  { code: "NGN", label: "NGN (₦) — Nigerian Naira" },
  { code: "GBP", label: "GBP (£) — British Pound" },
  { code: "EUR", label: "EUR (€) — Euro" },
  { code: "CAD", label: "CAD (C$) — Canadian Dollar" },
  { code: "AUD", label: "AUD (A$) — Australian Dollar" },
  { code: "KES", label: "KES (KSh) — Kenyan Shilling" },
  { code: "GHS", label: "GHS (GH₵) — Ghanaian Cedi" },
  { code: "ZAR", label: "ZAR (R) — South African Rand" },
];

function UpgradePage() {
  const queryClient = useQueryClient();
  const fetchTrial = useServerFn(getTrialState);
  const doInitiate = useServerFn(initiateFlutterwaveTopup);
  const doVerify = useServerFn(verifyFlutterwaveTopup);
  const fetchPurchases = useServerFn(getUserCreditPurchases);
  const fetchDashboardData = useServerFn(getCreditDashboardData);
  const doUpdateCurrency = useServerFn(updateBillingCurrency);

  const [isProcessing, setIsProcessing] = useState(false);
  const [customCreditsInput, setCustomCreditsInput] = useState<string>("50");
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem("detailr_user_currency") || "";
      }
    } catch {
      // ignore
    }
    return "";
  });

  const { data: trial } = useQuery({
    queryKey: ["trial-state"],
    queryFn: () => fetchTrial(),
  });

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["credit-dashboard-data"],
    queryFn: () => fetchDashboardData(),
  });

  const { data: purchases = [], isLoading: isPurchasesLoading } = useQuery({
    queryKey: ["credit-purchases"],
    queryFn: () => fetchPurchases(),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-currency"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return { currency: "USD" };
      const { data: p } = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", user.user.id)
        .maybeSingle();
      return { currency: p?.currency || "USD" };
    },
  });

  const currency = (selectedCurrency || profile?.currency || "USD").toUpperCase();

  const handleCurrencyChange = async (newCurr: string) => {
    setSelectedCurrency(newCurr);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("detailr_user_currency", newCurr);
      }
    } catch {
      // ignore
    }
    try {
      await doUpdateCurrency({ data: { currency: newCurr } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile-currency"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["trial-state"] }),
      ]);
      toast.success(`Currency switched to ${newCurr}`);
    } catch (err) {
      console.warn("Failed to persist currency change:", err);
      toast.info(`Switched display currency to ${newCurr}`);
    }
  };

  const getAdjustedAmount = (baseAmount: number) => {
    const rate = FX_RATES[currency] ?? 1.0;
    if (currency === "USD") return baseAmount;
    if (currency === "NGN" || currency === "KES" || currency === "UGX" || currency === "TZS") {
      return Math.round(baseAmount * rate);
    }
    return Math.round(baseAmount * rate * 100) / 100;
  };

  const rawNum = parseInt(customCreditsInput, 10);
  const isValidNum = !isNaN(rawNum) && rawNum > 0;
  const numericCredits = isValidNum ? rawNum : 0;
  const hasInput = customCreditsInput.trim().length > 0;
  const isBelowMin = hasInput && numericCredits < 50;
  const isReadyToBuy = hasInput && numericCredits >= 50;

  // Custom base USD: $0.20 per credit, minimum $10 for 50 credits
  const customBaseUsd = isReadyToBuy ? Math.round(numericCredits * 0.2 * 100) / 100 : 10;
  const customAdjustedAmount = getAdjustedAmount(customBaseUsd);

  const creditsBalance = dashboardData?.balance ?? 50;
  const isLowBalance = creditsBalance < 10;

  // Load Flutterwave v3 script
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("flutterwave-inline-script")) return;
    const script = document.createElement("script");
    script.id = "flutterwave-inline-script";
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleBuyCredits = async (credits: number, baseAmount: number) => {
    setIsProcessing(true);
    try {
      const init = await doInitiate({
        data: { amountUsd: baseAmount, creditsAmount: credits, currency },
      });

      // @ts-expect-error FlutterwaveCheckout global
      if (typeof window.FlutterwaveCheckout === "function") {
        // @ts-expect-error FlutterwaveCheckout global
        window.FlutterwaveCheckout({
          public_key: init.publicKey,
          tx_ref: init.txRef,
          amount: init.amount,
          currency: init.currency,
          payment_options: "card, mobilemoney, ussd",
          customer: {
            email: init.email,
          },
          callback: async (response: { status: string; tx_ref: string }) => {
            if (response.status === "successful" || response.status === "completed") {
              const res = await doVerify({
                data: {
                  txRef: response.tx_ref,
                  creditsAmount: credits,
                  amountPaid: init.amount,
                  currency: init.currency,
                },
              });
              toast.success(res.message);
              await queryClient.invalidateQueries({ queryKey: ["trial-state"] });
              await queryClient.invalidateQueries({ queryKey: ["credit-dashboard-data"] });
              await queryClient.invalidateQueries({ queryKey: ["credit-purchases"] });
            } else {
              toast.info("Payment was cancelled or failed.");
            }
            setIsProcessing(false);
          },
          onclose: () => {
            setIsProcessing(false);
          },
        });
      } else {
        // Fallback simulation if script didn't load
        const res = await doVerify({
          data: {
            txRef: init.txRef,
            creditsAmount: credits,
            amountPaid: init.amount,
            currency: init.currency,
          },
        });
        toast.success(res.message);
        await queryClient.invalidateQueries({ queryKey: ["trial-state"] });
        await queryClient.invalidateQueries({ queryKey: ["credit-dashboard-data"] });
        await queryClient.invalidateQueries({ queryKey: ["credit-purchases"] });
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate payment.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-20 font-sans">
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
        {/* Low Balance Warning Banner */}
        {isLowBalance && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200 animate-pulse">
            <AlertTriangle className="size-5 text-amber-600 shrink-0" />
            <div>
              <strong className="font-bold">Low Credit Warning:</strong> You have only{" "}
              {creditsBalance} credits remaining. Top up your account below to ensure uninterrupted
              customer quote alerts sent to Telegram.
            </div>
          </div>
        )}

        {/* Header & Currency Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Credit Dashboard & Billing
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Credits are deducted only per successful customer quote sent to Telegram (test quotes
              are free).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-card border border-border/80 px-3 py-2 rounded-xl shadow-xs shrink-0">
            <Globe className="size-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground">Currency:</span>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="h-8 w-36 text-xs font-semibold rounded-lg border-border bg-background">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="text-xs">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Credit Dashboard Overview Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Balance */}
          <Card className="rounded-2xl border-2 border-primary/40 bg-card p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Zap className="size-3.5 text-primary" /> Active Balance
                </span>
                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Never Expires
                </Badge>
              </div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground pt-1">
                {isDashboardLoading ? "..." : creditsBalance}{" "}
                <span className="text-xs font-semibold text-muted-foreground">Credits</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground pt-3 border-t border-border/40 mt-3">
              1 credit = 1 real customer quote delivered to Telegram.
            </p>
          </Card>

          {/* Card 2: 7-Day Free Trial Status */}
          <Card className="rounded-2xl border-2 border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="size-3.5 text-amber-500" /> Free Trial Status
                </span>
                {trial?.isPendingFirstVisit ? (
                  <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Paused Until 1st Visit
                  </Badge>
                ) : trial?.status === "TRIALING" ? (
                  <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {trial.daysLeft} Days Left
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Active
                  </Badge>
                )}
              </div>
              <div className="text-lg font-bold text-foreground pt-1">
                {trial?.isPendingFirstVisit
                  ? "7-Day Trial Ready"
                  : trial?.status === "TRIALING"
                    ? `${trial.daysLeft} Days Remaining`
                    : "7-Day Trial Included"}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground pt-3 border-t border-border/40 mt-3">
              {trial?.isPendingFirstVisit
                ? "Countdown begins only when your 1st customer visits."
                : trial?.expiresAt
                  ? `Expires on ${new Date(trial.expiresAt).toLocaleDateString()}`
                  : "Unlimited leads during 7-day trial (no credits needed). Pay-as-you-go after trial ends."}
            </p>
          </Card>

          {/* Card 3: Delivered Quotes */}
          <Card className="rounded-2xl border-2 border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="size-3.5 text-emerald-500" /> Leads Delivered
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  100% Commission-free
                </span>
              </div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground pt-1">
                {dashboardData?.totalQuotesDelivered ?? 0}{" "}
                <span className="text-xs font-semibold text-muted-foreground">Telegram Alerts</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground pt-3 border-t border-border/40 mt-3">
              Test quotes are always free and never deducted.
            </p>
          </Card>
        </div>

        {/* Custom Credit Amount Calculator */}
        <Card className="rounded-2xl border-2 border-border/80 bg-card p-6 space-y-5 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Custom Credit Top-Up</h3>
            <p className="text-xs text-muted-foreground">
              Minimum purchase is 50 credits ($10 USD equivalent). Enter your desired credits below
              or tap a quick-pick preset to see the real-time price in {currency}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-foreground">
                Number of Credits (Minimum 50)
              </label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 50"
                  value={customCreditsInput}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, "");
                    setCustomCreditsInput(cleaned);
                  }}
                  className="bg-background border-border text-sm font-bold h-11 pr-9"
                />
                {customCreditsInput && (
                  <button
                    type="button"
                    onClick={() => setCustomCreditsInput("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                    title="Clear credit input"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">
                Real-time Equivalent
              </label>
              <div className="h-11 px-3 rounded-xl bg-muted/50 border border-border flex items-center justify-between font-mono text-sm font-bold text-foreground">
                {isReadyToBuy ? (
                  <>
                    <span>{money(customAdjustedAmount, currency)}</span>
                    <span className="text-xs font-sans text-muted-foreground font-semibold">
                      {numericCredits} Credits
                    </span>
                  </>
                ) : isBelowMin ? (
                  <>
                    <span className="text-amber-500 font-sans text-xs">Min 50 required</span>
                    <span className="text-xs font-sans text-muted-foreground">
                      {numericCredits} entered
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-sans text-muted-foreground font-normal">
                      Min $10 / 50 leads
                    </span>
                    <span className="text-xs font-sans text-muted-foreground">50 Credits min</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick-pick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
            <span className="text-[11px] font-bold text-muted-foreground mr-1">Quick pick:</span>
            {[
              { credits: 50, usd: 10, label: "50 Leads" },
              { credits: 100, usd: 20, label: "100 Leads" },
              { credits: 250, usd: 45, label: "250 Leads" },
              { credits: 500, usd: 90, label: "500 Leads" },
              { credits: 1000, usd: 180, label: "1,000 Leads" },
            ].map((item) => {
              const active = customCreditsInput === String(item.credits);
              return (
                <button
                  key={item.credits}
                  type="button"
                  onClick={() => setCustomCreditsInput(String(item.credits))}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary/40"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border-border"
                  }`}
                >
                  {item.label} · {money(getAdjustedAmount(item.usd), currency)}
                </button>
              );
            })}
          </div>

          {isBelowMin && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
              <AlertTriangle className="size-4 shrink-0 text-amber-600" />
              Minimum order is 50 credits ($10 USD equivalent). Please enter 50 or more credits.
            </p>
          )}

          <div className="pt-1">
            <Button
              variant="hero"
              className="w-full h-11 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              disabled={isProcessing || !isReadyToBuy}
              onClick={() => {
                if (!isReadyToBuy) return;
                handleBuyCredits(numericCredits, customBaseUsd);
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" /> Processing Payment...
                </>
              ) : !hasInput ? (
                <>
                  <CreditCard className="size-4 mr-2" /> Enter Credit Amount (50 min · $10)
                </>
              ) : isBelowMin ? (
                <>
                  <CreditCard className="size-4 mr-2" /> Minimum 50 Credits Required ($10 min)
                </>
              ) : (
                <>
                  <CreditCard className="size-4 mr-2" /> Top Up {numericCredits} Credits for{" "}
                  {money(customAdjustedAmount, currency)}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Preset Packages */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Preset Credit Packages</h3>
            <p className="text-xs text-muted-foreground">
              Select a popular reload package below to pay securely via Flutterwave in {currency}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BASE_CREDIT_PACKAGES.map((pkg) => {
              const adjustedAmt = getAdjustedAmount(pkg.baseAmount);
              return (
                <Card
                  key={pkg.credits}
                  className={`relative rounded-2xl border-2 p-6 flex flex-col justify-between transition-all ${
                    pkg.featured
                      ? "border-primary bg-card shadow-lg ring-2 ring-primary/20"
                      : "border-border/80 bg-card hover:border-border"
                  }`}
                >
                  {pkg.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                      Most Popular
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{pkg.label}</h4>
                      <p className="text-[11px] text-muted-foreground">Never expires</p>
                    </div>
                    <div className="flex items-baseline gap-1 font-mono">
                      <span className="text-3xl font-extrabold text-foreground">
                        {money(adjustedAmt, currency)}
                      </span>
                      <span className="text-xs text-muted-foreground font-sans">
                        / {pkg.credits} credits
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-muted-foreground pt-2">
                      <li className="flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-500 font-bold" />
                        <span>{pkg.credits} Customer Quote Leads</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-500 font-bold" />
                        <span>Instant balance reload ({currency})</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border/40">
                    <Button
                      variant={pkg.featured ? "hero" : "outline"}
                      className="w-full h-10 rounded-xl font-bold text-xs shadow-sm"
                      disabled={isProcessing}
                      onClick={() => handleBuyCredits(pkg.credits, pkg.baseAmount)}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="size-3.5 mr-1.5" /> Buy {pkg.credits} Credits (
                          {money(adjustedAmt, currency)})
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Purchase History Section */}
        <div className="space-y-4 pt-4 border-t border-border/60">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Receipt className="size-4 text-primary" /> Purchase & Recharge History
              </h3>
              <p className="text-xs text-muted-foreground">
                All completed credit recharges and payment receipts via Flutterwave.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {purchases.length} Transactions
            </Badge>
          </div>

          <Card className="rounded-2xl border-2 border-border/80 bg-card overflow-hidden shadow-xs">
            {isPurchasesLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-primary" /> Loading purchase records...
              </div>
            ) : purchases.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <History className="size-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm font-semibold text-foreground">No purchases yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When you top up credits via Flutterwave, your transaction references and receipts
                  will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Reference</th>
                      <th className="px-5 py-3">Credits Added</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Payment Method</th>
                      <th className="px-5 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap text-foreground font-medium">
                          {new Date(p.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">
                          {p.txRef.length > 24 ? `${p.txRef.slice(0, 24)}...` : p.txRef}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                          +{p.credits} Credits
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-foreground">
                          {money(p.amount, p.currency)}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">Flutterwave Secure</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="size-3" /> Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
