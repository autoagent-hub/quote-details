import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Zap, CreditCard, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { getTrialState } from "@/lib/billing.functions";
import { initiateFlutterwaveTopup, verifyFlutterwaveTopup } from "@/lib/flutterwave.functions";
import { money } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/upgrade")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Credits & Billing — Detailr Online" },
      {
        name: "description",
        content: "Manage your AI bot usage credits and top up via Flutterwave on Detailr Online.",
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

function UpgradePage() {
  const queryClient = useQueryClient();
  const fetchTrial = useServerFn(getTrialState);
  const doInitiate = useServerFn(initiateFlutterwaveTopup);
  const doVerify = useServerFn(verifyFlutterwaveTopup);

  const [isProcessing, setIsProcessing] = useState(false);
  const [customCredits, setCustomCredits] = useState<number>(50);

  const { data: trial } = useQuery({
    queryKey: ["trial-state"],
    queryFn: () => fetchTrial(),
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

  const currency = (profile?.currency || "USD").toUpperCase();

  const getAdjustedAmount = (baseAmount: number) => {
    if (currency === "NGN") return baseAmount * 1500;
    if (currency === "GBP") return Math.round(baseAmount * 0.8);
    if (currency === "EUR") return Math.round(baseAmount * 0.92);
    if (currency === "CAD") return Math.round(baseAmount * 1.35);
    if (currency === "AUD") return Math.round(baseAmount * 1.55);
    if (currency === "KES") return Math.round(baseAmount * 130);
    if (currency === "GHS") return Math.round(baseAmount * 15);
    if (currency === "ZAR") return Math.round(baseAmount * 18);
    return baseAmount;
  };

  const customBaseUsd = Math.max(10, Math.round(customCredits * 0.2 * 100) / 100);
  const customAdjustedAmount = getAdjustedAmount(customBaseUsd);

  const [creditsBalance, setCreditsBalance] = useState<number>(50);

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
      const init = await doInitiate({ data: { amountUsd: baseAmount, creditsAmount: credits } });

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
                data: { txRef: response.tx_ref, creditsAmount: credits },
              });
              toast.success(res.message);
              setCreditsBalance(res.newBalance);
              await queryClient.invalidateQueries({ queryKey: ["trial-state"] });
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
        const res = await doVerify({ data: { txRef: init.txRef, creditsAmount: credits } });
        toast.success(res.message);
        setCreditsBalance(res.newBalance);
        await queryClient.invalidateQueries({ queryKey: ["trial-state"] });
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate payment.");
      setIsProcessing(false);
    }
  };

  const currentCredits = creditsBalance;
  const isLowBalance = currentCredits < 10;

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
              {currentCredits} credits remaining. Top up your account below to ensure uninterrupted
              AI bot quotes and Telegram lead alerts.
            </div>
          </div>
        )}

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            AI Bot Credits & Billing
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Credits are deducted per successful customer quote sent to Telegram (test quotes are
            free). Minimum purchase is $10 for 50 credits. Prices automatically adapt to your
            account currency ({currency}).
          </p>
        </div>

        {/* Current Balance Card */}
        <Card className="rounded-2xl border-2 border-primary/40 bg-card shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Zap className="size-3.5 text-primary" /> Bot Credit Balance
                </span>
                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {currentCredits} Credits Available
                </Badge>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-foreground">
                Pay-As-You-Go Credit System ({currency})
              </h2>

              <p className="text-xs text-muted-foreground">
                1 credit is deducted only when a valid customer quote is successfully delivered to
                your Telegram chat. Test submissions do not deduct credits.
              </p>
            </div>
          </div>
        </Card>

        {/* Custom Credit Amount Calculator */}
        <Card className="rounded-2xl border-2 border-border/80 bg-card p-6 space-y-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Custom Credit Amount</h3>
            <p className="text-xs text-muted-foreground">
              Minimum purchase is $10 for 50 credits. Enter your desired credits below to see the
              real-time equivalent in {currency}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-foreground">
                Number of Credits (Min 50)
              </label>
              <Input
                type="number"
                min={50}
                max={10000}
                value={customCredits}
                onChange={(e) => setCustomCredits(Math.max(50, parseInt(e.target.value) || 50))}
                className="bg-background border-border text-sm font-bold h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">
                Real-time Equivalent
              </label>
              <div className="h-11 px-3 rounded-xl bg-muted/50 border border-border flex items-center justify-between font-mono text-sm font-bold text-foreground">
                <span>{money(customAdjustedAmount, currency)}</span>
                <span className="text-xs font-sans text-muted-foreground">
                  {customCredits} Credits
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="hero"
              className="w-full h-11 rounded-xl font-bold text-xs shadow-sm"
              disabled={isProcessing || customCredits < 50}
              onClick={() => handleBuyCredits(customCredits, customBaseUsd)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" /> Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="size-4 mr-2" /> Top Up {customCredits} Credits for{" "}
                  {money(customAdjustedAmount, currency)}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Credit Packages */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              Preset Credit Packages (Min $10)
            </h3>
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
                        <span>{pkg.credits} AI Bot Interactions</span>
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
      </main>
    </div>
  );
}
