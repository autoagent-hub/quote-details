import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, ArrowLeft } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { SeoHead } from "@/components/seo/SeoHead";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/testimonials")({
  ssr: false,
  component: TestimonialsPage,
});

function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="Testimonials — Detailr"
        description="See what verified mobile auto detailers in the US and UK say about using Detailr to capture instant pricing leads."
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
            <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-3 py-1 text-xs font-bold border border-amber-500/20">
              Detailer Feedback
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground tracking-tight">
              Verified Testimonials
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Discover how mobile detailers use automated customer pricing calculators to protect
              their working hours and boost conversion.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 pt-6">
            <Card className="p-6 border-border bg-card shadow-sm space-y-3">
              <div className="flex gap-1 text-amber-500">
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
              </div>
              <p className="text-sm italic leading-relaxed text-muted-foreground">
                "Being able to set my base prices for Sedans, SUVs, and Trucks separately while
                automatically adding fee uplifts for heavy mud or pet hair has completely saved me
                from underpricing my work. Detailr paid for itself on the first day."
              </p>
              <div className="border-t border-border/70 pt-3">
                <p className="text-xs font-bold text-foreground">James Cartwright</p>
                <p className="text-[10px] text-muted-foreground">Apex Polishing · Houston, TX</p>
              </div>
            </Card>

            <Card className="p-6 border-border bg-card shadow-sm space-y-3">
              <div className="flex gap-1 text-amber-500">
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
              </div>
              <p className="text-sm italic leading-relaxed text-muted-foreground">
                "I'm on the road 8 hours a day. Detailr's Telegram alerts deliver client phone
                numbers directly to my Apple Watch. I don't even have to look at my phone to know if
                the lead is worth it."
              </p>
              <div className="border-t border-border/70 pt-3">
                <p className="text-xs font-bold text-foreground">Sarah Jenkins</p>
                <p className="text-[10px] text-muted-foreground">Mobile Car Wash Pro · Miami, FL</p>
              </div>
            </Card>

            <Card className="p-6 border-border bg-card shadow-sm space-y-3">
              <div className="flex gap-1 text-amber-500">
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
              </div>
              <p className="text-sm italic leading-relaxed text-muted-foreground">
                "Before I shared my custom Detailr slug on Instagram, my Saturdays were wasted
                responding to 20 copy-pasted 'how much' DMs. Now customers configure their quote and
                I get a simple ping ready to schedule."
              </p>
              <div className="border-t border-border/70 pt-3">
                <p className="text-xs font-bold text-foreground">Marcus Taylor</p>
                <p className="text-[10px] text-muted-foreground">
                  Apex Mobile Detailing · Austin, TX
                </p>
              </div>
            </Card>

            <Card className="p-6 border-border bg-card shadow-sm space-y-3">
              <div className="flex gap-1 text-amber-500">
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
                <Star className="size-4 fill-amber-500" />
              </div>
              <p className="text-sm italic leading-relaxed text-muted-foreground">
                "We operate a high-volume unit and let me tell you: Detailr is robust. Customers
                load estimates in 20 seconds, and the instant alert router hasn't failed once in
                three months."
              </p>
              <div className="border-t border-border/70 pt-3">
                <p className="text-xs font-bold text-foreground">Devon Reed</p>
                <p className="text-[10px] text-muted-foreground">Pristine Auto Spa · Phoenix, AZ</p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
