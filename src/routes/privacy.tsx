import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, ArrowLeft } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/privacy")({
  ssr: false,
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="Privacy Policy — Detailr"
        description="Read the Privacy Policy of Detailr software. See how we collect, store, and protect your mobile auto detailing business data."
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
              <Shield className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-foreground">
                Privacy Policy
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Last updated: September 2026</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-5">
            <p>
              At Detailr, we take your detailing business data seriously. This Privacy Policy
              outlines what information we collect, founded and developed by{" "}
              <strong className="text-foreground">Nerochaze</strong>.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">1. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Your Business Profile:</strong> Your name, email address, password hashes,
                and business metadata (standard rates, vehicle uplifts, packages).
              </li>
              <li>
                <strong>Telegram Integration:</strong> Telegram chat IDs and configuration strings
                for live pings.
              </li>
              <li>
                <strong>Customer Leads:</strong> Customer names, phone numbers, vehicle size,
                selected add-ons, photos, and calculated estimate totals captured on your public
                quote sheets.
              </li>
            </ul>

            <h2 className="text-lg font-bold text-foreground pt-4">2. How We Use Data</h2>
            <p>
              We utilize your business details to build and render your public pricing calculator.
              We utilize captured customer leads strictly to compute estimate figures and
              immediately route the lead payloads straight to your phone. We do not sell, rent, or
              distribute your email databases or your clients' contact information to third parties.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">3. Data Storage & Security</h2>
            <p>
              All session databases and storage buckets are housed in secured cloud instances using
              enterprise-grade Row-Level Security (RLS) to ensure absolute separation between
              different detailer profiles. Sensitive credentials like token configurations are
              stored using modern hashing protocols.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">4. GDPR & CCPA Compliance</h2>
            <p>
              Under global data regulations, you retain full rights to request access to, edit, or
              delete your entire database records. If you decide to deactivate your subscription,
              you can contact Nerochaze at any time to request a complete wipe of all your
              historical leads and shop configurations.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
