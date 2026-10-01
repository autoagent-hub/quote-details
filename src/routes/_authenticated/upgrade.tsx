import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  Sparkles,
  Calendar,
  ShieldCheck,
  Clock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { supabase } from "@/integrations/supabase/client";
import { getUpgradeCheckout, getTrialState } from "@/lib/billing.functions";

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
  SUBSCRIBED: {
    label: "Active Pro Member",
    note: "Your account is active — thank you for being a subscriber!",
  },
  CANCELLED: {
    label: "Cancelled",
    note: "Your plan was cancelled. Re-subscribe below to re-activate your quote link.",
  },
  PAST_DUE: {
    label: "Payment failed",
    note: "The last payment attempt failed. Please update your payment method below.",
  },
};

function Upgrade() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const fetchCheckout = useServerFn(getUpgradeCheckout);
  const fetchTrial = useServerFn(getTrialState);

  const { data: trial } = useQuery({
    queryKey: ["trial-state"],
    queryFn: () => fetchTrial(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["upgrade-account"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
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

  const { data: checkout } = useQuery({
    queryKey: ["upgrade-checkout"],
    queryFn: () => fetchCheckout(),
  });

  const subscribed = !!trial?.isSubscribed;
  const status = subscribed ? "SUBSCRIBED" : (data?.status ?? "TRIAL");
  const copy = statusCopy[status] ?? {
    label: "Free trial",
    note: "You're currently on trial. Pick a plan to lock in uninterrupted access.",
  };

  const monthlyHref = checkout?.monthlyHref || "https://whop.com/checkout/plan_IrzVc4vCnCiQ1";
  const yearlyHref = checkout?.yearlyHref || "https://whop.com/checkout/plan_Gmhnwjw8YVRyQ";

  return (
    <div className="min-h-screen bg-surface pb-16">
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
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-bold uppercase tracking-wider border-primary/30 text-primary bg-primary/5"
          >
            {copy.label}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Choose Your Detailr Pro Billing Plan
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Both plans include 100% of Detailr Pro features with zero limitations. Choose
            month-to-month flexibility or lock in 12 months with our Annual Pass.
          </p>

          {/* Billing Cycle Selector Tabs */}
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
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
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
                {subscribed ? (
                  <Button asChild variant="outline" className="w-full h-12 rounded-xl font-bold">
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
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
                )}
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
                {subscribed ? (
                  <Button asChild variant="outline" className="w-full h-12 rounded-xl font-bold">
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
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
                )}
              </div>
            </Card>
          </div>
        )}

        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-center space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            🔒 Payments are processed securely via Whop. Your account upgrades automatically as soon
            as payment completes.
          </p>
        </div>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Detailr · A Nerochaze Company. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
