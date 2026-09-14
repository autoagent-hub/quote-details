import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  FlaskConical,
  Image as ImageIcon,
  Link2,
  Loader2,
  LogOut,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import type { TablesUpdate } from "@/integrations/supabase/types";

import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { prepareTelegramLink, sendQuoteAlert } from "@/lib/telegram.functions";
import { getTrialState } from "@/lib/billing.functions";
import { Switch } from "@/components/ui/switch";
import {
  CURRENCIES,
  DEFAULT_PACKAGES,
  DEFAULT_SERVICES,
  DEFAULT_VEHICLE_CATEGORIES,
  TIMEZONES,
  addonLabel,
  formatWhen,
  money,
  parsePackages,
  parseServices,
  parseVehicleCategories,
  vehicleLabel,
  type ServiceItem,
  type VehicleCategory,
} from "@/lib/pricing";

const TELEGRAM_BOT = "QuoteFlowAlertsBot";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Detailer Dashboard — Detailr (detailr.online)" },
      {
        name: "description",
        content:
          "Set your detailing prices, vehicle categories, Telegram alerts and review incoming quote requests on Detailr.",
      },
      { property: "og:title", content: "Detailer Dashboard — Detailr (detailr.online)" },
      {
        property: "og:description",
        content: "Manage pricing, branding, Telegram alerts and quote history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

type Profile = {
  id: string;
  business_name: string;
  slug: string;
  tagline: string;
  phone: string;
  logo_url: string | null;
  currency: string;
  timezone: string;
  notify_telegram: boolean;
  notify_include_photos: boolean;
  notify_include_notes: boolean;
  allow_photos: boolean;
  telegram_chat_id: string | null;
  telegram_auth_code: string;
  services: unknown;
  packages: unknown;
  vehicle_categories: unknown;
  sedan_base: number;
  suv_base: number;
  truck_base: number;
};

type Quote = {
  id: string;
  customer_name: string;
  customer_phone: string;
  vehicle_type: string;
  vehicle_desc: string;
  service_label: string;
  service_price: number;
  addons: string[];
  estimated_price: number;
  notes: string;
  photo_urls: string[];
  currency: string;
  created_at: string;
  is_test: boolean;
};

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: quotes } = useQuery({
    queryKey: ["quotes", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Quote[];
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-16">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <QuoteFlowLogo size="md" linkToHome />
          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-border/80">
                <img
                  src={profile.logo_url || "/favicon.png"}
                  alt={profile.business_name}
                  className="size-7 rounded-lg border border-border object-contain bg-background p-0.5 shadow-xs"
                />
                <span className="text-xs font-semibold text-foreground max-w-[140px] truncate">
                  {profile.business_name}
                </span>
              </div>
            )}
            <Button asChild variant="outline" size="sm">
              <Link to="/upgrade">
                <CreditCard className="size-4" /> Upgrade
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-5 py-6">
        {profile ? (
          <>
            <div className="flex items-start gap-4">
              <img
                src={profile.logo_url || "/favicon.png"}
                alt={`${profile.business_name} profile`}
                className="size-14 shrink-0 rounded-2xl border border-border bg-background p-1 object-contain shadow-xs"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold truncate">{profile.business_name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <CheckCircle2 className="size-3" /> Live
                  </span>
                </div>
                <PublicLink slug={profile.slug} />
              </div>
            </div>

            <TrialBanner />

            <Tabs defaultValue="requests">
              <TabsList className="w-full overflow-x-auto">
                <TabsTrigger value="requests">Requests</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="mt-5">
                <QuoteHistory
                  quotes={quotes ?? []}
                  currency={profile.currency}
                  timezone={profile.timezone}
                  services={parseServices(profile.services)}
                  categories={parseVehicleCategories(profile.vehicle_categories)}
                />
              </TabsContent>

              <TabsContent value="account" className="mt-5 space-y-5">
                <BusinessProfileCard profile={profile} />
              </TabsContent>

              <TabsContent value="pricing" className="mt-5 space-y-5">
                <PricingCard profile={profile} />
              </TabsContent>

              <TabsContent value="alerts" className="mt-5 space-y-5">
                <TelegramCard
                  authCode={profile.telegram_auth_code}
                  chatId={profile.telegram_chat_id}
                />
                <NotificationSettingsCard profile={profile} />
              </TabsContent>

              <TabsContent value="testing" className="mt-5 space-y-5">
                <TestingCard profile={profile} />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Onboarding />
        )}
      </main>
    </div>
  );
}

