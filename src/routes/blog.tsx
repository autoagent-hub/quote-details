import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ArrowLeft } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/blog")({
  ssr: false,
  component: BlogPage,
});

function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="Detailr Blog & Articles — Growth for Mobile Detailers"
        description="Learn strategies to double your mobile detailing bookings, optimize pricing packages, and leverage Google Maps SEO."
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
      <main className="flex-1 py-16 px-5 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center border-b border-border/60 pb-8 space-y-3">
            <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold border border-primary/20">
              Detailing Insights
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground tracking-tight">
              The Detailr Blog
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Practical guides and business tips written by founder Nerochaze to help mobile auto
              detailers increase margins and secure leads.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 pt-6">
            <Card className="p-6 border-border bg-card shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md">
                  BOOST CONVERSION
                </span>
                <h4 className="text-lg font-extrabold text-foreground leading-snug">
                  Why DMs are Killing Your Mobile Detailing Business
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When a client asks "how much for a wash?", back-and-forth messaging takes an
                  average of 45 minutes to convert. Automated quote calculators capture the
                  high-intent lead in under 20 seconds, increasing your bookings by 3x.
                </p>
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground pt-3 border-t">
                Written by Nerochaze • 5 min read
              </p>
            </Card>

            <Card className="p-6 border-border bg-card shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md">
                  PRICING GUIDES
                </span>
                <h4 className="text-lg font-extrabold text-foreground leading-snug">
                  How to Structure Vehicle size Uplifts Successfully
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Do not charge a flat rate for cars. Structuring base packages with automatic extra
                  fees for midsize SUVs ($40) and trucks ($70) protects your hourly margins and
                  prevents burnout.
                </p>
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground pt-3 border-t">
                Written by Nerochaze • 4 min read
              </p>
            </Card>

            <Card className="p-6 border-border bg-card shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md">
                  LOCAL SEO
                </span>
                <h4 className="text-lg font-extrabold text-foreground leading-snug">
                  Leveraging Google Maps Bio Links for More Leads
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your Google Business Profile is a goldmine. Learn how placing your Detailr slug
                  directly inside the primary 'Website' tab drives instant organic quote conversions
                  from maps searches.
                </p>
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground pt-3 border-t">
                Written by Nerochaze • 6 min read
              </p>
            </Card>

            <Card className="p-6 border-border bg-card shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md">
                  AUTOMATION
                </span>
                <h4 className="text-lg font-extrabold text-foreground leading-snug">
                  The Magic of Real-Time Telegram Alerts on the Job
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Why Telegram beats email? Uptime, velocity, and direct watch syncs. Discover how
                  real-time chat webhooks let you call clients back before they even close your
                  site.
                </p>
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground pt-3 border-t">
                Written by Nerochaze • 3 min read
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
