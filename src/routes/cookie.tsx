import { createFileRoute, Link } from "@tanstack/react-router";
import { Info, ArrowLeft } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/cookie")({
  ssr: false,
  component: CookiePage,
});

function CookiePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="Cookie Policy — Detailr"
        description="Learn how Detailr uses local sessions and secure storage to handle client state with absolutely zero tracking cookies."
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
              <Info className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-foreground">
                Cookie Policy
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Last updated: September 2026</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-5">
            <p>
              Our cookie policy is short and sweet:{" "}
              <strong className="text-foreground">
                Zero tracking cookies. Zero marketing pixels. Zero sales trackers.
              </strong>
            </p>

            <h2 className="text-lg font-bold text-foreground pt-4">What we use cookies for:</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Authentication Session:</strong> We use securely stored local session
                storage and JSON Web Tokens (JWT) to remember who you are when you login to the
                detailer portal.
              </li>
              <li>
                <strong>Local Sync & Cache:</strong> We save active customer forms temporarily in
                your browser cache to allow offline lead persistence. If you lose network connection
                while building a quote, your data is preserved.
              </li>
            </ul>

            <p>
              By using Detailr, you consent to these functional cookies which are strictly required
              to keep your portal secure.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
