import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Lock,
  Mail,
  User,
  Activity,
  BookOpen,
  ChevronRight,
  X,
  Heart,
  HelpCircle,
  FileText,
  AlertCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { SeoHead } from "@/components/seo/SeoHead";
import { Footer } from "@/components/Footer";
import heroImage from "@/assets/hero-detailer.jpg";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { name: "google-site-verification", content: "KcgCWTCmUyxEVd1lRMq6xabTrWkbMo0rsUFleV8q2m0" },
      { title: "Detailr Online — Instant Quotes & Telegram Alerts for Mobile Detailers" },
      {
        name: "description",
        content:
          "Never lose a detailing lead while mid-wash. Detailr Online sends customers an instant price estimate and pings you on Telegram the second a quote lands.",
      },
      { property: "og:site_name", content: "Detailr" },
      {
        property: "og:title",
        content: "Detailr Online — Instant Quotes & Telegram Alerts for Mobile Detailers",
      },
      {
        property: "og:description",
        content:
          "Instant web quotes, real-time Telegram alerts, zero app installs. $9.99/month with a 7-day free trial on detailr.online.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://detailr.online/" },
      { property: "og:image", content: "https://detailr.online/og-image.jpg" },
      { property: "og:image:url", content: "https://detailr.online/og-image.jpg" },
      { property: "og:image:secure_url", content: "https://detailr.online/og-image.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Detailr Online — Instant Quotes & Telegram Alerts for Mobile Auto Detailers",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@detailronline" },
      { name: "twitter:creator", content: "@detailronline" },
      {
        name: "twitter:title",
        content: "Detailr Online — Instant Detailing Quotes & Real-Time Telegram Alerts",
      },
      {
        name: "twitter:description",
        content:
          "Convert mobile detailing inquiries on your website in seconds with automated quotes and instant Telegram alerts.",
      },
      { name: "twitter:image", content: "https://detailr.online/og-image.jpg" },
      { name: "twitter:image:src", content: "https://detailr.online/og-image.jpg" },
      { name: "twitter:image:alt", content: "Detailr Online Auto Detailing Quote Software" },
      { name: "itemprop:name", content: "Detailr" },
      {
        name: "itemprop:description",
        content: "Instant web quotes and real-time Telegram alerts for mobile auto detailers.",
      },
      { name: "itemprop:image", content: "https://detailr.online/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://detailr.online/" },
      { rel: "image_src", href: "https://detailr.online/og-image.jpg" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Detailr",
          alternateName: ["Detailr Online", "detailr.online"],
          url: "https://detailr.online/",
        }),
      },
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

const homepageFaqs = [
  {
    question: "What is Detailr and how does it help mobile auto detailers?",
    answer:
      "Detailr (detailr.online) is instant quote software built specifically for mobile car detailers. It allows customers to calculate instant detailing estimates directly on your website or social media bio link and alerts you instantly in Telegram with customer details and photos.",
    keywordsLink: "https://detailr.online/keywords.txt",
  },
  {
    question: "How do instant quotes work for car detailing packages?",
    answer:
      "Customers select their vehicle size (Sedan, SUV, Truck/Van), choose a detailing package (e.g. Express Clean, Full Interior & Exterior, Ceramic Coating), select add-ons (pet hair removal, stain extraction), and get an exact calculated price instantly.",
  },
  {
    question: "How fast do I receive lead alerts when a customer requests a quote?",
    answer:
      "Instantly! As soon as a customer submits a quote request, a Telegram notification lands on your phone in under 2 seconds with customer phone, vehicle specs, chosen services, estimate total, and vehicle photos.",
  },
  {
    question: "Does Detailr charge commission fees on my detailing jobs?",
    answer:
      "No! Detailr is a flat $9.99/month with zero commission fees and unlimited leads. You keep 100% of your earnings from all detailing jobs.",
  },
  {
    question: "How do I share my quote calculator with customers?",
    answer:
      "When you sign up, you receive a dedicated branded link (e.g. detailr.online/your-shop). You can place this link directly in your Instagram bio, Google Business Profile, Facebook page, or truck decals.",
  },
];

