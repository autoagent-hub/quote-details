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
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { supabase } from "@/integrations/supabase/client";
import { getUpgradeCheckout } from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/upgrade")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Upgrade to Detailr Pro — Detailr Online" },
      {
        name: "description",
        content:
          "Choose between $9.99/month or $119.99/year for unlimited auto detailing quote requests and real-time Telegram alerts on detailr.online.",
      },
      { property: "og:title", content: "Upgrade to Detailr Pro — Detailr Online" },
      {
        property: "og:description",
        content:
          "Unlimited quote requests, Telegram alerts and your branded quote link for $9.99/month or $119.99/year on Detailr Online.",
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
    queryKey: ["upgrade-checkout", selectedPlan],
    queryFn: () => fetchCheckout({ data: { plan: selectedPlan } }),
  });

  const status = data?.status ?? "TRIAL";
  const copy = statusCopy[status] ?? {
    label: "Free trial",
    note: "You're currently on trial. Pick a plan to lock in uninterrupted access.",
  };
  const subscribed = status === "SUBSCRIBED";
  const checkoutHref =
    selectedPlan === "yearly"
      ? checkout?.yearlyHref || checkout?.href
      : checkout?.monthlyHref || checkout?.href;

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
            Simple, Transparent Pricing
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {copy.note} Choose month-to-month flexibility or lock in 12 months with our Annual Pass.
          </p>

          {/* Billing Cycle Selector Tabs */}
          <div className="inline-flex items-center rounded-2xl bg-muted p-1 border border-border/60 shadow-inner mt-2">
            <button
              type="button"
              onClick={() => setSelectedPlan("monthly")}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
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
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                selectedPlan === "yearly"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Annual Pass ($119.99/yr)</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch pt-2">
            {/* 1 Month Plan Card */}
            <Card
              className={`relative overflow-hidden transition-all flex flex-col justify-between ${
                selectedPlan === "monthly"
                  ? "border-2 border-primary shadow-xl ring-2 ring-primary/20 bg-card"
                  : "border-border/60 bg-card/60 opacity-90 hover:opacity-100"
              }`}
              onClick={() => setSelectedPlan("monthly")}
            >
              <div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Monthly Plan
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      1 Month
                    </Badge>
                  </div>
                  <div className="pt-2">
                    <p className="text-4xl font-extrabold tracking-tight text-foreground">
                      $9.99{" "}
                      <span className="text-sm font-normal text-muted-foreground">/ month</span>
                    </p>
                    <p className="text-xs text-muted-foreground pt-1">
                      Flexible month-to-month subscription
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5 text-xs">
                    {perks.map((perk) => (
                      <li key={`monthly-${perk}`} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                        <span className="text-foreground">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </div>

              <div className="p-6 pt-0 mt-6">
                {subscribed ? (
                  <Button asChild variant="outline" className="w-full rounded-xl font-bold">
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant={selectedPlan === "monthly" ? "hero" : "outline"}
                    className="w-full rounded-xl font-bold"
                  >
                    <a href={checkoutHref} target="_blank" rel="noreferrer">
                      <CreditCard className="size-4 mr-2" />
                      Get Monthly ($9.99/mo)
                    </a>
                  </Button>
                )}
              </div>
            </Card>

            {/* 1 Year Plan Card */}
            <Card
              className={`relative overflow-hidden transition-all flex flex-col justify-between ${
                selectedPlan === "yearly"
                  ? "border-2 border-primary shadow-2xl ring-4 ring-primary/20 bg-card"
                  : "border-border/60 bg-card/60 opacity-90 hover:opacity-100"
              }`}
              onClick={() => setSelectedPlan("yearly")}
            >
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-black font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                <Sparkles className="size-3" /> Recommended
              </div>

              <div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                      <Calendar className="size-3.5" /> Annual Plan
                    </span>
                  </div>
                  <div className="pt-2">
                    <p className="text-4xl font-extrabold tracking-tight text-foreground">
                      $119.99{" "}
                      <span className="text-sm font-normal text-muted-foreground">/ year</span>
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                      12 Months Full Uninterrupted Access
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5 text-xs">
                    <li className="flex items-start gap-2 font-semibold text-foreground">
                      <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                      <span>All Monthly features included for 12 months</span>
                    </li>
                    {perks.map((perk) => (
                      <li key={`yearly-${perk}`} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                        <span className="text-foreground">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </div>

              <div className="p-6 pt-0 mt-6">
                {subscribed ? (
                  <Button asChild variant="outline" className="w-full rounded-xl font-bold">
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="hero"
                    className="w-full rounded-xl font-bold shadow-lg shadow-primary/20"
                  >
                    <a href={checkoutHref} target="_blank" rel="noreferrer">
                      <CreditCard className="size-4 mr-2" />
                      Get Yearly ($119.99/yr)
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
