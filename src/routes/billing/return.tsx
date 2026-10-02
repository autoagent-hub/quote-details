import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Loader2,
  Calendar,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { verifyBillingReturn } from "@/lib/billing.functions";

interface ReturnSearch {
  plan?: string;
  membership_id?: string;
  customer_email?: string;
  sig?: string;
  ts?: number;
  uid?: string;
}

export const Route = createFileRoute("/billing/return")({
  validateSearch: (search: Record<string, unknown>): ReturnSearch => ({
    plan: typeof search.plan === "string" ? search.plan : "monthly",
    membership_id: typeof search.membership_id === "string" ? search.membership_id : undefined,
    customer_email: typeof search.customer_email === "string" ? search.customer_email : undefined,
    sig: typeof search.sig === "string" ? search.sig : undefined,
    ts: search.ts ? Number(search.ts) : undefined,
    uid: typeof search.uid === "string" ? search.uid : undefined,
  }),
  component: BillingReturnPage,
});

function BillingReturnPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const doVerify = useServerFn(verifyBillingReturn);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [result, setResult] = useState<{
    verified: boolean;
    plan: "monthly" | "yearly";
    nextBillingDateFormatted: string | null;
    message: string;
  } | null>(null);

  // 1. Check logged-in user
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setCurrentUser({ id: data.user.id, email: data.user.email || "" });
        } else {
          setCurrentUser(null);
        }
      } finally {
        setIsLoadingUser(false);
      }
    }
    void checkAuth();
  }, []);

  // 2. Perform server-side tamper-proof verification
  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await doVerify({
        data: {
          plan: search.plan,
          membershipId: search.membership_id,
          customerEmail: search.customer_email,
          sig: search.sig,
          ts: search.ts,
        },
      });

      setResult({
        verified: res.verified,
        plan: res.plan,
        nextBillingDateFormatted: res.nextBillingDateFormatted,
        message: res.message,
      });

      if (res.verified) {
        // Refresh all local subscription and profile states
        await queryClient.invalidateQueries({ queryKey: ["trial-state"] });
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
        await queryClient.invalidateQueries({ queryKey: ["upgrade-account"] });

        // Auto-navigate to dashboard after celebration
        setTimeout(() => {
          navigate({ to: "/dashboard", search: { payment: "success" } });
        }, 1800);
      }
    } catch (err) {
      setResult({
        verified: false,
        plan: (search.plan?.toLowerCase() === "yearly" ? "yearly" : "monthly") as
          "monthly" | "yearly",
        nextBillingDateFormatted: null,
        message: err instanceof Error ? err.message : "Verification request failed.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!isLoadingUser && currentUser) {
      void handleVerify();
    } else if (!isLoadingUser && !currentUser) {
      setIsVerifying(false);
    }
  }, [isLoadingUser, currentUser]);

  // Case A: User Not Logged In
  if (!isLoadingUser && !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/80 shadow-2xl p-6 sm:p-8 text-center space-y-6">
          <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20">
            <AlertCircle className="size-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Sign In to Activate Your Plan
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We received your purchase confirmation from Whop! Please sign in with your Detailr
              account so we can instantly link Pro access to your shop.
            </p>
          </div>
          <div className="space-y-2">
            <Button asChild variant="hero" className="w-full font-bold">
              <Link to="/login" search={{ redirect: window.location.href }}>
                Sign In to Detailr
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Case B: Verifying State
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/80 shadow-2xl p-6 sm:p-8 text-center space-y-6">
          <div className="relative size-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 animate-ping opacity-75" />
            <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/30 relative">
              <ShieldCheck className="size-8 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Communicating With Server...
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verifying cryptographic credentials and checking live Whop records to guarantee
              tamper-proof activation.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600">
            <Loader2 className="size-4 animate-spin" />
            <span>Securing account permissions...</span>
          </div>
        </Card>
      </div>
    );
  }

  // Case C: Successfully Verified!
  if (result?.verified) {
    const isYearly = result.plan === "yearly";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-emerald-500/40 bg-gradient-to-b from-card to-emerald-500/5 shadow-2xl p-6 sm:p-8 text-center space-y-6">
          <div className="size-16 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="size-9" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <Badge className="bg-emerald-600 text-white font-extrabold uppercase tracking-widest text-[10px] px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                <Sparkles className="size-3" /> PRO MEMBER ACTIVATED
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome to Detailr Pro!
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your payment has been cryptographically confirmed. Your account now has unlimited
              quote requests, custom vehicle rates, and Telegram notifications.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Activated Plan:</span>
              <span className="font-bold text-foreground">
                {isYearly ? "Annual Pass ($110.99 / 1 Year)" : "Monthly Pro ($9.99 / 30 Days)"}
              </span>
            </div>
            {result.nextBillingDateFormatted && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium flex items-center gap-1">
                  <Calendar className="size-3 opacity-70" /> Next Billing Date:
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {result.nextBillingDateFormatted}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Server Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-[11px]">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verified & Synchronized
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Button asChild variant="hero" className="w-full font-bold shadow-md">
              <Link to="/dashboard">
                <span>Go to Dashboard</span>
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Case D: Not Verified Yet (webhook delay or unauthenticated attempt)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/80 shadow-2xl p-6 sm:p-8 text-center space-y-6">
        <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20">
          <AlertCircle className="size-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Payment Verification Pending
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {result?.message ||
              "If you just completed payment on Whop, the webhook confirmation can take 5-10 seconds to arrive. Attack-prevention protects your shop by requiring verified payment receipts."}
          </p>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="hero"
            className="w-full font-bold"
            onClick={() => handleVerify()}
          >
            <RefreshCw className="size-4 mr-2" />
            Check Verification Again
          </Button>

          <Button asChild variant="outline" className="w-full text-xs font-bold">
            <Link to="/upgrade">Link Whop Email Manually</Link>
          </Button>

          <Button asChild variant="ghost" className="w-full text-xs text-muted-foreground">
            <Link to="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