const faqJsonLd = {
  "@type": "FAQPage",
  mainEntity: homepageFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text:
        faq.answer +
        (faq.keywordsLink ? ` View our official SEO keyword index at ${faq.keywordsLink}.` : ""),
    },
  })),
};

function Landing() {
  // Interactive Calculator State
  const [vehicle, setVehicle] = useState<"sedan" | "suv" | "truck">("suv");
  const [tier, setTier] = useState<"express" | "full" | "ceramic">("full");
  const [petHair, setPetHair] = useState(true);
  const [headlights, setHeadlights] = useState(false);

  // Active document modal overlay
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactMessage("");
      setTimeout(() => setSubmitSuccess(false), 6000);
    }, 1200);
  };

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
      <SeoHead
        title="Detailr Online — Instant Quotes & Telegram Alerts for Mobile Detailers"
        description="Detailr Online (detailr.online) is the software built specifically for mobile auto detailers. Give customers instant car pricing estimates and receive new qualified leads in Telegram."
        canonicalUrl="https://detailr.online/"
        keywords={[
          "mobile auto detailing software",
          "car detailing quote calculator",
          "detailer instant estimate",
          "telegram lead alerts",
          "auto detailing crm",
          "ceramic coating price builder",
          "detailr online",
        ]}
        ogImage="https://detailr.online/og-image.jpg"
        additionalJsonLd={faqJsonLd}
      />

      {/* Floating Modern Header */}
      <header className="sticky top-3 z-50 px-4">
        <div className="mx-auto flex h-15 max-w-6xl items-center justify-between rounded-2xl border border-border/80 bg-background/85 px-4 shadow-lg shadow-black/5 backdrop-blur-md sm:px-6">
          <QuoteFlowLogo size="md" linkToHome />

          <nav className="hidden items-center gap-5 text-xs font-semibold text-muted-foreground lg:flex">
            <a href="#" className="transition-colors hover:text-foreground">
              Home
            </a>
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How It Works
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
            <Link to="/founder" className="transition-colors hover:text-foreground">
              About
            </Link>
            <a href="#contact" className="transition-colors hover:text-foreground">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild variant="hero" size="sm" className="shadow-xs text-xs font-bold px-3">
              <Link to="/signup">Get Started</Link>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7"
            >
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
                  className="h-12 px-6 text-base shadow-lift font-semibold transition-transform hover:scale-105"
                >
                  <Link to="/signup">
                    Get Started Free <ArrowRight className="size-4.5" />
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
            </motion.div>

            {/* Right Hero Showcase: Realistic Telegram Lead Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative lg:col-span-5"
            >
              <div className="relative rounded-3xl border border-border/80 bg-surface/90 p-4 shadow-2xl backdrop-blur-md sm:p-6">
                {/* Hero image peek */}
                <div className="relative mb-5 overflow-hidden rounded-2xl border border-border/60">
                  <img
                    src={heroImage}
                    alt="Mobile auto detailer polishing a car"
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full object-cover brightness-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs font-semibold text-white">
                    <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Real-Time Lead Engine Active</span>
                  </div>
                </div>

                {/* Animated Telegram Notification Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", delay: 0.5, bounce: 0.4 }}
                  className="mt-6 rounded-2xl border border-blue-500/30 bg-card p-4 shadow-xl ring-1 ring-blue-500/10"
                >
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
                    <Button
                      variant="hero"
                      size="sm"
                      className="h-9 text-xs font-semibold hover:scale-105 transition-transform"
                    >
                      <PhoneCall className="size-3.5" /> Call Customer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 border-border text-xs font-semibold hover:bg-surface"
                    >
                      <MessageSquare className="size-3.5" /> Text Customer
                    </Button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="border-y border-border/80 bg-surface/50 py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 sm:grid-cols-4 sm:gap-8 text-center">
          {[
            { value: "$240K+", label: "Quotes generated for detailers", color: "text-foreground" },
            { value: "< 20s", label: "Average time to customer quote", color: "text-emerald-600" },
            { value: "100%", label: "Direct profits kept (0% fee)", color: "text-primary" },
            { value: "3.2x", label: "Higher lead conversion rate", color: "text-foreground" },
          ].map((metric, i) => (
            <div key={i}>
              <p className={`font-display text-3xl font-bold sm:text-4xl ${metric.color}`}>
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground font-medium">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Special Feature Highlight: Our Trial System */}
      <section className="py-12 bg-primary/5 border-b border-border/60">
        <div className="mx-auto max-w-4xl px-5">
          <div className="rounded-3xl border border-primary/25 bg-card p-6 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="flex flex-col md:flex-row gap-6 md:items-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shrink-0">
                <Clock className="size-7" />
              </div>
              <div className="space-y-2">
                <span className="rounded-full bg-primary/15 px-3 py-0.5 text-[11px] font-bold text-primary uppercase tracking-wider">
                  Unusual Trial Guarantee
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  7-Day Trial — Activated When Your First Customer Visits
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Creating your Detailr account doesn't start your trial clock. Your 7-day free
                  trial countdown begins <strong className="text-foreground">only</strong> when a
                  real customer first visits your customized Detailr customer link. This gives you
                  absolute freedom to configure your services, set perfect rates, and connect
                  Telegram alerts without a single day of your trial being wasted.
                </p>
              </div>
            </div>
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
              <div key={f.title}>
                <Card className="group h-full border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
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
              </div>
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
            ].map((s, i) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-transform hover:-translate-y-1"
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
              <div key={t.name}>
                <Card className="h-full border-border/80 bg-card p-6 shadow-sm">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center mb-12 space-y-3">
            <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              Simple, Transparent Pricing
            </span>
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              100% Features Included. Choose Your Billing Term.
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Start with a 7-day free trial (starts only after your first customer visit). Zero
              commission fees on your detailing jobs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Monthly Plan Card */}
            <div>
              <Card className="h-full flex flex-col justify-between border-border/60 bg-card/50 p-6 sm:p-8 shadow-lg relative overflow-hidden transition-all duration-200 hover:border-border hover:bg-card/80 rounded-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        <Clock className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Monthly Membership</h3>
                        <p className="text-[11px] text-muted-foreground">
                          Month-to-month flexibility
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-md"
                    >
                      1 Month
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1 font-mono">
                      <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                        $9.99
                      </span>
                      <span className="text-xs font-sans font-medium text-muted-foreground">
                        / month
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Billed monthly · Cancel anytime with 1 click
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Included in Monthly Plan
                    </p>
                    <ul className="space-y-3 text-xs">
                      {[
                        "Unlimited instant customer quote requests",
                        "Real-time Telegram alerts sent to your phone",
                        "Customized vehicle rates & add-on pricing",
                        "Dedicated branded quote link (detailr.online/your-shop)",
                        "Full customer CRM with 1-tap call & SMS",
                        "Customer photo upload capabilities",
                        "Zero commission fees on your detailing jobs",
                      ].map((item) => (
                        <li key={`landing-monthly-${item}`} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald-500 font-bold" />
                          <span className="text-foreground leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8 mt-6 border-t border-border/40">
                  <Button
                    asChild
                    variant="outline"
                    size="xl"
                    className="w-full h-12 rounded-xl font-bold text-sm shadow-sm transition-all"
                  >
                    <Link to="/signup">Start 7-Day Trial — Monthly ($9.99/mo)</Link>
                  </Button>
                </div>
              </Card>
            </div>

            {/* Annual Plan Card (Featured) */}
            <div>
              <Card className="h-full flex flex-col justify-between border-primary bg-card p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-200 ring-2 ring-primary/30 rounded-2xl">
                {/* Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-amber-500" />

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                        <Sparkles className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Annual Membership</h3>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          Best Value · 12 Months Access
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                      Annual Pass
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                        $119.99
                      </span>
                      <span className="text-xs font-sans font-medium text-muted-foreground">
                        / year
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-sans text-[11px] font-bold ml-auto">
                        ~$10/mo equivalent
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Billed annually · Full 12 months uninterrupted access
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center gap-2.5">
                      <ShieldCheck className="size-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-bold text-foreground">
                        12-Month Price Guarantee & Locked-in Access
                      </span>
                    </div>

                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-1">
                      Included in Annual Plan
                    </p>
                    <ul className="space-y-3 text-xs">
                      {[
                        "Unlimited instant customer quote requests",
                        "Real-time Telegram alerts sent to your phone",
                        "Customized vehicle rates & add-on pricing",
                        "Dedicated branded quote link (detailr.online/your-shop)",
                        "Full customer CRM with 1-tap call & SMS",
                        "Customer photo upload capabilities",
                        "Zero commission fees on your detailing jobs",
                      ].map((item) => (
                        <li key={`landing-yearly-${item}`} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald-500 font-bold" />
                          <span className="text-foreground leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8 mt-6 border-t border-border/40">
                  <Button
                    asChild
                    variant="hero"
                    size="xl"
                    className="w-full h-12 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all"
                  >
                    <Link to="/signup">Start 7-Day Trial — Yearly ($119.99/yr)</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="border-t border-border/80 bg-surface/30 py-20">
        <div className="mx-auto max-w-4xl px-5">
          <div className="text-center mb-12">
            <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              Frequently Asked Questions
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need to Know About Detailr
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Learn how mobile detailers use instant quotes to capture more leads.
            </p>
          </div>

          <div className="space-y-4">
            {homepageFaqs.map((faq, idx) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs"
              >
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    ?
                  </span>
                  {faq.question}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground pl-8">
                  {faq.answer}
                </p>
                {faq.keywordsLink && (
                  <div className="mt-3 pl-8">
                    <a
                      href={faq.keywordsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Explore detailr.online SEO keywords index</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section: Introducing Nerochaze */}
      <section id="about" className="py-20 border-t border-border/70 bg-card">
        <div className="mx-auto max-w-4xl px-5 text-center space-y-6">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            Meet the Founder
          </span>
          <h2 className="text-3xl font-display font-extrabold text-foreground tracking-tight max-w-xl mx-auto">
            Designed & Developed by Nerochaze
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            "I built Detailr with one goal: to protect your detailing time. When you are busy
            working, Detailr handles your quotes and delivers leads instantly to your Telegram."
          </p>
          <div className="pt-2">
            <Button asChild variant="hero" size="sm" className="font-semibold shadow-lift">
              <Link to="/founder">
                Read Nerochaze's Full Story <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 border-t border-border/70 bg-surface/30">
        <div className="mx-auto max-w-3xl px-5">
          <div className="text-center mb-10">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              Have Questions?
            </span>
            <h2 className="mt-3 text-3xl font-display font-extrabold text-foreground">
              Get in Touch with Nerochaze
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send us a message and we'll get back to you directly within a few hours.
            </p>
          </div>

          <Card className="border-border bg-card p-6 sm:p-8 shadow-xl rounded-2xl">
            {submitSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Message Sent Successfully!</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Thank you for reaching out. Founder Nerochaze or our team will review your message
                  and reply to you via email within 4 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Your Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="(512) 555-0199"
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Tell Nerochaze what questions you have or features you would like to see in Detailr..."
                    className="w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="hero"
                  className="w-full h-11 font-bold text-sm shadow-lift"
                >
                  {isSubmitting ? "Sending..." : "Send Message to Nerochaze"}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </section>

      {/* Modern Redesigned Footer with Legal & Trust Pages */}
      <Footer />
    </div>
  );
}
