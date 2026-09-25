import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Car,
  Check,
  CheckCircle2,
  FlaskConical,
  X,
  AlertOctagon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, composePhone, defaultCountryForCurrency } from "@/lib/countries";
import { sendQuoteAlert } from "@/lib/telegram.functions";

import {
  calculateQuote,
  money,
  parsePackages,
  parseServices,
  parseVehicleCategories,
  type ServiceItem,
} from "@/lib/pricing";

const MAX_PHOTOS = 5;

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

type QuoteFormProps = {
  profile: PublicProfile;
  isTest?: boolean;
};

function StepLabel({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="text-lg font-bold text-foreground">
      <span className="text-primary mr-2">{step}.</span>
      {title}
    </h2>
  );
}

export function QuoteForm({ profile, isTest = false }: QuoteFormProps) {
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [vehicleDesc, setVehicleDesc] = useState("");
  const [packageKey, setPackageKey] = useState<string | null>(null);
  const [addons, setAddons] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryChoice, setCountryChoice] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };
  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const digitsOnly = phone.replace(/\D/g, "");
  const isNameValid = name.trim().length >= 2;
  const isPhoneValid = digitsOnly.length >= 7;

  const nameError = nameTouched && !isNameValid ? "Full name must be at least 2 characters." : null;

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
  const services = useMemo(
    () => parseServices(profile?.services).filter((s) => s.enabled),
    [profile],
  );

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

  const uploadAudio = async (detailerId: string): Promise<string | null> => {
    if (!audioBlob) return null;
    const path = `${detailerId}/${crypto.randomUUID()}.webm`;
    const { error } = await supabase.storage.from("quote-photos").upload(path, audioBlob, {
      contentType: "audio/webm",
      upsert: false,
    });
    return error ? null : path;
  };

  const ready = !!categoryKey && !!packageKey && !!name.trim() && !!phone.trim();

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!profile || !ready || !chosenPackage) return;
    setSubmitting(true);

    try {
      const photoPaths = photos.length ? await uploadPhotos(profile.id) : [];
      const audioPath = await uploadAudio(profile.id);

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
        // @ts-expect-error - Assuming audio_url exists in database schema
        audio_url: audioPath,
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
            const found = services.find((a) => a.key === key);
            return { label: found?.label ?? key, price: Number(found?.price) || 0 };
          }),
          estimate: quote.total,
          notes: notes.trim(),
          photoPaths,
          // @ts-expect-error - Adding audio to alert data
          audioPath,
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

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center px-6 text-center pt-10">
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
    <form onSubmit={submit} className="mx-auto max-w-md px-5 py-6 space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
          <span>Step {activeStep} of 4</span>
          <span className="font-mono text-primary font-bold">
            {Math.round((activeStep / 4) * 100)}% Completed
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
                onClick={() => setActiveStep(s.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2 transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : s.isDone
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
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
                <span className="truncate max-w-full">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="space-y-5"
          >
            <section>
              <StepLabel step={1} title="Select Your Vehicle" />
              <div className="mt-3 space-y-2.5">
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
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        active
                          ? "border-primary bg-accent shadow-card"
                          : "border-border bg-card hover:border-input"
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{c.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {c.sub}
                        </span>
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
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="vehicle_desc">Year, make & model (optional)</Label>
                <Input
                  id="vehicle_desc"
                  value={vehicleDesc}
                  onChange={(e) => setVehicleDesc(e.target.value)}
                  placeholder="e.g. 2024 Tesla Model Y"
                />
              </div>
            </section>

            <div className="pt-2">
              <Button
                type="button"
                onClick={() => {
                  if (!categoryKey && categories[0]) {
                    setCategoryKey(categories[0].key);
                  }
                  setActiveStep(2);
                }}
                className="w-full justify-between font-bold h-12 text-sm shadow-sm cursor-pointer"
              >
                <span>Continue to Packages</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {activeStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="space-y-6"
          >
            <section>
              <StepLabel step={2} title="Select Service Package" />
              {!packageKey && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0" />
                  Please select a package to calculate your instant estimate.
                </p>
              )}
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
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {p.sub}
                        </span>
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
              <StepLabel step={3} title="Optional Service Add-ons" />
              <div className="mt-3 space-y-2.5">
                {services.map((a) => {
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
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {a.sub}
                        </span>
                      </span>
                      <span className="font-display text-sm font-bold text-primary">
                        +{money(a.price, currency)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveStep(1)}
                className="gap-1 font-semibold h-12 cursor-pointer"
              >
                <ChevronLeft className="size-4" /> Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!packageKey && packages[0]) {
                    setPackageKey(packages[0].key);
                  }
                  setActiveStep(3);
                }}
                className="flex-1 justify-between font-bold h-12 text-sm shadow-sm cursor-pointer"
              >
                <span>Continue to Photos</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}

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
              <section>
                <StepLabel step={4} title="Vehicle Photos (Optional)" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Snap the messiest spots so the detailer gives you an accurate service quote. Up
                  to {MAX_PHOTOS}.
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
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-input bg-card text-muted-foreground hover:border-primary hover:text-primary transition-colors">
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
            ) : (
              <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
                <Camera className="size-8 mx-auto text-muted-foreground/60" />
                <h3 className="text-sm font-bold text-foreground">Photo Upload Skipped</h3>
                <p className="text-xs text-muted-foreground">
                  This detailing shop doesn't require photo uploads for estimates.
                </p>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveStep(2)}
                className="gap-1 font-semibold h-12 cursor-pointer"
              >
                <ChevronLeft className="size-4" /> Back
              </Button>
              <Button
                type="button"
                onClick={() => setActiveStep(4)}
                className="flex-1 justify-between font-bold h-12 text-sm shadow-sm cursor-pointer"
              >
                <span>Continue to Contact Info</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {activeStep === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="space-y-6"
          >
            <section>
              <StepLabel step={5} title="Your Calculated Estimate" />
              <div className="gradient-ink mt-3 rounded-xl p-5 text-primary-foreground shadow-card">
                <p className="text-xs tracking-widest uppercase opacity-70">Estimated total</p>
                <p className="mt-1 font-display text-4xl font-bold">
                  {money(quote.total, currency)}
                </p>
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
                    const a = services.find((item) => item.key === key);
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
              <StepLabel step={6} title="Where Should We Send Your Quote?" />
              <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-5 shadow-2xs">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Voice Message (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={isRecording ? stopRecording : startRecording}
                      className="relative"
                    >
                      {isRecording && (
                        <span className="absolute -left-1 -top-1 flex size-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full size-3 bg-red-500"></span>
                        </span>
                      )}
                      {isRecording ? "Stop Recording" : "Record Voice Message"}
                    </Button>
                    {audioBlob && (
                      <span className="text-xs text-emerald-600">Audio recorded!</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name" className="font-semibold">
                      Full Name *
                    </Label>
                    {nameTouched && (
                      <span
                        className={`text-[11px] font-bold flex items-center gap-1 ${isNameValid ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}
                      >
                        {isNameValid ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <AlertCircle className="size-3" />
                        )}
                        {isNameValid ? "Valid name" : "Required"}
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
                    placeholder="e.g. Sarah Williams"
                    autoComplete="name"
                    className={`transition-colors ${
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

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="font-semibold">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    required
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setPhoneTouched(true)}
                    placeholder="+1 (555) 000-0000"
                    autoComplete="tel"
                    className={
                      phoneTouched && !isPhoneValid
                        ? "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                        : ""
                    }
                  />
                  {phoneTouched && !isPhoneValid && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="size-3.5 shrink-0" />
                      Phone number must contain at least 7 digits.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <Button
              type="submit"
              disabled={!ready || submitting}
              className="w-full h-12 font-bold text-base shadow-lg cursor-pointer"
            >
              {submitting ? "Sending..." : "Submit Quote Request"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setActiveStep(3)}
              className="w-full gap-1 font-semibold h-12 cursor-pointer"
            >
              <ChevronLeft className="size-4" /> Back
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
