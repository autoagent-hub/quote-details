import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/security")({
  ssr: false,
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="Security & Data Protection — Detailr"
        description="Learn about the enterprise-grade database encryption, secure hosting, and secure Telegram gateways configured on Detailr."
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
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-foreground">
                Security & Data
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Last Audited: September 2026</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-5">
            <p>
              Security is baked directly into Detailr's infrastructure. The platform is architected
              to enforce strict separation of duties, secure authentication protocols, and highly
              robust database routing:
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">1. Encryption of Data</h2>
            <p>
              All client traffic is routed through 256-bit SSL/TLS HTTPS encryption. Your password
              hashes are fully encrypted via Bcrypt algorithms before entering our secure databases.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">
              2. Subdomain & Route Separation
            </h2>
            <p>
              Every detailing shop operates inside its isolated Row-Level Security (RLS) partition
              within Supabase PostgreSQL. This guarantees no detailer can view, modify, or intercept
              the leads of another shop.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">3. Secure API Handling</h2>
            <p>
              Our Telegram notifications are dispatched via HTTPS POST requests using official,
              restricted Telegram Bot API tokens, shielding your chat alerts from sniffing or
              spoofing.
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">4. Storage Security</h2>
            <p>
              Uploaded customer photos (vehicle condition details) are stored in secure cloud
              buckets with limited-expiry signatures. These links cannot be brute-forced or accessed
              by non-authenticated third parties.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
