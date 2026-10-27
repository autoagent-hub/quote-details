import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/billing/return")({
  component: BillingReturnPage,
});

function BillingReturnPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ to: "/dashboard" });
    }, 1200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-5 text-center font-sans">
      <div className="space-y-4 max-w-md">
        <QuoteFlowLogo size="lg" linkToHome />
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-md space-y-3">
          <Loader2 className="size-8 animate-spin text-primary mx-auto" />
          <h1 className="text-lg font-bold text-foreground">Redirecting to Dashboard...</h1>
          <p className="text-xs text-muted-foreground">
            Subscription & billing sync is active. Taking you to your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
