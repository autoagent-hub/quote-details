import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowLeft } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/changelog")({
  ssr: false,
  component: ChangelogPage,
});

function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="Product Changelog — Detailr"
        description="See the latest features and updates in Detailr. Follow the newest version launches, offline persistence, and Google One-Tap onboarding."
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
              <Sparkles className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-foreground">
                Product Changelog
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Live updates showing active development of the Detailr platform
              </p>
            </div>
          </div>

          <div className="space-y-8 mt-6">
            <div className="border-l-2 border-primary pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">
                  V1.4.0
                </span>
                <span className="text-xs text-muted-foreground">• September 2026</span>
              </div>
              <h4 className="text-base font-bold text-foreground">
                Google One-Tap Authenticator Integration
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Seamless Google authentication support added. Detailers can now sign up in under 5
                seconds with automatic workspace onboarding alerts dispatched via Telegram.
              </p>
            </div>

            <div className="border-l-2 border-primary/40 pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary/70 font-bold bg-primary/5 px-2 py-0.5 rounded">
                  V1.3.1
                </span>
                <span className="text-xs text-muted-foreground">• August 2026</span>
              </div>
              <h4 className="text-base font-bold text-foreground">
                Interactive Offline Form Persistence
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Added Service Workers and local indexed DB logic. Public customer quotes are
                preserved in client browser cache and automatically synced to the detailer once
                internet connection is restored.
              </p>
            </div>

            <div className="border-l-2 border-primary/20 pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary/40 font-bold bg-primary/5 px-2 py-0.5 rounded">
                  V1.2.0
                </span>
                <span className="text-xs text-muted-foreground">• July 2026</span>
              </div>
              <h4 className="text-base font-bold text-foreground">Telegram Direct-Call Webhooks</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Leads dispatched to your pocket now embed dynamic <code>tel:</code> and SMS links,
                allowing mobile auto detailers to tap once and dial the client immediately directly
                from Apple Watch or phone.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
