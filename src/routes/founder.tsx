import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ArrowLeft, Send, Sparkles, Code, Terminal, BadgeCheck } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/founder")({
  ssr: false,
  component: FounderPage,
});

function FounderPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="Meet the Founder — Nerochaze · Detailr"
        description="Learn the story of founder Nerochaze, and why they developed Detailr to automate quotes and Telegram alerts for mobile auto detailers."
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

      {/* Main Content */}
      <main className="flex-1 py-16 px-5 max-w-4xl mx-auto w-full">
        <div className="space-y-12">
          {/* Hero Segment */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
              <div className="relative size-44 rounded-full border-4 border-primary/20 bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white shadow-2xl mx-auto">
                <span className="font-display text-5xl font-extrabold tracking-wider">NC</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                Founder & Lead Architect
              </span>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground tracking-tight pt-2">
                Nerochaze
              </h1>
              <p className="text-sm text-muted-foreground">The builder behind detailr.online</p>
            </div>
          </div>

          {/* Letter from the Founder */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xl space-y-6 max-w-3xl mx-auto leading-relaxed text-sm text-muted-foreground">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> Behind the Code of Detailr
            </h3>
            <p>
              "I designed Detailr with a direct focus: to protect your valuable working hours. When
              you're holding a high-pressure washer, detailing a wheel arch, or applying a complex
              multi-year ceramic coating, you are in the zone. You cannot stop to take phone calls,
              send draft estimates over text, or bargain with customers.
            </p>
            <p>
              That’s why I built Detailr. It acts as your automated digital sales clerk. It gives
              customers exact, instant estimates configured to your custom rates, and directly drops
              qualified phone leads straight into your pocket on Telegram. Keep your hands on the
              car and let Detailr handle the bookings."
            </p>

            <div className="border-t border-border/70 pt-6 space-y-4">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Code className="size-4 text-primary" /> Core Development Philosophy
              </h4>
              <p className="text-xs">
                Every line of code within Detailr is optimized for maximum uptime, velocity, and
                ease of use. I believe utility software should be instant, simple to setup (taking
                under 3 minutes), and completely devoid of commissions or hidden fee structures.
                Flat $9.99/mo pricing, zero percent commissions, period.
              </p>
            </div>

            <div className="border-t border-border/70 pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Heart className="size-4 text-red-500 fill-red-500" /> Nerochaze, Creator
              </span>
              <span className="text-muted-foreground font-mono">Build ID: v1.4.0-Nerochaze</span>
            </div>
          </div>

          {/* Setup / Technical Callout */}
          <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto text-xs">
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <Terminal className="size-4 text-primary" /> Code Standards
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Detailr runs on a robust Next-Gen PostgreSQL structure with row-level segregation.
                This keeps client information completely private and ensures instant sub-second page
                loads.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <BadgeCheck className="size-4 text-primary" /> My Promise to You
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                I do not sell detailing databases or share customer lead metrics with any marketing
                syndicates. What you build here is yours, 100% confidential.
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
