import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ArrowLeft, Send, Sparkles, Smartphone } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/docs")({
  ssr: false,
  component: DocsPage,
});

function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="Documentation & Setup Guides — Detailr"
        description="Learn how to configure your mobile auto detailing price sheets, set up Telegram bot notifications, and post your custom link."
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
              <BookOpen className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-foreground">
                Detailr Documentation
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Simple guides to get you booking detailing jobs instantly
              </p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-6">
            <p>
              Welcome to the official Detailr Documentation. This quick setup guide outlines how to
              configure your mobile detailing price sheets and connect our instant Telegram
              notification alerts.
            </p>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="size-5 text-primary" /> Step 1: Configure Your Base Prices
              </h3>
              <p>
                Once you create your account, navigate to your Dashboard settings. Here you can
                define your custom rates for Sedans, SUVs, and Trucks. You can also specify pricing
                for any detailing packages (e.g., Wash & Vac, Paint Correction) and individual
                add-ons like pet hair removal, stain extraction, or ceramic coatings.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Send className="size-5 text-primary" /> Step 2: Connect Telegram Bot for Alerts
              </h3>
              <p>
                To receive leads instantly on your phone or smartwatch, follow these easy steps:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-muted-foreground">
                <li>
                  Search for <code>@DetailrAlertsBot</code> inside your Telegram application.
                </li>
                <li>
                  Press the <strong>Start / Start Chat</strong> button.
                </li>
                <li>The bot will immediately respond with your unique numeric chat ID.</li>
                <li>
                  Copy and paste this chat ID directly into the Telegram Settings card in your
                  Detailer Portal.
                </li>
                <li>Click "Save Settings" and send a test ping to confirm everything is linked.</li>
              </ol>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Smartphone className="size-5 text-primary" /> Step 3: Publish Your Dedicated Link
              </h3>
              <p>
                Your unique calculator is active immediately on the web at{" "}
                <code>detailr.online/your-slug</code>. To maximize detailing leads, place this link
                inside your social profiles:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                <li>Google Business Profile (Website section)</li>
                <li>Instagram Profile Bio Link</li>
                <li>Facebook & TikTok profile descriptions</li>
                <li>Yelp, Nextdoor, or local classified listings</li>
                <li>QR codes printed on your wash truck, trailer, or decals</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
