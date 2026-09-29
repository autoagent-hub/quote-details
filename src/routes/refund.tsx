import { createFileRoute, Link } from "@tanstack/react-router";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/refund")({
  ssr: false,
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="Refund & Cancellation Policy — Detailr"
        description="Frictionless billing terms. No contracts. Learn about the risk-free 7-day trial and 14-day refund guarantee for Detailr."
      />

      {/* Header */}
      <header className="sticky top-3 z-50 px-4">
        <div className="mx-auto flex h-15 max-w-6xl items-center justify-between rounded-2xl border border-border/80 bg-background/85 px-4 shadow-lg shadow-black/5 backdrop-blur-md sm:px-6">
          <QuoteFlowLogo size="md" linkToHome />
          <Button asChild variant="outline" size="sm" className="gap-2 text-xs font-bold">
            <Link to="/">
              <ArrowLeft className="size-3.5" /> Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-16 px-5 max-w-3xl mx-auto w-full">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <RefreshCw className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-foreground">
                Refund & Cancellation Policy
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Effective: September 2026</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-5">
            <p>
              Nerochaze believes in absolute transparency and zero-stress contracts. Our refund and
              cancellation policy is designed to be fair, frictionless, and simple:
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">
              1. Activation-Triggered Free Trial
            </h2>
            <p>
              Your 7-day trial starts{" "}
              <strong className="text-foreground font-semibold">
                only when a real customer visits your link
              </strong>
              . If you sign up and take two weeks to set up, you lose zero trial days. This is our
              complete guarantee to give you pressure-free setup time.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">2. Frictionless Cancellation</h2>
            <p>
              You can cancel your subscription inside your Dashboard Billing hub at any time with a
              single click. There are no support tickets to raise, no phone numbers to call, and no
              exit surveys to fill out. Your link will remain active until the end of your billing
              cycle.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">
              3. Full 14-Day Refund Guarantee
            </h2>
            <p>
              If you are billed for any monthly or annual cycle and are unsatisfied with the leads
              or services, email Nerochaze within 14 days and we will issue a full, prompt refund.
              No questions asked.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
