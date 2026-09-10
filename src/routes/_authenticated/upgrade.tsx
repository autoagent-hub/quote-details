import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, CreditCard, Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getUpgradeCheckout } from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({
    meta: [
      { title: "Upgrade to QuoteFlow Pro — $15/month" },
      {
        name: "description",
        content:
          "Move from your free QuoteFlow trial to the $15/month plan and keep unlimited quote requests and real-time Telegram alerts.",
      },
      { property: "og:title", content: "Upgrade to QuoteFlow Pro — $15/month" },
      {
        property: "og:description",
        content: "Unlimited quote requests, Telegram alerts and your branded quote link for $15/month.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Upgrade,
});

const perks = [
  "Unlimited quote requests",
  "Real-time Telegram alerts with photos",
  "Custom pricing per vehicle & add-on",
  "Your own branded quote link",
  "Full quote history",
];

const statusCopy: Record<string, { label: string; note: string }> = {
  TRIAL: { label: "Free trial", note: "You're on the trial. Upgrade any time to keep going." },
  SUBSCRIBED: { label: "Active", note: "You're on the paid plan — nothing else to do." },
  CANCELLED: { label: "Cancelled", note: "Your plan was cancelled. Resubscribe to switch it back on." },
  PAST_DUE: { label: "Payment failed", note: "The last payment didn't go through. Retry it below." },
};

function Upgrade() {
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
    queryKey: ["upgrade-checkout"],
    queryFn: () => fetchCheckout(),
  });

  const status = data?.status ?? "TRIAL";
  const copy = statusCopy[status] ?? {
    label: "Free trial",
    note: "You're on the trial. Upgrade any time to keep going.",
  };
  const subscribed = status === "SUBSCRIBED";
  const checkoutHref = checkout?.href ?? "";

  return (
    <div className="min-h-screen bg-surface pb-16">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
          <span className="flex items-center gap-2 font-display text-base font-bold">
            <span className="gradient-primary flex size-7 items-center justify-center rounded-lg text-primary-foreground">
              <Sparkles className="size-3.5" />
            </span>
            QuoteFlow
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card className="overflow-hidden shadow-card">
            <div className="gradient-ink px-7 py-8 text-primary-foreground">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-widest uppercase opacity-80">
                  QuoteFlow Pro
                </p>
                <Badge variant={subscribed ? "default" : "secondary"}>{copy.label}</Badge>
              </div>
              <p className="mt-3 font-display text-5xl font-bold">
                $15<span className="text-base font-medium opacity-70">/month</span>
              </p>
              <p className="mt-2 text-sm opacity-80">{copy.note}</p>
            </div>

            <CardHeader>
              <CardTitle className="text-base">What you keep</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3 text-sm">
                {perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              {subscribed ? (
                <Button asChild variant="outline" size="xl">
                  <Link to="/dashboard">Back to dashboard</Link>
                </Button>
              ) : checkoutHref ? (
                <Button asChild variant="hero" size="xl">
                  <a href={checkoutHref} target="_blank" rel="noreferrer">
                    <CreditCard className="size-4" />
                    {status === "PAST_DUE" ? "Retry payment" : "Upgrade for $15/month"}
                  </a>
                </Button>
              ) : (
                <p className="rounded-lg bg-accent px-4 py-3 text-sm text-accent-foreground">
                  Checkout isn't set up yet — add your Whop checkout link and this button goes live.
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Payment is handled securely by Whop. Your account switches over automatically the
                moment the payment clears.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
