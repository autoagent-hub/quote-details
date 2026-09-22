import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  HelpCircle,
  ArrowLeft,
  BookOpen,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  Send,
  Zap,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SkeletonDashboard } from "@/components/skeletons/SkeletonDashboard";
import { AppNavigation } from "@/components/dashboard/AppNavigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/components/dashboard/types";

export const Route = createFileRoute("/_authenticated/help")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Help & Documentation — Detailr Online" },
      {
        name: "description",
        content:
          "Guides, tutorials, FAQs, and support for your Detailr Online auto detailing quote system.",
      },
      { property: "og:title", content: "Help & Documentation — Detailr Online" },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      return userData.user;
    },
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-surface/50 pb-16 text-foreground font-sans">
      <AppNavigation profile={profile ?? null} activeTab="help" userEmail={user?.email} />

      <main className="mx-auto max-w-4xl space-y-8 px-4 sm:px-8 py-8">
        {/* Navigation Breadcrumb & Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
              <Link
                to="/dashboard"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="size-3.5" />
                <span>Dashboard</span>
              </Link>
              <span>/</span>
              <span className="text-foreground">Help Center</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <HelpCircle className="size-4" />
              </span>
              <span>Help Center & Documentation</span>
            </h1>
            <p className="text-xs font-medium text-muted-foreground max-w-2xl">
              Learn how to connect Telegram alerts, customize pricing formulas, share your quote
              link, and manage your detailing leads.
            </p>
          </div>
        </div>

        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Send className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Instant Telegram Setup</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect our Telegram bot to receive phone alerts within 1 second whenever a customer
              requests a quote.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full text-xs font-bold">
              <Link to="/notifications">Open Alerts Settings</Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Zap className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Dynamic Pricing Rules</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Configure vehicle size surcharges (Coupe, Sedan, SUV, Truck) and add-on services like
              ceramic coatings or pet hair.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full text-xs font-bold">
              <Link to="/pricing">Configure Pricing</Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <BookOpen className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Custom Shop Slug</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Share your dedicated business URL on your Instagram bio, Google Business profile, and
              customer texts.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full text-xs font-bold">
              <Link to="/profile">Edit Profile</Link>
            </Button>
          </div>
        </div>

        {/* Detailed FAQ Accordion */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground">Frequently Asked Questions</h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-sm font-semibold">
                How do customers use my quote calculator?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Customers visit your unique link (e.g. detailr.online/your-shop). They select their
                vehicle type, pick a base package, select optional add-ons, enter their vehicle
                year/make/model, and provide their contact details. The price is calculated
                instantly and submitted as a qualified lead directly to your dashboard and Telegram.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-sm font-semibold">
                How does the 7-day trial work?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Your 7-day full access trial doesn't start ticking until your first real customer
                visits your quote link. This gives you unlimited time to configure your prices,
                upload your logo, and test without pressure.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-sm font-semibold">
                Can customers upload photos of their car?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Yes! You can enable photo uploads in your Telegram Alerts settings. When enabled,
                customers can upload up to 5 photos of problem areas (paint scratches, pet hair,
                interior stains) which are immediately viewable in your dashboard and Telegram.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-sm font-semibold">
                How do I put the quote calculator on my website?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                You can link directly to your Detailr slug from any button on your website (e.g.,
                "Get an Instant Quote"), or embed it as an iframe directly into your existing
                WordPress, Squarespace, or Wix website.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
    </div>
  );
}