function PublicLink({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/${slug}`;

  const handleCopy = () => {
    void navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Quote form link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-3 py-1.5 shadow-xs">
        <Link2 className="size-3.5 text-primary" />
        <span className="font-mono text-xs font-semibold text-foreground break-all">
          {origin ? `${origin.replace(/^https?:\/\//, "")}/${slug}` : `detailr.online/${slug}`}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs font-semibold"
        onClick={handleCopy}
      >
        {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        {copied ? "Copied!" : "Copy Link"}
      </Button>
      <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
        <Link to="/$business_slug" params={{ business_slug: slug }} search={{}}>
          <ExternalLink className="size-3.5" /> Preview Form
        </Link>
      </Button>
    </div>
  );
}

function useProfileUpdate(onDone: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesUpdate<"profiles"> & { id: string }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("profiles").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(onDone);
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

function BusinessProfileCard({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    business_name: profile.business_name,
    slug: profile.slug,
    tagline: profile.tagline ?? "",
    phone: profile.phone ?? "",
    logo_url: profile.logo_url ?? "",
    currency: profile.currency,
    timezone: profile.timezone,
  });
  const save = useProfileUpdate("Business profile saved");

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base">Business profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Profile Picture / Brand Avatar */}
        <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Profile Picture & Quote Logo
          </Label>
          <div className="flex flex-wrap items-center gap-4">
            <img
              src={form.logo_url || "/favicon.png"}
              alt="Logo preview"
              className="size-16 rounded-xl border border-border bg-background p-1.5 object-contain shadow-xs"
            />
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => setForm((f) => ({ ...f, logo_url: "/favicon.png" }))}
                >
                  Use Detailr Logo
                </Button>
                {form.logo_url && form.logo_url !== "/favicon.png" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setForm((f) => ({ ...f, logo_url: "" }))}
                  >
                    Reset to Default
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                This image appears on your dashboard, public customer quote pages, and Telegram
                alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="business_name">Business name</Label>
            <Input
              id="business_name"
              value={form.business_name}
              onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Public link</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
            />
            <p className="text-xs text-muted-foreground">/{form.slug || "your-link"}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Business phone</Label>
            <Input
              id="phone"
              value={form.phone}
              inputMode="tel"
              placeholder="+1 555 010 2020"
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="logo_url">Custom Logo / Image URL</Label>
            <Input
              id="logo_url"
              value={form.logo_url}
              placeholder="https://... or /favicon.png"
              onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tagline">Tagline</Label>
          <Textarea
            id="tagline"
            rows={2}
            value={form.tagline}
            placeholder="Showroom shine, at your driveway."
            onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Time zone</Label>
            <Select
              value={form.timezone}
              onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Time zone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          variant="hero"
          size="lg"
          disabled={save.isPending || !form.business_name.trim() || !form.slug}
          onClick={() =>
            save.mutate({
              id: profile.id,
              business_name: form.business_name.trim(),
              slug: form.slug,
              tagline: form.tagline.trim(),
              phone: form.phone.trim(),
              logo_url: form.logo_url.trim() || null,
              currency: form.currency,
              timezone: form.timezone,
            })
          }
        >
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Save profile
        </Button>
      </CardContent>
    </Card>
  );
}

type BaseRow = { key: string; label: string; sub: string; enabled: boolean };

function makeKey(label: string, taken: string[]): string {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "custom";
  let key = base;
  let n = 2;
  while (taken.includes(key)) key = `${base}_${n++}`;
  return key;
}

/** Editable list of items with a numeric field (price or uplift). */
function EditableRows<F extends string, T extends BaseRow & Record<F, number>>({
  items,
  field,
  unitLabel,
  currency,
  lockedKeys,
  onChange,
}: {
  items: T[];
  field: F;
  unitLabel: string;
  currency: string;
  lockedKeys: string[];
  onChange: (next: T[]) => void;
}) {
  const patch = (i: number, changes: Record<string, unknown>) =>
    onChange(items.map((item, idx) => (idx === i ? ({ ...item, ...changes } as T) : item)));

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {items.map((s, i) => (
        <div key={s.key} className={`space-y-2 p-3.5 ${s.enabled ? "" : "opacity-55"}`}>
          <div className="flex items-center gap-3">
            <Switch
              checked={s.enabled}
              aria-label={`Offer ${s.label}`}
              onCheckedChange={(checked) => patch(i, { enabled: checked })}
            />
            <Input
              aria-label={`${s.label} name`}
              className="h-9 min-w-0 flex-1 font-semibold"
              value={s.label}
              onChange={(e) => patch(i, { label: e.target.value })}
            />
            {lockedKeys.includes(s.key) ? null : (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${s.label}`}
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              aria-label={`${s.label} description`}
              placeholder="Short description customers will see"
              className="h-9 min-w-0 flex-1 text-xs"
              value={s.sub}
              onChange={(e) => patch(i, { sub: e.target.value })}
            />
            <span className="flex shrink-0 items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{unitLabel}</span>
              <Input
                type="number"
                step={1}
                inputMode="numeric"
                aria-label={`${s.label} ${unitLabel} in ${currency}`}
                className="h-9 w-24"
                value={String(s[field])}
                onChange={(e) =>
                  patch(i, { [field]: Number(e.target.value) || 0 } as Record<F, number>)
                }
              />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AddRowForm({
  unitLabel,
  onAdd,
}: {
  unitLabel: string;
  onAdd: (row: { label: string; sub: string; amount: number }) => void;
}) {
  const [label, setLabel] = useState("");
  const [sub, setSub] = useState("");
  const [amount, setAmount] = useState("0");

  const submit = () => {
    if (!label.trim()) {
      toast.error("Give it a name first");
      return;
    }
    onAdd({ label: label.trim(), sub: sub.trim(), amount: Number(amount) || 0 });
    setLabel("");
    setSub("");
    setAmount("0");
  };

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-border p-3.5">
      <div className="flex gap-2">
        <Input
          aria-label="New item name"
          placeholder="Name (e.g. Boat / Jet Ski)"
          className="h-9 min-w-0 flex-1"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Input
          type="number"
          step={1}
          inputMode="numeric"
          aria-label={`New item ${unitLabel}`}
          className="h-9 w-24"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Input
          aria-label="New item description"
          placeholder="Short description (optional)"
          className="h-9 min-w-0 flex-1 text-xs"
          value={sub}
          onChange={(e) => setSub(e.target.value)}
        />
        <Button variant="outline" size="sm" className="shrink-0" onClick={submit}>
          <Plus className="size-4" /> Add
        </Button>
      </div>
    </div>
  );
}

function PricingCard({ profile }: { profile: Profile }) {
  const [packages, setPackages] = useState<ServiceItem[]>(() => parsePackages(profile.packages));
  const [addons, setAddons] = useState<ServiceItem[]>(() => parseServices(profile.services));
  const [categories, setCategories] = useState<VehicleCategory[]>(() =>
    parseVehicleCategories(profile.vehicle_categories),
  );
  const save = useProfileUpdate("Pricing saved");

  const lockedPackages = DEFAULT_PACKAGES.map((p) => p.key);
  const lockedAddons = DEFAULT_SERVICES.map((s) => s.key);
  const lockedCategories = DEFAULT_VEHICLE_CATEGORIES.map((c) => c.key);

  return (
    <>
      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Vehicle categories</CardTitle>
          <Badge variant="secondary">{categories.filter((c) => c.enabled).length} live</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The uplift is added to the selected service price. Use a negative number to discount.
          </p>
          <EditableRows
            items={categories}
            field="uplift"
            unitLabel="uplift"
            currency={profile.currency}
            lockedKeys={lockedCategories}
            onChange={setCategories}
          />
          <AddRowForm
            unitLabel="uplift"
            onAdd={({ label, sub, amount }) =>
              setCategories((prev) => [
                ...prev,
                {
                  key: makeKey(
                    label,
                    prev.map((p) => p.key),
                  ),
                  label,
                  sub,
                  uplift: amount,
                  enabled: true,
                },
              ])
            }
          />
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Service packages</CardTitle>
          <Badge variant="secondary">{packages.filter((p) => p.enabled).length} live</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The main job the customer books. Prices are in {profile.currency}.
          </p>
          <EditableRows
            items={packages}
            field="price"
            unitLabel="price"
            currency={profile.currency}
            lockedKeys={lockedPackages}
            onChange={setPackages}
          />
          <AddRowForm
            unitLabel="price"
            onAdd={({ label, sub, amount }) =>
              setPackages((prev) => [
                ...prev,
                {
                  key: makeKey(
                    label,
                    prev.map((p) => p.key),
                  ),
                  label,
                  sub,
                  price: amount,
                  enabled: true,
                },
              ])
            }
          />
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Add-ons</CardTitle>
          <Badge variant="secondary">{addons.filter((a) => a.enabled).length} live</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Every common add-on is preloaded. Rename, adjust the rate, switch off anything you don't
            offer, or add your own below.
          </p>
          <EditableRows
            items={addons}
            field="price"
            unitLabel="price"
            currency={profile.currency}
            lockedKeys={lockedAddons}
            onChange={setAddons}
          />
          <AddRowForm
            unitLabel="price"
            onAdd={({ label, sub, amount }) =>
              setAddons((prev) => [
                ...prev,
                {
                  key: makeKey(
                    label,
                    prev.map((p) => p.key),
                  ),
                  label,
                  sub,
                  price: amount,
                  enabled: true,
                },
              ])
            }
          />
        </CardContent>
      </Card>

      <Button
        variant="hero"
        size="lg"
        disabled={save.isPending}
        onClick={() =>
          save.mutate({
            id: profile.id,
            packages: packages.map((p) => ({ ...p, price: Number(p.price) || 0 })),
            services: addons.map((a) => ({ ...a, price: Number(a.price) || 0 })),
            vehicle_categories: categories.map((c) => ({ ...c, uplift: Number(c.uplift) || 0 })),
            addon_pet_hair: Number(addons.find((a) => a.key === "pet_hair")?.price) || 0,
            addon_stains: Number(addons.find((a) => a.key === "stains")?.price) || 0,
            addon_ceramic: Number(addons.find((a) => a.key === "ceramic")?.price) || 0,
            sedan_base: Number(packages.find((p) => p.key === "full_detail")?.price) || 0,
            suv_base:
              (Number(packages.find((p) => p.key === "full_detail")?.price) || 0) +
              (Number(categories.find((c) => c.key === "suv")?.uplift) || 0),
            truck_base:
              (Number(packages.find((p) => p.key === "full_detail")?.price) || 0) +
              (Number(categories.find((c) => c.key === "truck")?.uplift) || 0),
          })
        }
      >
        {save.isPending && <Loader2 className="size-4 animate-spin" />}
        Save pricing
      </Button>
    </>
  );
}

function NotificationSettingsCard({ profile }: { profile: Profile }) {
  const [settings, setSettings] = useState({
    notify_telegram: profile.notify_telegram,
    notify_include_photos: profile.notify_include_photos,
    notify_include_notes: profile.notify_include_notes,
    allow_photos: profile.allow_photos,
  });
  const save = useProfileUpdate("Notification settings saved");

  const rows: { key: keyof typeof settings; label: string; sub: string }[] = [
    {
      key: "notify_telegram",
      label: "Telegram alerts",
      sub: "Push every new request to your chat instantly",
    },
    {
      key: "notify_include_photos",
      label: "Include photos in alerts",
      sub: "Send customer photos along with the alert",
    },
    {
      key: "notify_include_notes",
      label: "Include notes in alerts",
      sub: "Send the customer's extra details",
    },
    {
      key: "allow_photos",
      label: "Allow photo uploads",
      sub: "Let customers attach up to 5 photos on your form",
    },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base">Notification settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-3 p-3.5">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{r.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{r.sub}</span>
              </span>
              <Switch
                checked={settings[r.key]}
                aria-label={r.label}
                onCheckedChange={(checked) => setSettings((s) => ({ ...s, [r.key]: checked }))}
              />
            </div>
          ))}
        </div>
        <Button
          variant="hero"
          size="lg"
          disabled={save.isPending}
          onClick={() => save.mutate({ id: profile.id, ...settings })}
        >
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Save settings
        </Button>
      </CardContent>
    </Card>
  );
}

function TelegramCard({ authCode, chatId }: { authCode: string; chatId: string | null }) {
  const connected = !!chatId;
  const [copiedCode, setCopiedCode] = useState(false);
  const prepare = useMutation({
    mutationFn: () => prepareTelegramLink(),
    onSuccess: ({ href }) => {
      // Open Telegram link directly
      window.open(href, "_blank", "noopener,noreferrer");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start Telegram connection");
    },
  });

  const copyAuthCode = () => {
    if (!authCode) return;
    void navigator.clipboard.writeText(`/start ${authCode}`);
    setCopiedCode(true);
    toast.success("Copied '/start' command to clipboard. Paste it in your Telegram bot chat!");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <Card className="shadow-card border-border/80">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Send className="size-4 text-blue-500" /> Telegram Real-Time Alerts
          </CardTitle>
          <CardDescription className="text-xs">
            Receive detailed instant lead notifications on your phone whenever a customer requests a
            quote.
          </CardDescription>
        </div>
        <Badge
          variant={connected ? "default" : "secondary"}
          className="shrink-0 gap-1 font-semibold"
        >
          {connected ? (
            <>
              <Check className="size-3 text-emerald-400" /> Connected
            </>
          ) : (
            "Not Connected"
          )}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {connected
            ? "Your Telegram account is actively receiving new quote requests with vehicle details, pricing, and uploaded vehicle photos."
            : "Click the button below to launch Telegram and tap Start. The bot will instantly link to your business profile."}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={connected ? "outline" : "hero"}
            size="lg"
            className="gap-2 font-bold"
            disabled={prepare.isPending}
            onClick={() => prepare.mutate()}
          >
            {prepare.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {connected ? "Reconnect Telegram Bot" : "Connect Telegram Bot"}
          </Button>

          {authCode && (
            <Button
              variant="outline"
              size="lg"
              className="gap-1.5 text-xs font-semibold"
              onClick={copyAuthCode}
            >
              {copiedCode ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copiedCode ? "Command Copied!" : "Copy /start Command"}
            </Button>
          )}
        </div>

        {authCode && (
          <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Manual connection instructions:</p>
            <p>
              If Telegram doesn't open automatically, message your bot directly and send:{" "}
              <code className="rounded bg-background px-1.5 py-0.5 font-mono font-bold text-foreground border border-border/80">
                /start {authCode}
              </code>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PhotoDialog({ paths, customer }: { paths: string[]; customer: string }) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setOpen(true);
    if (urls.length || loading) return;
    setLoading(true);
    const { data, error } = await supabase.storage
      .from("quote-photos")
      .createSignedUrls(paths, 60 * 60);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUrls((data ?? []).map((d) => d.signedUrl).filter((u): u is string => !!u));
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => void load()}>
        <ImageIcon className="size-3.5" /> {paths.length}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Photos from {customer}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {urls.map((u) => (
                <a key={u} href={u} target="_blank" rel="noreferrer">
                  <img
                    src={u}
                    alt={`Vehicle photo from ${customer}`}
                    loading="lazy"
                    className="aspect-square w-full rounded-lg border border-border object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function QuoteHistory({
  quotes,
  currency,
  timezone,
  services,
  categories,
}: {
  quotes: Quote[];
  currency: string;
  timezone: string;
  services: ServiceItem[];
  categories: VehicleCategory[];
}) {
  const [showTests, setShowTests] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const testCount = quotes.filter((q) => q.is_test).length;
  const realQuotes = quotes.filter((q) => !q.is_test);
  const visible = showTests ? quotes : realQuotes;

  // Pipeline stats
  const totalPipeline = quotes.reduce((acc, q) => acc + (Number(q.estimated_price) || 0), 0);
  const avgQuote = quotes.length ? Math.round(totalPipeline / quotes.length) : 0;

  // Search filter
  const filtered = visible.filter((q) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      q.customer_name?.toLowerCase().includes(term) ||
      q.customer_phone?.toLowerCase().includes(term) ||
      q.vehicle_desc?.toLowerCase().includes(term) ||
      q.vehicle_type?.toLowerCase().includes(term) ||
      q.service_label?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Leads
              </span>
              <Users className="size-4 text-primary" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">{quotes.length}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {realQuotes.length} real customer{realQuotes.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pipeline Value
              </span>
              <DollarSign className="size-4 text-emerald-600" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-emerald-600">
              {money(totalPipeline, currency)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Estimated quote totals</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Avg. Ticket
              </span>
              <TrendingUp className="size-4 text-blue-500" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">
              {money(avgQuote, currency)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Per detailing quote</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Alert Bot
              </span>
              <Send className="size-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm font-bold text-foreground">Active</p>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Instant Telegram pings</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Quote Requests Card */}
      <Card className="border-border/80 shadow-card">
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold">Customer Quote Requests</CardTitle>
            <p className="text-xs text-muted-foreground">
              Instant estimates generated by customers using your link.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {testCount > 0 && (
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                <span>
                  Show {testCount} test{testCount === 1 ? "" : "s"}
                </span>
                <Switch
                  checked={showTests}
                  aria-label="Show test requests"
                  onCheckedChange={setShowTests}
                />
              </label>
            )}
          </div>
        </CardHeader>

        {/* Search Filter Bar */}
        {quotes.length > 0 && (
          <div className="border-b border-border/80 px-6 py-2.5">
            <div className="relative max-w-sm">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by customer, phone, or car..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        )}

        <CardContent className="px-0 sm:px-6">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center sm:px-0">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface border border-border">
                <Users className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {searchQuery ? "No matching quotes found" : "No quote requests yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? "Try clearing your search query to see all customer leads."
                  : "Share your unique quote link on Instagram, Yelp, Google Business, or your truck to start receiving leads."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Quick Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service Package</TableHead>
                    <TableHead>Add-ons</TableHead>
                    <TableHead>Notes & Photos</TableHead>
                    <TableHead className="text-right">Estimated Total</TableHead>
                    <TableHead className="text-right">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((q) => (
                    <TableRow
                      key={q.id}
                      className={q.is_test ? "opacity-75 bg-surface/30" : undefined}
                    >
                      <TableCell className="font-semibold text-foreground">
                        <div>
                          {q.customer_name}
                          {q.is_test && (
                            <Badge variant="secondary" className="ml-2 text-[10px] py-0">
                              <FlaskConical className="size-2.5 mr-1" /> TEST
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${q.customer_phone}`}
                            title={`Call ${q.customer_name}`}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 transition-colors"
                          >
                            <Phone className="size-3" /> Call
                          </a>
                          <a
                            href={`sms:${q.customer_phone}`}
                            title={`SMS ${q.customer_name}`}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-500/20 transition-colors"
                          >
                            <MessageSquare className="size-3" /> Text
                          </a>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm">
                        <span className="block font-medium text-foreground">
                          {q.vehicle_desc || vehicleLabel(q.vehicle_type, categories)}
                        </span>
                        {q.vehicle_desc && (
                          <span className="text-xs text-muted-foreground">
                            {vehicleLabel(q.vehicle_type, categories)}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-sm">
                        <span className="font-medium text-foreground">
                          {q.service_label || "—"}
                        </span>
                        {q.service_price ? (
                          <span className="block text-xs text-muted-foreground">
                            {money(Number(q.service_price), q.currency || currency)}
                          </span>
                        ) : null}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {q.addons.length
                          ? q.addons.map((a) => addonLabel(a, services)).join(", ")
                          : "—"}
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          {q.photo_urls?.length ? (
                            <PhotoDialog paths={q.photo_urls} customer={q.customer_name} />
                          ) : null}
                          {q.notes?.trim() ? (
                            <span
                              className="max-w-[12rem] truncate text-muted-foreground"
                              title={q.notes}
                            >
                              {q.notes}
                            </span>
                          ) : (
                            !q.photo_urls?.length && (
                              <span className="text-muted-foreground">—</span>
                            )
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="font-display font-bold text-foreground">
                          {money(Number(q.estimated_price), q.currency || currency)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatWhen(q.created_at, timezone)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Onboarding() {
  const queryClient = useQueryClient();
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const finalSlug = slugify(slug || businessName);
      if (!finalSlug) throw new Error("Pick a link for your quote form");
      const { error } = await supabase.from("profiles").insert({
        id: uid,
        business_name: businessName.trim(),
        slug: finalSlug,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Business created");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card className="mx-auto max-w-md shadow-card">
      <CardHeader>
        <CardTitle className="text-base">Set up your business</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ob-name">Business name</Label>
          <Input
            id="ob-name"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              setSlug(slugify(e.target.value));
            }}
            placeholder="Reflect Mobile Detailing"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ob-slug">Quote link</Label>
          <Input
            id="ob-slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="reflect-mobile-detailing"
          />
          <p className="text-xs text-muted-foreground">
            Customers will visit /{slug || "your-link"}
          </p>
        </div>
        <Button
          variant="hero"
          size="xl"
          disabled={!businessName.trim() || create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending && <Loader2 className="size-4 animate-spin" />}
          Create my quote form
        </Button>
      </CardContent>
    </Card>
  );
}

function TestingCard({ profile }: { profile: Profile }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const testUrl = `${origin}/${profile.slug}?test=1`;
  const [sending, setSending] = useState(false);

  const sendTest = async () => {
    setSending(true);
    try {
      const result = await sendQuoteAlert({
        data: {
          detailerId: profile.id,
          customerName: "Test Customer",
          customerPhone: profile.phone || "+10000000000",
          vehicle: "2023 Test Vehicle (Sedan / Coupe)",
          service: { label: "Full Detail", price: 190 },
          addons: [{ label: "Pet Hair Removal", price: 40 }],
          estimate: 230,
          notes: "This is a test alert sent from your dashboard.",
          isTest: true,
        },
      });
      if (result?.sent) {
        toast.success("Test alert sent — check your Telegram chat.");
      } else if (result?.reason === "not_connected") {
        toast.error("Connect your Telegram bot first (Alerts tab).");
      } else if (result?.reason === "muted") {
        toast.error("Telegram alerts are switched off in your settings.");
      } else {
        toast.error("Could not send the test alert. Try again.");
      }
    } catch {
      toast.error("Could not send the test alert. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">Test your bot & quote link</CardTitle>
        <Badge variant="secondary">
          <FlaskConical className="size-3" /> Test mode
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Send yourself a sample alert to check the bot is linked and the message looks right.
            Nothing is saved to your requests list.
          </p>
          <Button variant="hero" size="xl" disabled={sending} onClick={() => void sendTest()}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send test alert to Telegram
          </Button>
        </div>

        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm font-semibold">Try your own quote link</p>
          <p className="text-sm text-muted-foreground">
            This special link fills a request exactly like a customer would, but every request it
            creates is tagged <span className="font-semibold">TEST</span> — in your requests list
            and in the Telegram alert — so you never mistake it for a real lead.
          </p>
          <p className="font-mono text-xs break-all text-muted-foreground">{testUrl}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                to="/$business_slug"
                params={{ business_slug: profile.slug }}
                search={{ test: true }}
              >
                <ExternalLink className="size-3.5" /> Open test link
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(testUrl);
                toast.success("Test link copied");
              }}
            >
              <Copy className="size-3.5" /> Copy test link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrialBanner() {
  const fetchTrial = useServerFn(getTrialState);
  const { data } = useQuery({ queryKey: ["trial-state"], queryFn: () => fetchTrial() });
  if (!data) return null;

  if (data.status === "SUBSCRIBED") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon.png"
            alt="Detailr"
            className="size-5 rounded-md object-contain shadow-xs"
          />
          <p className="text-sm font-medium text-foreground">
            You're on <span className="font-bold">Detailr Pro</span> ($15/month) · Unlimited leads
            active.
          </p>
        </div>
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Pro Member</Badge>
      </div>
    );
  }

  const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-4.5" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">
            {data.expired
              ? "Your 7-day free trial has ended"
              : daysLeft !== null
                ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial`
                : "You're on the free trial"}
          </p>
          {expiresAt && (
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {data.expired ? "Ended on" : "Trial ends"} {expiresAt.toLocaleDateString()} · Keep
              receiving instant Telegram leads
            </p>
          )}
        </div>
      </div>
      <Button asChild variant="hero" size="sm" className="shadow-xs font-semibold">
        <Link to="/upgrade">
          <CreditCard className="size-4" /> Upgrade to Pro ($15/mo)
        </Link>
      </Button>
    </div>
  );
}
