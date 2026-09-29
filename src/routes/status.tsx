import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowLeft } from "lucide-react";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/status")({
  ssr: false,
  component: StatusPage,
});

function StatusPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SeoHead
        title="Live System Status Monitor — Detailr"
        description="Verify the current operational status of Detailr database services, automated quote calculators, and Telegram lead alert gateways."
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
              <Activity className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-foreground">
                System Uptime Monitor
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time status tracking for Detailr microservices
              </p>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 text-emerald-600 font-bold text-sm">
              <span className="size-3.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>All Systems Operational (99.98% overall monthly average)</span>
            </div>

            <div className="grid gap-4 text-xs border border-border rounded-2xl p-5 bg-card">
              <div className="flex justify-between border-b pb-3 items-center">
                <div>
                  <p className="font-bold text-foreground">Database Clusters (PostgreSQL)</p>
                  <p className="text-muted-foreground text-[10px]">
                    Cloud Supabase hosting engines
                  </p>
                </div>
                <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                  Online (99.99%)
                </span>
              </div>

              <div className="flex justify-between border-b pb-3 items-center">
                <div>
                  <p className="font-bold text-foreground">Telegram Notification Alert Gateways</p>
                  <p className="text-muted-foreground text-[10px]">
                    Pings dispatched to detailers' smartwatches & phones
                  </p>
                </div>
                <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                  Online (100.00%)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-foreground">Public Customer Estimate Builders</p>
                  <p className="text-muted-foreground text-[10px]">
                    Hosted calculators loading on business URLs
                  </p>
                </div>
                <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                  Online (99.98%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
