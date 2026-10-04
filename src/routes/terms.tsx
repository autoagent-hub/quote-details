import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ArrowLeft } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  ssr: false,
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="Terms of Service — Detailr"
        description="Review the official Terms of Service for Detailr, automated quote and lead alerting software for mobile auto detailers."
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
              <FileText className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-foreground">
                Terms of Service
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Last updated: September 2026</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-5">
            <p>
              Welcome to Detailr (detailr.online). These Terms of Service ("Terms") govern your
              access to and use of the automated detailing estimate software created by founder{" "}
              <strong className="text-foreground">Nerochaze</strong>.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">1. Acceptance of Terms</h2>
            <p>
              By creating an account, accessing, or using the Detailr platform, you agree to be
              bound by these Terms and our Privacy Policy. If you do not agree, you must immediately
              terminate use of our services.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">
              2. Account Terms & Subdomains
            </h2>
            <p>
              To register, you must provide a valid email address and configure a detailing business
              profile. You are responsible for maintaining the confidentiality of your account
              password and all activities under your unique subdomain URL slug (e.g.,{" "}
              <code>detailr.online/your-shop</code>). Nerochaze reserves the right to reclaim any
              subdomains that violate trademarks or remain inactive for extended periods.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">
              3. Pricing, Billings & Payments
            </h2>
            <p>
              Detailr operates as a flat subscription service billed monthly ($12.99) or annually
              ($145). All transactions are processed securely via our payment gateways.{" "}
              <strong className="text-foreground">We charge 0% commission fees</strong> on any
              bookings, quotes, or jobs you secure through our system. You keep 100% of your
              earnings.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">4. Prohibited Actions</h2>
            <p>
              You may not reverse-engineer the automated pricing estimation system, scrape database
              schemas, deploy automated crawling bots, or send fraudulent Telegram notifications to
              administrators. Any attempts of system exploitation will result in instant account ban
              with no refunds.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">5. Intellectual Property</h2>
            <p>
              All software, source code, designs, branding, and algorithms of Detailr remain the
              exclusive property of founder <strong className="text-foreground">Nerochaze</strong>.
              Your subscription grants you a limited, non-transferable license to utilize the
              estimate tools for your active detailing business.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">
              6. Disclaimers & Limitation of Liability
            </h2>
            <p>
              The platform is provided "as is". Nerochaze does not guarantee any specific volume of
              business, leads, or revenue from sharing your Detailr link. The customer is solely
              responsible for verifying the accuracy of estimates calculated before completing
              client bookings.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
