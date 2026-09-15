import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  Car,
  Check,
  CheckCircle2,
  FlaskConical,
  Loader2,
  X,
  AlertOctagon,
} from "lucide-react";
import { toast } from "sonner";

import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { GlobalLoadingOverlay } from "@/components/GlobalLoadingOverlay";
import { SkeletonQuoteForm } from "@/components/skeletons/SkeletonQuoteForm";

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

export const Route = createFileRoute("/$business_slug")({
  validateSearch: (search: Record<string, unknown>): { test?: boolean } =>
    search["test"] === "1" || search["test"] === true ? { test: true } : {},
  loader: async ({ params }): Promise<PublicProfile | null> => {
    try {
      const { data, error } = await supabase.rpc("get_public_pricing", {
        _slug: params.business_slug,
      });
      if (!error && data && data.length > 0) {
        return (data[0] as PublicProfile) ?? null;
      }
      const { data: directData } = await supabase
        .from("profiles")
        .select(
          "id, business_name, slug, tagline, phone, logo_url, currency, allow_photos, services, packages, vehicle_categories",
        )
        .eq("slug", params.business_slug)
        .maybeSingle();
      return (directData as PublicProfile) ?? null;
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
    let shareImage = "https://detailr.online/og-image.jpg";
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
        { property: "og:site_name", content: "Detailr" },
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
            : `${businessName} — Instant Auto Detailing Quote on Detailr`,
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@detailronline" },
        { name: "twitter:title", content: `${businessName} — Instant Auto Detailing Quote` },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: shareImage },
        { name: "twitter:image:src", content: shareImage },
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
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [vehicleDesc, setVehicleDesc] = useState("");
  const [packageKey, setPackageKey] = useState<string | null>(null);
  const [addons, setAddons] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryChoice, setCountryChoice] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

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
        const { data, error } = await supabase.rpc("get_public_pricing", { _slug: business_slug });
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
  const addonList = useMemo(
    () => parseServices(profile?.services).filter((s) => s.enabled),
    [profile],
  );

  const quote = useMemo(
    () =>
      calculateQuote({
        categories: parseVehicleCategories(profile?.vehicle_categories),
        packages: parsePackages(profile?.packages),
        addons: addonList,
        categoryKey,
        packageKey,
        selectedAddons: addons,
      }),
    [profile, addonList, categoryKey, packageKey, addons],
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

  const uploadPhotos = async (detailerId: string): Promise<string[]> => {
    const paths: string[] = [];
    for (const file of photos) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${detailerId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("quote-photos").upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (!error) paths.push(path);
    }
    return paths;
  };

  const ready = !!categoryKey && !!packageKey && !!name.trim() && !!phone.trim();

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!profile || !ready || !chosenPackage) return;
    setSubmitting(true);
    try {
      const photoPaths = photos.length ? await uploadPhotos(profile.id) : [];

      const { error } = await supabase.from("quotes").insert({
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
        photo_urls: photoPaths,
        currency,
        estimated_price: quote.total,
        is_test: !!isTest,
      });
      if (error) throw error;

      void sendQuoteAlert({
        data: {
          detailerId: profile.id,
          customerName: name.trim(),
          customerPhone: fullPhone,
          vehicle: vehicleDesc.trim()
            ? `${vehicleDesc.trim()} (${chosenCategory?.label ?? ""})`
            : (chosenCategory?.label ?? ""),
          service: { label: chosenPackage.label, price: quote.servicePrice },
          addons: addons.map((key) => {
            const found = addonList.find((a) => a.key === key);
            return { label: found?.label ?? key, price: Number(found?.price) || 0 };
          }),
          estimate: quote.total,
          notes: notes.trim(),
          photoPaths,
          isTest: !!isTest,
        },
      }).catch(() => undefined);

      toast.success(
        isTest
          ? "Test request sent — check your alert notifications."
          : "Request sent! They'll reach out shortly.",
      );
      setDone(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your request");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <SkeletonQuoteForm />;
  }

  if (isSuspended) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-sm">
          <AlertOctagon className="size-7" />
        </div>
        <h1 className="text-xl font-bold">Shop Temporarily Inactive</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {suspensionReason ||
            "This quote form is temporarily inactive or undergoing administrative updates."}
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link to="/">Visit Detailr</Link>
        </Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
        <img
          src="/favicon.png"
          alt="Detailr"
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

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
        <span className="gradient-primary flex size-14 items-center justify-center rounded-2xl text-primary-foreground shadow-lift">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="mt-6 text-2xl font-bold">Request sent</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          {profile.business_name} just got an alert with your details and will text or call{" "}
          {fullPhone} shortly.
        </p>
        <div className="mt-6 w-full max-w-sm rounded-xl border border-border bg-card p-5 text-left shadow-card">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Your estimate
          </p>
          <p className="mt-1 font-display text-3xl font-bold">{money(quote.total, currency)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {chosenPackage?.label}
            {addons.length ? ` + ${addons.length} add-on${addons.length === 1 ? "" : "s"}` : ""} ·
            final price confirmed on inspection.
          </p>
        </div>
        {profile.phone ? (
          <Button asChild variant="outline" className="mt-5">
            <a href={`tel:${profile.phone}`}>Call {profile.business_name}</a>
          </Button>
        ) : null}
        <div className="mt-8">
          <QuoteFlowLogo
            size="xs"
            linkToHome
            className="text-muted-foreground hover:text-foreground opacity-85"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-32">
      {isTest && (
        <div className="bg-slate-900 text-white px-4 py-2.5 shadow-xs border-b border-amber-500/40 sticky top-0 z-40">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px]">
                <FlaskConical className="size-3" />
              </span>
              <div className="min-w-0">
                <span className="font-bold text-amber-300">Sandbox Test Mode</span>
                <p className="text-[10px] text-slate-300 truncate">
                  Quotes sent here generate a sample lead alert marked [TEST].
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
      <header className="border-b border-border/80 bg-background/90 px-5 py-4 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt={`${profile.business_name} logo`}
                referrerPolicy="no-referrer"
                className="size-11 shrink-0 rounded-xl border border-border object-contain bg-background shadow-xs"
              />
            ) : (
              <img
                src="/favicon.png"
                alt="Detailr"
                referrerPolicy="no-referrer"
                className="size-11 shrink-0 rounded-xl border border-border bg-background p-1.5 object-contain shadow-xs"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-base font-bold text-foreground">
                  {profile.business_name}
                </h1>
                <CheckCircle2 className="size-3.5 text-primary shrink-0" />
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {profile.tagline || "Instant mobile detailing estimate"}
              </p>
            </div>
          </div>

          {profile.phone && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1 text-xs font-semibold"
            >
              <a href={`tel:${profile.phone}`}>Call</a>
            </Button>
          )}
        </div>
      </header>

      <form onSubmit={submit} className="mx-auto max-w-md space-y-7 px-5 py-6">
        <section>
          <StepLabel step={1} title="Your vehicle" />
          <div className="mt-3 space-y-2.5">
            {categories.map((c) => {
              const active = categoryKey === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategoryKey(c.key)}
                  aria-pressed={active}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 text-left transition-all ${
                    active
                      ? "border-primary bg-accent shadow-card"
                      : "border-border bg-card hover:border-input"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{c.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{c.sub}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {c.uplift !== 0 && (
                      <span className="font-display text-sm font-bold text-muted-foreground">
                        {c.uplift > 0 ? "+" : "−"}
                        {money(Math.abs(c.uplift), currency)}
                      </span>
                    )}
                    {active && <Check className="size-4 text-primary" />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="vehicle_desc">Year, make & model (optional)</Label>
            <Input
              id="vehicle_desc"
              value={vehicleDesc}
              onChange={(e) => setVehicleDesc(e.target.value)}
              placeholder="2023 Mercedes GLE"
            />
          </div>
        </section>

        <section>
          <StepLabel step={2} title="Service" />
          <div className="mt-3 space-y-2.5">
            {packages.map((p) => {
              const active = packageKey === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPackageKey(p.key)}
                  aria-pressed={active}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 text-left transition-all ${
                    active
                      ? "border-primary bg-accent shadow-card"
                      : "border-border bg-card hover:border-input"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{p.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{p.sub}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-display text-base font-bold">
                      {money(p.price, currency)}
                    </span>
                    {active && <Check className="size-4 text-primary" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <StepLabel step={3} title="Add-ons" />
          <div className="mt-3 space-y-2.5">
            {addonList.map((a) => {
              const active = addons.includes(a.key);
              return (
                <label
                  key={a.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                    active
                      ? "border-primary bg-accent shadow-card"
                      : "border-border bg-card hover:border-input"
                  }`}
                >
                  <Checkbox checked={active} onCheckedChange={() => toggleAddon(a.key)} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{a.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{a.sub}</span>
                  </span>
                  <span className="font-display text-sm font-bold text-primary">
                    +{money(a.price, currency)}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {profile.allow_photos !== false && (
          <section>
            <StepLabel step={4} title="Photos (optional)" />
            <p className="mt-2 text-sm text-muted-foreground">
              Snap the messiest spots so the quote is accurate. Up to {MAX_PHOTOS}.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {photos.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="relative aspect-square overflow-hidden rounded-xl border border-border bg-card"
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
                    className="absolute top-1.5 right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full bg-foreground/80 text-background"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-input bg-card text-muted-foreground hover:border-primary hover:text-primary">
                  <Camera className="size-5" />
                  <span className="text-[11px] font-medium">Add photo</span>
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
        )}

        <section>
          <StepLabel step={5} title="Your estimate" />
          <div className="gradient-ink mt-3 rounded-xl p-5 text-primary-foreground shadow-card">
            <p className="text-xs tracking-widest uppercase opacity-70">Estimated total</p>
            <p className="mt-1 font-display text-4xl font-bold">{money(quote.total, currency)}</p>
            <div className="mt-3 space-y-1 text-xs opacity-80">
              {chosenPackage ? (
                <p>
                  {chosenPackage.label} ({chosenCategory?.label}) —{" "}
                  {money(quote.servicePrice, currency)}
                </p>
              ) : (
                <p>Pick a vehicle and service to see your price.</p>
              )}
              {addons.map((key) => {
                const a = addonList.find((item) => item.key === key);
                return (
                  <p key={key}>
                    {a?.label ?? key} — {money(Number(a?.price) || 0, currency)}
                  </p>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <StepLabel step={6} title="Where should we reach you?" />
          <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Williams"
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <div className="flex gap-2">
                <Select value={selectedCountry.code} onValueChange={setCountryChoice}>
                  <SelectTrigger className="w-[128px] shrink-0" aria-label="Country code">
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
                  className="flex-1"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555 123 4567"
                  autoComplete="tel-national"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll text or call you at {selectedCountry.dial} {phone.trim() || "…"}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dog hair in the back, kids spilled juice on the second row…"
              />
            </div>
          </div>
        </section>

        <div className="pt-2 pb-6 flex flex-col items-center justify-center gap-1">
          <QuoteFlowLogo
            size="xs"
            linkToHome
            className="text-muted-foreground hover:text-foreground opacity-80"
          />
          <span className="text-[10px] text-muted-foreground/80">
            Powered by Detailr · A Nerochaze Company
          </span>
        </div>
      </form>

      <GlobalLoadingOverlay
        isLoading={submitting}
        title="Processing Your Quote"
        subtitle={`Sending your request directly to ${profile.business_name}...`}
        iconUrl={profile.logo_url || "/favicon.png"}
        steps={[
          "Calculating vehicle modifiers...",
          "Applying selected service packages...",
          "Notifying shop team instantly...",
        ]}
      />

      <div className="fixed inset-x-0 bottom-0 border-t border-border/80 bg-background/95 px-5 py-3.5 backdrop-blur-md shadow-2xl z-40">
        <div className="mx-auto max-w-md">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Estimated Total
            </span>
            <span className="font-display text-2xl font-bold text-foreground">
              {money(quote.total, currency)}
            </span>
          </div>
          <Button
            variant="hero"
            size="xl"
            disabled={!ready || submitting}
            onClick={() => submit()}
            className="w-full shadow-lift font-bold"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Request Instant Quote
          </Button>
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            ✓ Free instant estimate · No payment required now
          </p>
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
