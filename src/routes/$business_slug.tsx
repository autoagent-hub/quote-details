import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Car,
  Check,
  CheckCircle2,
  FlaskConical,
  Loader2,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
  Phone,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Clock,
  MapPin,
  Truck,
  Layers,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { GlobalLoadingOverlay } from "@/components/GlobalLoadingOverlay";
import { SkeletonQuoteForm } from "@/components/skeletons/SkeletonQuoteForm";
import { SeoHead } from "@/components/seo/SeoHead";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, composePhone, defaultCountryForCurrency } from "@/lib/countries";
import { sendQuoteAlert } from "@/lib/telegram.functions";
import { recordPublicLinkVisit } from "@/lib/link-tracker.functions";
import { submitPublicQuote } from "@/lib/quote.functions";

import {
  calculateQuote,
  money,
  parsePackages,
  parseServices,
  parseVehicleCategories,
  type ServiceItem,
} from "@/lib/pricing";

type PublicProfile = {
  id: string;
  business_name: string;
  slug: string;
  tagline: string | null;
  phone: string | null;
  logo_url: string | null;
  currency: string | null;
  allow_photos: boolean | null;
  services: unknown;
  packages: unknown;
  vehicle_categories: unknown;
};

async function compressImage(file: File, maxSide = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSide || height > maxSide) {
        if (width > height) {
          height = Math.round((height * maxSide) / width);
          width = maxSide;
        } else {
          width = Math.round((width * maxSide) / height);
          height = maxSide;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export const Route = createFileRoute("/$business_slug")({
  validateSearch: (search: Record<string, unknown>): { test?: boolean } =>
    search["test"] === "1" || search["test"] === true ? { test: true } : {},
  loader: async ({ params }): Promise<PublicProfile | null> => {
    try {
      const slug = (params.business_slug || "").trim().toLowerCase();
      const { getAdminClient } = await import("@/lib/admin.server");
      const admin = getAdminClient();
      const client = admin ?? supabase;
      const { data, error } = await client.rpc("get_public_pricing", {
        _slug: slug,
      });
      if (!error && data && data.length > 0) {
        return (data[0] as PublicProfile) ?? null;
      }
      return null;
    } catch {
      return null;
    }
  },
  head: ({ params, loaderData }) => {
    const profile = loaderData as PublicProfile | null | undefined;
    const cleanName = params.business_slug
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const businessName = profile?.business_name?.trim() || cleanName;
    const canonicalUrl = `https://detailr.online/${params.business_slug}`;

    const rawLogo = profile?.logo_url?.trim();
    let shareImage = "https://detailr.online/logo.png";
    let isCustomLogo = false;

    if (rawLogo) {
      if (rawLogo.startsWith("http://") || rawLogo.startsWith("https://")) {
        shareImage = rawLogo;
        isCustomLogo = true;
      } else if (rawLogo.startsWith("/")) {
        shareImage = `https://detailr.online${rawLogo}`;
        isCustomLogo = true;
      } else {
        shareImage = `https://detailr.online/${rawLogo}`;
        isCustomLogo = true;
      }
    }

    const description = profile?.tagline?.trim()
      ? `${profile.tagline}. Instant auto detailing price quote from ${businessName}.`
      : `Get an instant auto detailing estimate from ${businessName}. Select your vehicle type, choose exterior or interior packages, and book online in seconds.`;

    return {
      meta: [
        { title: `${businessName} — Instant Auto Detailing Quote` },
        { name: "description", content: description },
        {
          name: "keywords",
          content: `${businessName}, mobile auto detailing quote, car detailing estimate, ceramic coating, paint correction, interior detail`,
        },
        { name: "robots", content: "index, follow" },
        { property: "og:site_name", content: businessName },
        { property: "og:title", content: `${businessName} — Instant Auto Detailing Quote` },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "website" },
        { property: "og:image", content: shareImage },
        { property: "og:image:url", content: shareImage },
        { property: "og:image:secure_url", content: shareImage },
        {
          property: "og:image:type",
          content: shareImage.endsWith(".png") ? "image/png" : "image/jpeg",
        },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        {
          property: "og:image:alt",
          content: isCustomLogo
            ? `${businessName} Logo`
            : `${businessName} — Instant Auto Detailing Quote`,
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${businessName} — Instant Auto Detailing Quote` },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: shareImage },
        {
          name: "twitter:image:alt",
          content: isCustomLogo ? `${businessName} Logo` : `${businessName} Auto Detailing Quote`,
        },
        { name: "itemprop:name", content: `${businessName} — Instant Auto Detailing Quote` },
        { name: "itemprop:description", content: description },
        { name: "itemprop:image", content: shareImage },
      ],
      links: [
        { rel: "canonical", href: canonicalUrl },
        { rel: "image_src", href: shareImage },
      ],
    };
  },
  component: QuoteForm,
});

const MAX_PHOTOS = 5;

function QuoteForm() {
  const { business_slug } = Route.useParams();
  const { test: isTest } = Route.useSearch();
  const initialProfile = Route.useLoaderData();
  const formTopRef = useRef<HTMLDivElement | null>(null);

  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [vehicleDesc, setVehicleDesc] = useState("");
  const [packageKey, setPackageKey] = useState<string | null>(null);
  const [addons, setAddons] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryChoice, setCountryChoice] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  const digitsOnly = phone.replace(/\D/g, "");
  const isNameValid = name.trim().length >= 2;
  const isPhoneValid = digitsOnly.length >= 7;

  const nameError =
    nameTouched && !isNameValid ? "Please enter your full name (at least 2 letters)." : null;
  const phoneError =
    phoneTouched && !isPhoneValid ? "Please enter a valid phone number (at least 7 digits)." : null;

  // Auto-scroll up slightly when step changes for frictionless mobile navigation
  const goToStep = (step: number) => {
    setActiveStep(step);
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Record link visit and activate 7-day trial on first customer visit
  useEffect(() => {
    let unmounted = false;
    recordPublicLinkVisit({
      data: {
        slug: business_slug,
        isTest: !!isTest,
      },
    })
      .then((res) => {
        if (unmounted) return;
        if (res.isSuspended) {
          setIsSuspended(true);
          setSuspensionReason(
            res.suspensionReason || "This shop quote link is currently inactive.",
          );
        }
      })
      .catch((err) => console.warn("[recordLinkVisit] error:", err));
    return () => {
      unmounted = true;
    };
  }, [business_slug, isTest]);

  const { data: profile = initialProfile, isLoading } = useQuery({
    queryKey: ["public-pricing", business_slug],
    initialData: initialProfile ?? undefined,
    queryFn: async (): Promise<PublicProfile | null> => {
      try {
        const slug = (business_slug || "").trim().toLowerCase();
        const { data, error } = await supabase.rpc("get_public_pricing", { _slug: slug });
        if (error) {
          console.warn("[get_public_pricing] rpc returned error:", error);
          return null;
        }
        return (data?.[0] as PublicProfile | undefined) ?? null;
      } catch (err) {
        console.warn("[get_public_pricing] exception caught:", err);
        return null;
      }
    },
  });

  const currency = profile?.currency || "USD";
  const businessName =
    profile?.business_name?.trim() ||
    business_slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const selectedCountry = useMemo(() => {
    const found = COUNTRIES.find((c) => c.code === countryChoice);
    return found ?? defaultCountryForCurrency(currency);
  }, [countryChoice, currency]);
  const fullPhone = composePhone(selectedCountry.dial, phone);

  const categories = useMemo(
    () => parseVehicleCategories(profile?.vehicle_categories).filter((c) => c.enabled),
    [profile],
  );
  const packages = useMemo(
    () => parsePackages(profile?.packages).filter((p) => p.enabled),
    [profile],
  );
  const services = useMemo(
    () => parseServices(profile?.services).filter((s) => s.enabled),
    [profile],
  );

  // Auto-default category and package on first load so user gets instant estimate immediately
  useEffect(() => {
    if (!categoryKey && categories.length > 0) {
      setCategoryKey(categories[0].key);
    }
  }, [categories, categoryKey]);

  useEffect(() => {
    if (!packageKey && packages.length > 0) {
      setPackageKey(packages[0].key);
    }
  }, [packages, packageKey]);

  const quote = useMemo(
    () =>
      calculateQuote({
        categories: parseVehicleCategories(profile?.vehicle_categories),
        packages: parsePackages(profile?.packages),
        addons: services,
        categoryKey,
        packageKey,
        selectedAddons: addons,
      }),
    [profile, services, categoryKey, packageKey, addons],
  );

  const chosenPackage: ServiceItem | undefined = packages.find((p) => p.key === packageKey);
  const chosenCategory = categories.find((c) => c.key === categoryKey);

  const toggleAddon = (key: string) =>
    setAddons((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const next = [...photos, ...Array.from(files)].slice(0, MAX_PHOTOS);
    setPhotos(next);
  };

  const prepareBase64Photos = async (): Promise<string[]> => {
    if (!photos.length) return [];
    const tasks = photos.map(async (file) => {
      try {
        const compressed = await compressImage(file, 1200, 0.8);
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(compressed);
        });
      } catch {
        return "";
      }
    });
    const results = await Promise.all(tasks);
    return results.filter((s) => s.length > 0);
  };

  // Automatic sync for offline quotes when network connection is restored
  useEffect(() => {
    const syncOfflineQuotes = async () => {
      try {
        const stored = localStorage.getItem("detailr_pending_quotes");
        if (!stored) return;
        const pending = JSON.parse(stored);
        if (!Array.isArray(pending) || pending.length === 0) return;

        toast.info("Syncing Offline Quotes...", { id: "offline-sync" });
        for (const item of pending) {
          const { error } = await supabase.from("quotes").insert(item);
          if (!error) {
            void sendQuoteAlert({
              data: {
                detailerId: item.detailer_id,
                customerName: item.customer_name,
                customerPhone: item.customer_phone,
                vehicle: item.vehicle_desc || item.vehicle_type,
                service: { label: item.service_label, price: item.service_price },
                addons: item.addons.map((k: string) => ({ label: k, price: 0 })),
                estimate: item.estimated_price,
                notes: item.notes + " (Submitted via Offline Sync)",
                photoPaths: [],
                isTest: item.is_test,
              },
            }).catch(() => undefined);
          }
        }
        localStorage.removeItem("detailr_pending_quotes");
        toast.success("Offline Quotes Submitted!", { id: "offline-sync" });
      } catch (err) {
        console.warn("Failed to sync offline quotes:", err);
      }
    };

    window.addEventListener("online", syncOfflineQuotes);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void syncOfflineQuotes();
    }
    return () => window.removeEventListener("online", syncOfflineQuotes);
  }, []);

  const ready = !!categoryKey && !!packageKey && isNameValid && isPhoneValid;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!profile || !chosenPackage) return;

    if (!isNameValid || !isPhoneValid) {
      setNameTouched(true);
      setPhoneTouched(true);
      goToStep(4);
      toast.error("Please provide your name and phone number to receive your quote.");
      return;
    }

    setSubmitting(true);

    // Offline mode save fallback
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const offlineLead = {
        detailer_id: profile.id,
        customer_name: name.trim(),
        customer_phone: fullPhone,
        vehicle_type: categoryKey!,
        vehicle_desc: vehicleDesc.trim(),
        service_key: chosenPackage.key,
        service_label: chosenPackage.label,
        service_price: quote.servicePrice,
        addons,
        notes: notes.trim(),
        currency,
        estimated_price: quote.total,
        is_test: !!isTest,
        created_at: new Date().toISOString(),
      };
      try {
        const existing = JSON.parse(localStorage.getItem("detailr_pending_quotes") || "[]");
        existing.push(offlineLead);
        localStorage.setItem("detailr_pending_quotes", JSON.stringify(existing));
        toast.success("Quote Saved Offline!", {
          description:
            "Your request is saved and will be sent automatically when you're back online.",
        });
        setDone(true);
      } catch {
        toast.error("Could not save offline quote");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      const photosBase64 = photos.length ? await prepareBase64Photos() : [];

      const result = await submitPublicQuote({
        data: {
          detailerId: profile.id,
          customerName: name.trim(),
          customerPhone: fullPhone,
          vehicleType: categoryKey!,
          vehicleDesc: vehicleDesc.trim(),
          serviceKey: chosenPackage.key,
          serviceLabel: chosenPackage.label,
          servicePrice: quote.servicePrice,
          addons,
          notes: notes.trim(),
          currency,
          estimatedPrice: quote.total,
          isTest: !!isTest,
        },
      });

      const quoteId = result?.quoteId;

      void sendQuoteAlert({
        data: {
          quoteId: quoteId || undefined,
          detailerId: profile.id,
          customerName: name.trim(),
          customerPhone: fullPhone,
          vehicle: vehicleDesc.trim()
            ? `${vehicleDesc.trim()} (${chosenCategory?.label ?? ""})`
            : (chosenCategory?.label ?? ""),
          service: { label: chosenPackage.label, price: quote.servicePrice },
          addons: addons.map((key) => {
            const found = services.find((a) => a.key === key);
            return { label: found?.label ?? key, price: Number(found?.price) || 0 };
          }),
          estimate: quote.total,
          notes: notes.trim(),
          photosBase64,
          isTest: !!isTest,
        },
      }).catch((err) => console.warn("[sendQuoteAlert] notice:", err));

      toast.success(
        isTest
          ? "Test request sent — check your Telegram alerts."
          : `Quote request sent to ${businessName}!`,
      );
      setDone(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your request");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && !initialProfile) {
    return <SkeletonQuoteForm />;
  }

  if (isSuspended) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <AlertCircle className="size-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {businessName} — Quote Link Inactive
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {suspensionReason ||
              "This shop quote form is currently inactive. Please contact the business directly or try again later."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <Button asChild variant="outline" size="lg" className="rounded-xl font-bold">
            <Link to="/">Visit Detailr</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
        <img
          src="/favicon.png"
          alt="Detailr"
          loading="lazy"
          decoding="async"
          className="size-12 rounded-xl object-contain shadow-xs"
        />
        <h1 className="text-xl font-bold">Quote form not found</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          No detailer uses the link <span className="font-medium">/{business_slug}</span> yet.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link to="/">Back to Detailr</Link>
        </Button>
      </div>
    );
  }

  // Confirmation / Success Screen
  if (done) {
    return (
      <div className="min-h-screen bg-surface/50 flex flex-col items-center justify-center p-4 sm:p-6 text-foreground font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-lg space-y-6"
        >
          {/* Top Shop Identity & Success Badge */}
          <div className="text-center space-y-3">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute -inset-2 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt={businessName}
                  className="relative size-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 bg-background"
                />
              ) : (
                <div className="relative size-20 rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-sky-500 text-white font-black text-2xl flex items-center justify-center border-2 border-emerald-500 shadow-xl shadow-emerald-500/20">
                  {businessName?.[0] || "D"}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 size-7 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-background shadow-md">
                <CheckCircle2 className="size-4" />
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Quote Request Received</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
                Request Sent to {businessName}!
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1.5 leading-relaxed">
                We've notified the team at{" "}
                <span className="font-semibold text-foreground">{businessName}</span>. A detailer
                will review your vehicle specs and reach out to{" "}
                <span className="font-semibold text-foreground">{fullPhone}</span> shortly.
              </p>
            </div>
          </div>

          {/* Itemized Estimate Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                  Estimated Total
                </p>
                <p className="text-3xl font-black text-foreground font-display mt-0.5">
                  {money(quote.total, currency)}
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                ✓ Quote Saved
              </span>
            </div>

            {/* Spec Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/20 text-muted-foreground">
                <span className="font-medium">Vehicle Specs</span>
                <span className="font-bold text-foreground">
                  {vehicleDesc.trim() || chosenCategory?.label || "Vehicle"} (
                  {chosenCategory?.label})
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/20 text-muted-foreground">
                <span className="font-medium">Selected Package</span>
                <span className="font-bold text-foreground">
                  {chosenPackage?.label} ({money(quote.servicePrice, currency)})
                </span>
              </div>

              {addons.length > 0 && (
                <div className="flex items-start justify-between py-1 border-b border-border/20 text-muted-foreground">
                  <span className="font-medium">Add-ons ({addons.length})</span>
                  <span className="font-bold text-foreground text-right max-w-[200px]">
                    {addons
                      .map((key) => services.find((a) => a.key === key)?.label || key)
                      .join(", ")}
                  </span>
                </div>
              )}

              {notes.trim() && (
                <div className="pt-1 text-muted-foreground">
                  <span className="font-medium block mb-1">Your Notes:</span>
                  <p className="text-[11px] bg-muted/40 p-2.5 rounded-xl border border-border/30 text-foreground italic">
                    "{notes.trim()}"
                  </p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground/80 text-center pt-2 italic">
              * Estimate calculated based on {businessName}&apos;s standard rates. Final price
              confirmed upon vehicle inspection.
            </p>
          </div>

          {/* Action Buttons for Customer (Call, Text, Submit Another) */}
          <div className="space-y-2.5">
            {profile.phone && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Button
                  asChild
                  variant="default"
                  size="lg"
                  className="w-full rounded-2xl h-12 font-bold text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  <a href={`tel:${profile.phone}`}>
                    <Phone className="size-4" />
                    <span>Call {businessName}</span>
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full rounded-2xl h-12 font-bold text-xs gap-2 border-border/80 hover:bg-surface"
                >
                  <a href={`sms:${profile.phone}`}>
                    <MessageSquare className="size-4 text-emerald-600" />
                    <span>Text {businessName}</span>
                  </a>
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="default"
              onClick={() => {
                setDone(false);
                goToStep(1);
              }}
              className="w-full rounded-2xl h-10 font-bold text-xs gap-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              <span>Submit Another Vehicle</span>
            </Button>
          </div>

          {/* Subtle Shop Footer Notice */}
          <div className="text-center pt-4 border-t border-border/30 text-[11px] text-muted-foreground/70">
            <span>{businessName} · Powered by Detailr Online · 100% Direct to Shop</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-36">
      <SeoHead
        title={`${businessName} — Instant Auto Detailing Quote`}
        description={
          profile.tagline?.trim()
            ? `${profile.tagline}. Instant car detailing price estimate builder.`
            : `Get an instant auto detailing estimate from ${businessName}. Choose packages, add vehicle photos, and book online in seconds.`
        }
        canonicalUrl={`https://detailr.online/${profile.slug}`}
        keywords={[
          businessName,
          "mobile auto detailing quote",
          "car detailing price calculator",
          "ceramic coating estimate",
          "interior detailing booking",
        ]}
        ogImage={profile.logo_url || "https://detailr.online/og-image.jpg"}
        businessDetails={{
          name: businessName,
          description: profile.tagline || undefined,
          url: `https://detailr.online/${profile.slug}`,
          phone: profile.phone || undefined,
          image: profile.logo_url || undefined,
          priceRange: "$$",
          servicesOffered: packages.map((p) => p.label),
        }}
      />

      {isTest && (
        <div className="bg-slate-900 text-white px-4 py-2.5 shadow-xs border-b border-amber-500/40 sticky top-0 z-40">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px]">
                <FlaskConical className="size-3" />
              </span>
              <div className="min-w-0">
                <span className="font-bold text-amber-300">Sandbox Preview Mode</span>
                <p className="text-[10px] text-slate-300 truncate">
                  Quotes sent here generate a sample lead marked [TEST].
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setName("Alex Morgan (Test Lead)");
                setPhone("5550192834");
                setVehicleDesc("2024 Tesla Model Y");
                if (categories.length > 1) {
                  setCategoryKey(categories[1].key);
                } else if (categories[0]) {
                  setCategoryKey(categories[0].key);
                }
                if (packages.length > 0) {
                  setPackageKey(packages[0].key);
                }
                setNotes("Testing quote request notification from Detailr.");
                toast.success(
                  "Sample car & customer details filled! Review estimate below and submit to test.",
                );
              }}
              className="rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 text-[11px] font-bold transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              Fill Sample Car
            </button>
          </div>
        </div>
      )}

      {/* Sticky Header with Shop Name and Contact */}
      <header className="border-b border-border/80 bg-background/95 px-4 sm:px-6 py-3.5 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt={`${businessName} logo`}
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                className="size-10 sm:size-11 shrink-0 rounded-xl border border-border object-contain bg-background shadow-xs"
              />
            ) : (
              <div className="size-10 sm:size-11 shrink-0 rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                {businessName?.[0] || "D"}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-base font-extrabold text-foreground">
                  {businessName}
                </span>
                <CheckCircle2 className="size-3.5 text-primary shrink-0" />
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {profile.tagline || "Professional Auto Detailing"}
              </p>
            </div>
          </div>

          {profile.phone && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1.5 text-xs font-bold rounded-xl border-border/80"
            >
              <a href={`tel:${profile.phone}`}>
                <Phone className="size-3 text-primary" />
                <span>Call Shop</span>
              </a>
            </Button>
          )}
        </div>
      </header>

      {/* Prominent Brand Hero Banner */}
      <div className="bg-gradient-to-b from-primary/5 via-background to-surface border-b border-border/60 py-6 px-5 sm:px-6">
        <div className="mx-auto max-w-lg space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-wider">
              <ShieldCheck className="size-3 text-primary" />
              Verified Detailing Shop
            </span>
            <span className="text-[11px] text-muted-foreground">· Fast Response</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Get an Instant Quote from {businessName}
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {profile.tagline ||
              `Customized auto detailing pricing built for your specific vehicle. Transparent pricing, no hidden fees, and zero obligation.`}
          </p>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-semibold text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-500 shrink-0" />
              <span>Instant Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-500 shrink-0" />
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-500 shrink-0" />
              <span>No Obligation</span>
            </div>
          </div>
        </div>
      </div>

      <div ref={formTopRef} />

      <form onSubmit={submit} className="mx-auto max-w-lg px-4 sm:px-6 py-6 space-y-6">
        {/* Visual Progress Stepper Header */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
            <span className="font-bold text-foreground">
              Step {activeStep} of 4:{" "}
              {activeStep === 1
                ? "Select Vehicle"
                : activeStep === 2
                  ? "Select Services"
                  : activeStep === 3
                    ? "Photos & Notes"
                    : "Review & Contact"}
            </span>
            <span className="font-mono text-primary font-bold">
              {Math.round((activeStep / 4) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={false}
              animate={{ width: `${(activeStep / 4) * 100}%` }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            />
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[11px] font-bold">
            {[
              { id: 1, label: "Vehicle", icon: Car, isDone: !!categoryKey },
              { id: 2, label: "Services", icon: Sparkles, isDone: !!packageKey },
              { id: 3, label: "Photos", icon: Camera, isDone: photos.length > 0 },
              { id: 4, label: "Contact", icon: User, isDone: isNameValid && isPhoneValid },
            ].map((s) => {
              const isActive = activeStep === s.id;
              const IconComp = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToStep(s.id)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2 transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                      : s.isDone
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                        : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {s.isDone && !isActive ? (
                      <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
                    ) : (
                      <IconComp className="size-3.5" />
                    )}
                  </div>
                  <span className="truncate max-w-full text-[10px]">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Animated Page Transitions for Steps */}
        <AnimatePresence mode="wait">
          {/* STEP 1: VEHICLE SELECTION */}
          {activeStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="space-y-5"
            >
              <section className="space-y-3">
                <StepLabel step={1} title={`Select Your Vehicle Type for ${businessName}`} />
                <p className="text-xs text-muted-foreground">
                  Choose the size that best matches your vehicle so {businessName} can calculate
                  exact labor and material rates.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {categories.map((c) => {
                    const active = categoryKey === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => {
                          setCategoryKey(c.key);
                        }}
                        aria-pressed={active}
                        className={`flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${
                          active
                            ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                            : "border-border/80 bg-card hover:border-border hover:bg-muted/20"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-foreground flex items-center gap-2">
                              <Car
                                className={`size-4 ${active ? "text-primary" : "text-muted-foreground"}`}
                              />
                              {c.label}
                            </span>
                            {active && (
                              <span className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <Check className="size-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground block leading-snug">
                            {c.sub || "Standard detailing category"}
                          </span>
                        </div>

                        <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-muted-foreground font-medium">
                            Rate adjustment:
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {c.uplift !== 0
                              ? `${c.uplift > 0 ? "+" : "−"}${money(Math.abs(c.uplift), currency)}`
                              : "Standard Base"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-border/80 bg-card p-4 space-y-2">
                  <Label htmlFor="vehicle_desc" className="text-xs font-bold text-foreground">
                    Vehicle Year, Make & Model (Optional)
                  </Label>
                  <Input
                    id="vehicle_desc"
                    value={vehicleDesc}
                    onChange={(e) => setVehicleDesc(e.target.value)}
                    placeholder="e.g. 2024 Tesla Model Y, 2022 Ford F-150"
                    className="h-11 rounded-xl text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Helps {businessName} prepare the right tools and specialty products for your
                    paint and trim.
                  </p>
                </div>
              </section>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    if (!categoryKey && categories[0]) {
                      setCategoryKey(categories[0].key);
                    }
                    goToStep(2);
                  }}
                  className="w-full justify-between font-bold h-12 text-sm shadow-md rounded-2xl cursor-pointer"
                >
                  <span>Continue to {businessName}&apos;s Packages</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PACKAGES & ADD-ONS */}
          {activeStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="space-y-6"
            >
              <section className="space-y-3">
                <StepLabel step={2} title={`${businessName}'s Detailing Packages`} />
                <p className="text-xs text-muted-foreground">
                  Select the level of care your vehicle needs. All packages are performed by{" "}
                  {businessName}.
                </p>

                <div className="space-y-3 mt-2">
                  {packages.map((p) => {
                    const active = packageKey === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPackageKey(p.key)}
                        aria-pressed={active}
                        className={`flex w-full cursor-pointer items-start justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                          active
                            ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                            : "border-border/80 bg-card hover:border-border hover:bg-muted/20"
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-extrabold text-foreground">
                              {p.label}
                            </span>
                            {active && (
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {p.sub || "Complete detailing treatment"}
                          </p>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                          <span className="font-mono text-base sm:text-lg font-black text-foreground">
                            {money(p.price, currency)}
                          </span>
                          {active ? (
                            <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center mt-2">
                              <Check className="size-3 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="size-5 rounded-full border border-border/80 mt-2" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Optional Service Add-ons */}
              {services.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-amber-500" />
                      Optional Add-ons & Upgrades
                    </h3>
                    <span className="text-[10px] text-muted-foreground">Select any that apply</span>
                  </div>

                  <div className="space-y-2.5">
                    {services.map((a) => {
                      const active = addons.includes(a.key);
                      return (
                        <label
                          key={a.key}
                          className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 transition-all ${
                            active
                              ? "border-primary bg-primary/5 shadow-xs"
                              : "border-border/80 bg-card hover:border-border"
                          }`}
                        >
                          <Checkbox checked={active} onCheckedChange={() => toggleAddon(a.key)} />
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-bold text-foreground">
                              {a.label}
                            </span>
                            {a.sub && (
                              <span className="block text-[11px] text-muted-foreground truncate">
                                {a.sub}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs font-bold text-primary shrink-0">
                            +{money(a.price, currency)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goToStep(1)}
                  className="gap-1 font-bold h-12 rounded-2xl cursor-pointer"
                >
                  <ChevronLeft className="size-4" /> Back
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!packageKey && packages[0]) {
                      setPackageKey(packages[0].key);
                    }
                    goToStep(3);
                  }}
                  className="flex-1 justify-between font-bold h-12 text-sm shadow-md rounded-2xl cursor-pointer"
                >
                  <span>Continue to Photos & Notes</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PHOTOS & NOTES */}
          {activeStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="space-y-6"
            >
              {profile.allow_photos !== false ? (
                <section className="space-y-3">
                  <StepLabel step={3} title={`Vehicle Photos for ${businessName} (Optional)`} />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Snap or upload photos of your vehicle (especially scratches, pet hair, or tough
                    spots). This helps {businessName} review condition and confirm your exact price
                    faster.
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-2.5">
                    {photos.map((file, i) => (
                      <div
                        key={`${file.name}-${i}`}
                        className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card shadow-xs"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Vehicle photo ${i + 1}`}
                          className="size-full object-cover"
                        />
                        <button
                          type="button"
                          aria-label="Remove photo"
                          onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1.5 right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground transition-colors shadow-sm"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    {photos.length < MAX_PHOTOS && (
                      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 text-muted-foreground hover:border-primary hover:text-primary transition-colors p-2 text-center">
                        <Camera className="size-5" />
                        <span className="text-[11px] font-bold">Add Photo</span>
                        <span className="text-[9px] opacity-70">Up to {MAX_PHOTOS}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => addPhotos(e.target.files)}
                        />
                      </label>
                    )}
                  </div>
                </section>
              ) : (
                <div className="rounded-2xl border border-border/80 bg-card p-6 text-center space-y-2">
                  <Camera className="size-8 mx-auto text-muted-foreground/60" />
                  <h3 className="text-sm font-bold text-foreground">Photos Not Required</h3>
                  <p className="text-xs text-muted-foreground">
                    {businessName} provides instant quotes without mandatory photo uploads.
                  </p>
                </div>
              )}

              {/* Special Instructions / Notes */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
                <Label htmlFor="notes" className="text-xs font-bold text-foreground">
                  Notes or Special Requests for {businessName} (Optional)
                </Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Heavy pet hair in back seat, water spot removal, parking in driveway..."
                  className="rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goToStep(2)}
                  className="gap-1 font-bold h-12 rounded-2xl cursor-pointer"
                >
                  <ChevronLeft className="size-4" /> Back
                </Button>
                <Button
                  type="button"
                  onClick={() => goToStep(4)}
                  className="flex-1 justify-between font-bold h-12 text-sm shadow-md rounded-2xl cursor-pointer"
                >
                  <span>Continue to Review & Contact</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: CONTACT & REVIEW */}
          {activeStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* Itemized Estimate Review Card */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Calculated Estimate Summary
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {businessName} Pricing
                  </span>
                </div>

                <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 space-y-3">
                  <div className="flex items-baseline justify-between border-b border-primary/10 pb-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Estimated Total
                    </span>
                    <span className="font-mono text-3xl font-black text-primary">
                      {money(quote.total, currency)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Vehicle:</span>
                      <span className="font-bold text-foreground">
                        {vehicleDesc.trim() || chosenCategory?.label || "Vehicle"} (
                        {chosenCategory?.label})
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Package:</span>
                      <span className="font-bold text-foreground">
                        {chosenPackage?.label} ({money(quote.servicePrice, currency)})
                      </span>
                    </div>

                    {addons.length > 0 && (
                      <div className="flex justify-between">
                        <span>Add-ons ({addons.length}):</span>
                        <span className="font-bold text-foreground text-right max-w-[220px]">
                          {addons
                            .map((key) => services.find((a) => a.key === key)?.label || key)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Contact Details Form with Real-Time Validation */}
              <section className="space-y-3">
                <StepLabel step={4} title={`Where Should ${businessName} Send Your Quote?`} />
                <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
                  {/* Name Input with Real-time Validation */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="name" className="text-xs font-bold text-foreground">
                        Full Name *
                      </Label>
                      {nameTouched && (
                        <span
                          className={`text-[11px] font-bold flex items-center gap-1 ${
                            isNameValid ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                          }`}
                        >
                          {isNameValid ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <AlertCircle className="size-3" />
                          )}
                          {isNameValid ? "Valid" : "Required"}
                        </span>
                      )}
                    </div>
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!nameTouched) setNameTouched(true);
                      }}
                      onBlur={() => setNameTouched(true)}
                      placeholder="e.g. Alex Morgan"
                      autoComplete="name"
                      className={`h-11 rounded-xl text-sm transition-colors ${
                        nameTouched
                          ? isNameValid
                            ? "border-emerald-500 focus-visible:ring-emerald-500 bg-emerald-50/10"
                            : "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                          : ""
                      }`}
                    />
                    {nameTouched && nameError && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="size-3.5 shrink-0" />
                        {nameError}
                      </p>
                    )}
                  </div>

                  {/* Phone Input with Real-time Validation */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phone" className="text-xs font-bold text-foreground">
                        Mobile Phone Number *
                      </Label>
                      {phoneTouched && (
                        <span
                          className={`text-[11px] font-bold flex items-center gap-1 ${
                            isPhoneValid ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                          }`}
                        >
                          {isPhoneValid ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <AlertCircle className="size-3" />
                          )}
                          {isPhoneValid ? "Valid number" : "Required"}
                        </span>
                      )}
                    </div>
                    <div className="flex w-full flex-wrap sm:flex-nowrap gap-2">
                      <Select value={selectedCountry.code} onValueChange={setCountryChoice}>
                        <SelectTrigger
                          className="w-full sm:w-[110px] h-11 rounded-xl shrink-0"
                          aria-label="Country code"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              <span className="mr-1">{c.flag}</span>
                              {c.dial}
                              <span className="ml-1 text-muted-foreground">{c.code}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        required
                        type="tel"
                        inputMode="tel"
                        className={`h-11 rounded-xl text-sm min-w-0 flex-1 transition-colors ${
                          phoneTouched
                            ? isPhoneValid
                              ? "border-emerald-500 focus-visible:ring-emerald-500 bg-emerald-50/10"
                              : "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                            : ""
                        }`}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (!phoneTouched) setPhoneTouched(true);
                        }}
                        onBlur={() => setPhoneTouched(true)}
                        placeholder="555 123 4567"
                        autoComplete="tel-national"
                      />
                    </div>
                    {phoneTouched && phoneError ? (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="size-3.5 shrink-0" />
                        {phoneError}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {businessName} will send your estimate details to {selectedCountry.dial}{" "}
                        {phone.trim() || "…"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground px-1">
                  <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                  <span>
                    <strong>Privacy Assurance:</strong> Your contact info is sent directly to{" "}
                    {businessName} for this estimate only. No spam, ever.
                  </span>
                </div>
              </section>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goToStep(3)}
                  className="gap-1 font-bold h-12 rounded-2xl cursor-pointer"
                >
                  <ChevronLeft className="size-4" /> Back
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={submitting}
                  className="flex-1 font-extrabold h-12 text-sm shadow-lg shadow-primary/20 rounded-2xl cursor-pointer"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Request Quote from {businessName}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Brand Seal */}
        <div className="pt-6 pb-8 flex flex-col items-center justify-center gap-1.5 text-center">
          <p className="text-xs font-bold text-foreground">
            Official Instant Quote Form for {businessName}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>Powered by Detailr Online</span>
            <span aria-hidden="true">·</span>
            <span>Direct to Shop</span>
          </div>
        </div>
      </form>

      {/* Full-Screen Loading Feedback on Quote Submission */}
      <GlobalLoadingOverlay
        isLoading={submitting}
        title="Sending Your Request"
        subtitle={`Connecting directly with ${businessName}...`}
        iconUrl={profile.logo_url || "/favicon.png"}
        steps={[
          "Calculating vehicle package estimate...",
          "Attaching customer notes and specifications...",
          `Alerting ${businessName} detailing team...`,
        ]}
      />

      {/* Floating Bottom Action Bar (Context-Aware for Each Step) */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border/80 bg-background/95 px-4 sm:px-6 py-3.5 backdrop-blur-md shadow-2xl z-40">
        <div className="mx-auto max-w-lg flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Estimated Total
            </span>
            <span className="font-mono text-2xl font-black text-foreground">
              {money(quote.total, currency)}
            </span>
          </div>

          <div className="flex-1 max-w-[260px] sm:max-w-[280px]">
            {activeStep === 1 && (
              <Button
                type="button"
                variant="hero"
                size="lg"
                onClick={() => {
                  if (!categoryKey && categories[0]) {
                    setCategoryKey(categories[0].key);
                  }
                  goToStep(2);
                }}
                className="w-full h-11 rounded-xl font-bold text-xs gap-1.5 shadow-md"
              >
                <span>Choose Packages</span>
                <ArrowRight className="size-3.5" />
              </Button>
            )}

            {activeStep === 2 && (
              <Button
                type="button"
                variant="hero"
                size="lg"
                onClick={() => {
                  if (!packageKey && packages[0]) {
                    setPackageKey(packages[0].key);
                  }
                  goToStep(3);
                }}
                className="w-full h-11 rounded-xl font-bold text-xs gap-1.5 shadow-md"
              >
                <span>Photos & Notes</span>
                <ArrowRight className="size-3.5" />
              </Button>
            )}

            {activeStep === 3 && (
              <Button
                type="button"
                variant="hero"
                size="lg"
                onClick={() => goToStep(4)}
                className="w-full h-11 rounded-xl font-bold text-xs gap-1.5 shadow-md"
              >
                <span>Review & Contact</span>
                <ArrowRight className="size-3.5" />
              </Button>
            )}

            {activeStep === 4 && (
              <Button
                type="button"
                variant="hero"
                size="lg"
                disabled={submitting}
                onClick={() => submit()}
                className="w-full h-11 rounded-xl font-extrabold text-xs shadow-md"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <span>Send to {businessName}</span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepLabel({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
        {step}
      </span>
      <h2 className="text-xs font-bold tracking-wider uppercase text-foreground">{title}</h2>
    </div>
  );
}
