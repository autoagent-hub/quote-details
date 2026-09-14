import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  MessageSquare,
  PhoneCall,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import heroImage from "@/assets/hero-detailer.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Detailr — Instant Quotes & Telegram Alerts for Mobile Detailers (detailr.online)" },
      {
        name: "description",
        content:
          "Never lose a detailing lead while mid-wash. Detailr (detailr.online) sends customers an instant price estimate and pings you on Telegram the second a quote lands.",
      },
      {
        property: "og:title",
        content: "Detailr — Instant Quotes & Telegram Alerts for Mobile Detailers (detailr.online)",
      },
      {
        property: "og:description",
        content:
          "Instant web quotes, real-time Telegram alerts, zero app installs. $9.99/month with a 7-day free trial on detailr.online.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Zap,
    title: "Instant Web Quotes",
    body: "Customers select vehicle size, condition, and services to get a real, customized price estimate in 20 seconds.",
    badge: "Fastest in Industry",
  },
  {
    icon: Send,
    title: "Real-Time Telegram Alerts",
    body: "Every request pings your phone with customer name, phone number, vehicle type, add-ons, and calculated total.",
    badge: "Under 3 Seconds",
  },
  {
    icon: Smartphone,
    title: "Zero App Install Required",
    body: "One clean web link for your Instagram bio, Google Maps, Yelp, Facebook page, or QR code on your detailing rig.",
    badge: "100% Mobile Ready",
  },
  {
    icon: PhoneCall,
    title: "1-Tap Call & Text",
    body: "Close the job directly from the Telegram notification. Tap to call or message the customer back with zero delay.",
    badge: "Higher Close Rate",
  },
  {
    icon: Sparkles,
    title: "Custom Pricing & Add-ons",
    body: "Set unique rates for sedans, SUVs, trucks, ceramic coatings, pet hair removal, stain extraction, and your custom packages.",
    badge: "Full Control",
  },
  {
    icon: ShieldCheck,
    title: "Flat $9.99/mo · 0% Commissions",
    body: "We never take a cut of your detailing jobs. Keep 100% of your earnings with unlimited quotes and leads.",
    badge: "Fair Pricing",
  },
];

const testimonials = [
  {
    quote:
      "I used to miss 3 or 4 leads every single Saturday because I was holding a pressure washer and couldn't pick up. With Detailr, customers get their price immediately and I call them back as soon as I finish the car. My booking rate skyrocketed.",
    name: "Marcus Taylor",
    company: "Apex Mobile Detailing",
    location: "Austin, TX",
    rating: 5,
  },
  {
    quote:
      "Having a dedicated link in my Instagram bio changed everything. Instead of 20 back-and-forth DMs asking 'how much for a Tahoe?', they configure their quote and I get a Telegram ping with their phone number ready to book.",
    name: "Devon Reed",
    company: "Pristine Auto Spa",
    location: "Phoenix, AZ",
    rating: 5,
  },
];

function Landing() {
  // Interactive Calculator State
  const [vehicle, setVehicle] = useState<"sedan" | "suv" | "truck">("suv");
  const [tier, setTier] = useState<"express" | "full" | "ceramic">("full");
  const [petHair, setPetHair] = useState(true);
  const [headlights, setHeadlights] = useState(false);

  // Price calculations for interactive demo
  const vehicleUplift = vehicle === "sedan" ? 0 : vehicle === "suv" ? 40 : 70;
  const basePrice = tier === "express" ? 110 : tier === "full" ? 210 : 450;
  const addonTotal = (petHair ? 40 : 0) + (headlights ? 50 : 0);
  const calculatedTotal = basePrice + vehicleUplift + addonTotal;

  const vehicleName =
    vehicle === "sedan"
      ? "Sedan / Coupe"
      : vehicle === "suv"
        ? "Mid-Size / Full SUV"
        : "Truck / Large Van";
  const tierName =
    tier === "express"
      ? "Express Wash & Vacuum"
      : tier === "full"
        ? "Full Signature Detail"
        : "Multi-Year Ceramic Coating";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Floating Modern Header */}
      <header className="sticky top-3 z-50 px-4">
        <div className="mx-auto flex h-15 max-w-6xl items-center justify-between rounded-2xl border border-border/80 bg-background/85 px-4 shadow-lg shadow-black/5 backdrop-blur-md sm:px-6">
          <QuoteFlowLogo size="md" linkToHome />

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#calculator" className="transition-colors hover:text-foreground">
              Interactive Demo
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How It Works
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="font-semibold text-muted-foreground hover:text-foreground"
            >
              <Link to="/login">Log In</Link>
            </Button>
            <Button asChild variant="hero" size="sm" className="shadow-xs font-semibold">
              <Link to="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 size-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Hero Copy */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" />
                <span>Exclusively Built for Mobile Auto Detailers</span>
              </div>

              <h1 className="mt-5 font-display text-4xl leading-[1.08] font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Never Lose a Detailing Lead While&nbsp;Mid-Wash.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Detailr turns your pricing into a smart, branded quote link (
                <span className="font-mono font-medium text-foreground">
                  detailr.online/your-business
                </span>
                ). Customers pick their vehicle, see real prices in 20 seconds, and your phone
                buzzes on Telegram the instant a lead comes in.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  variant="hero"
                  size="lg"
                  className="h-12 px-6 text-base shadow-lift font-semibold"
                >
                  <Link to="/signup">
                    Start 7-Day Free Trial <ArrowRight className="size-4.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 border-border/80 text-base font-semibold hover:bg-surface"
                >
                  <a href="#calculator">
                    <Zap className="size-4.5 text-primary" /> Test Live Pricing Demo
                  </a>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-500 font-bold" /> No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-500 font-bold" /> 3-minute quick setup
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-500 font-bold" /> Cancel anytime
                </span>
              </div>
            </div>

            {/* Right Hero Showcase: Realistic Telegram Lead Mockup */}
            <div className="relative lg:col-span-5">
              <div className="relative rounded-3xl border border-border/80 bg-surface/90 p-4 shadow-2xl backdrop-blur-md sm:p-6">
                {/* Hero image peek */}
                <div className="relative mb-5 overflow-hidden rounded-2xl border border-border/60">
                  <img
                    src={heroImage}
                    alt="Mobile auto detailer polishing a car"
                    className="aspect-video w-full object-cover brightness-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs font-semibold text-white">
                    <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Real-Time Lead Engine Active</span>
                  </div>
                </div>

                {/* Animated Telegram Notification Card */}
                <div className="rounded-2xl border border-blue-500/30 bg-card p-4 shadow-xl ring-1 ring-blue-500/10">
                  <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                        <Send className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground">Detailr Alerts</p>
                          <CheckCircle2 className="size-3 text-blue-500" />
                        </div>
                        <p className="text-[11px] text-muted-foreground">Telegram Bot · Just now</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
                      ⚡ HOT LEAD
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        🚗 2024 Ford Bronco (SUV)
                      </span>
                      <span className="font-display text-base font-bold text-emerald-600">
                        $290.00
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Package:</strong> Full Signature Detail &
                      Clay Bar
                    </p>
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Add-on:</strong> Pet Hair Removal ($40)
                    </p>
                    <div className="flex items-center justify-between rounded-lg bg-surface px-2.5 py-2 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">Tyler Mitchell</p>
                        <p className="text-muted-foreground">(512) 840-2194 · Oak Hill</p>
                      </div>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Mobile Client
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 grid grid-cols-2 gap-2">
                    <Button variant="hero" size="sm" className="h-9 text-xs font-semibold">
                      <PhoneCall className="size-3.5" /> Call Customer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 border-border text-xs font-semibold"
                    >
                      <MessageSquare className="size-3.5" /> Text Customer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="border-y border-border/80 bg-surface/50 py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 sm:grid-cols-4 sm:gap-8 text-center">
          <div>
            <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">$180K+</p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Quotes generated for detailers
            </p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-emerald-600 sm:text-4xl">&lt; 20s</p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Average time to customer quote
            </p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-primary sm:text-4xl">100%</p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Direct profits kept (0% fee)
            </p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">3.2x</p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Higher lead conversion rate
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Pricing Calculator Section */}
      <section id="calculator" className="py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              Live Product Experience
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
              See How Effortless It Is for Your Customers
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              Try the interactive estimator below. This is exactly what customers experience on your
              custom link.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl">
            <div className="border-b border-border/80 bg-surface/60 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Interactive Detailing Quote Simulator
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Detailer URL: detailr.online/apex-detailing
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-semibold text-emerald-600">
                    Calculations update dynamically
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-12">
              {/* Controls */}
              <div className="space-y-6 md:col-span-7">
                {/* 1. Vehicle Size */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    1. Select Vehicle Size
                  </label>
                  <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                    {[
                      { id: "sedan", label: "Sedan / Coupe", uplift: "+$0" },
                      { id: "suv", label: "SUV / Crossover", uplift: "+$40" },
                      { id: "truck", label: "Truck / Large", uplift: "+$70" },
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVehicle(v.id as typeof vehicle)}
                        className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                          vehicle === v.id
                            ? "border-primary bg-primary/10 text-foreground font-semibold shadow-xs ring-1 ring-primary"
                            : "border-border bg-surface text-muted-foreground hover:border-border/80 hover:text-foreground"
                        }`}
                      >
                        <span className="text-xs">{v.label}</span>
                        <span className="mt-1 text-[11px] text-muted-foreground">{v.uplift}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Service Tier */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    2. Select Detailing Package
                  </label>
                  <div className="mt-2.5 space-y-2">
                    {[
                      {
                        id: "express",
                        label: "Express Wash & Vacuum",
                        desc: "Exterior foam wash, wheel clean, interior vacuum",
                        price: "$110",
                      },
                      {
                        id: "full",
                        label: "Full Signature Detail",
                        desc: "Deep interior shampoo, leather scrub, machine wax & clay",
                        price: "$210",
                      },
                      {
                        id: "ceramic",
                        label: "Multi-Year Ceramic Coating",
                        desc: "Full paint correction + 3-year hydrophobic coating",
                        price: "$450",
                      },
                    ].map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setTier(t.id as typeof tier)}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                          tier === t.id
                            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                            : "border-border bg-surface hover:border-border/80"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-foreground">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.desc}</p>
                        </div>
                        <span className="font-display text-sm font-bold text-primary">
                          {t.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Add-ons */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    3. Common Detailing Add-ons
                  </label>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPetHair(!petHair)}
                      className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        petHair
                          ? "border-primary bg-primary/10 font-semibold ring-1 ring-primary"
                          : "border-border bg-surface text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="text-xs">Pet Hair Removal</span>
                      <span className="text-xs font-bold text-primary">+$40</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeadlights(!headlights)}
                      className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        headlights
                          ? "border-primary bg-primary/10 font-semibold ring-1 ring-primary"
                          : "border-border bg-surface text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="text-xs">Headlight Restoration</span>
                      <span className="text-xs font-bold text-primary">+$50</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Live Dynamic Summary & Simulated Alert */}
              <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-6 md:col-span-5">
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    Customer Price Preview
                  </p>

                  <div className="mt-4 space-y-2 border-b border-border/70 pb-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle:</span>
                      <span className="font-semibold text-foreground">{vehicleName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Package:</span>
                      <span className="font-semibold text-foreground">{tierName}</span>
                    </div>
                    {petHair && (
                      <div className="flex justify-between text-emerald-600">
                        <span>+ Pet Hair Extraction</span>
                        <span>$40</span>
                      </div>
                    )}
                    {headlights && (
                      <div className="flex justify-between text-emerald-600">
                        <span>+ Headlight Restoration</span>
                        <span>$50</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-foreground">Estimated Total:</span>
                    <span className="font-display text-3xl font-bold text-primary">
                      ${calculatedTotal}.00
                    </span>
                  </div>
                </div>

                {/* Simulated Telegram Notification */}
                <div className="mt-6 rounded-xl border border-blue-500/30 bg-card p-3.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Send className="size-3.5 text-blue-500" />
                    <span className="text-[11px] font-bold text-foreground">
                      What lands in your Telegram:
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    🚨 <strong className="text-foreground">New Quote:</strong> {vehicleName} ·{" "}
                    {tierName} · <strong className="text-emerald-600">${calculatedTotal}</strong>
                  </p>
                </div>

                <Button asChild variant="hero" size="lg" className="mt-6 shadow-lift font-semibold">
                  <Link to="/signup">
                    Claim Your Quote Link Now <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="border-t border-border/70 bg-surface/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              Built Specifically For Detailing
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need to Close Jobs Faster
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              Zero complex software. No apps for customers to download. Just instant quotes that
              close.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.title}
                className="group border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                    <f.icon className="size-5" />
                  </span>
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground border border-border/60">
                    {f.badge}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works in 3 Steps */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              Quick 3-Minute Setup
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
              From Sign-up to First Lead in Minutes
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Set Your Rates",
                body: "Enter your standard prices for Sedans, SUVs, and Trucks, plus any add-ons you offer like ceramic coatings or pet hair removal.",
              },
              {
                step: "02",
                title: "Share Your Link",
                body: "Put your dedicated link (detailr.online/your-business) in your Instagram bio, Google Business profile, and truck decals.",
              },
              {
                step: "03",
                title: "Close With 1 Tap",
                body: "The moment a customer submits, your Telegram alerts you with their name, phone, and vehicle details. Call them back in seconds.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
              >
                <span className="font-display text-4xl font-extrabold text-primary/30">
                  {s.step}
                </span>
                <h3 className="mt-3 text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border/80 bg-surface/50 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              Mobile Detailer Stories
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Loved by Detailers Across the US & UK
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/80 bg-card p-6 shadow-sm">
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-500" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground italic">"{t.quote}"</p>
                <div className="mt-6 border-t border-border/70 pt-4">
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.company} · {t.location}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-lg px-5">
          <div className="text-center mb-8">
            <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              Simple, Transparent Pricing
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
              One Flat Rate. Unlimited Leads.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No hidden fees, no tiers, no per-lead charges.
            </p>
          </div>

          <Card className="overflow-hidden border-border/80 shadow-2xl">
            <div className="bg-foreground p-8 text-background text-center relative overflow-hidden">
              <div className="pointer-events-none absolute -right-10 -bottom-10 size-40 rounded-full bg-primary/30 blur-2xl" />
              <p className="text-xs font-bold uppercase tracking-widest text-primary-glow">
                Everything Included
              </p>
              <div className="mt-4 flex items-baseline justify-center gap-1 font-display">
                <span className="text-6xl font-extrabold text-white">$9.99</span>
                <span className="text-base text-white/70">/ month</span>
              </div>
              <p className="mt-2 text-xs text-white/80">
                7-day 100% free trial · Cancel anytime with one click
              </p>
            </div>

            <CardContent className="p-8 space-y-6">
              <ul className="space-y-3.5 text-sm">
                {[
                  "Unlimited instant customer quote requests",
                  "Real-time Telegram alerts sent to your phone",
                  "Customized vehicle rates & add-on pricing",
                  "Dedicated branded quote link (e.g. detailr.online/your-shop)",
                  "Full customer CRM with 1-tap call & SMS",
                  "Customer photo upload capabilities",
                  "Zero commission fees on your detailing jobs",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4.5 shrink-0 text-primary font-bold" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant="hero"
                size="xl"
                className="shadow-lift font-semibold text-base"
              >
                <Link to="/signup">Start 7-Day Free Trial</Link>
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Modern Redesigned Footer */}
      <footer className="border-t border-border/80 bg-surface py-12 text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <QuoteFlowLogo size="md" linkToHome />

            <div className="flex flex-wrap items-center gap-6 text-xs">
              <a href="#features" className="hover:text-foreground">
                Features
              </a>
              <a href="#calculator" className="hover:text-foreground">
                Interactive Demo
              </a>
              <a href="#pricing" className="hover:text-foreground">
                Pricing
              </a>
              <Link to="/login" className="hover:text-foreground">
                Detailer Log In
              </Link>
              <Link to="/signup" className="hover:text-foreground">
                Start Free Trial
              </Link>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>All Systems Operational</span>
            </div>
          </div>

          <div className="mt-8 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Detailr (
              <a href="https://detailr.online" className="underline hover:text-foreground">
                detailr.online
              </a>
              ). Built specifically for mobile auto detailers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
