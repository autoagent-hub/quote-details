import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, TIMEZONES, slugify } from "@/lib/pricing";
import type { Profile } from "./types";
import { useProfileUpdate } from "./useProfileUpdate";

export function BusinessProfileCard({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    business_name: profile.business_name || "",
    slug: profile.slug || "",
    phone: profile.phone ?? "",
    logo_url: profile.logo_url ?? "",
    currency: profile.currency || "USD",
    timezone: profile.timezone || "America/Los_Angeles",
    tagline: profile.tagline ?? "",
  });
  const save = useProfileUpdate("Profile settings saved");

  return (
    <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-sm font-bold flex items-center gap-2">Shop Profile</CardTitle>
        <CardDescription className="text-xs font-medium text-muted-foreground/70">
          Manage your detailing company identity, quote link, and locale.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="space-y-2">
          <Label
            htmlFor="business_name"
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
          >
            Business name
          </Label>
          <Input
            id="business_name"
            value={form.business_name}
            onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
            className="h-9 text-xs rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="slug"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
            >
              URL Slug
            </Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              className="h-9 text-xs font-mono rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
            >
              Contact Phone
            </Label>
            <Input
              id="phone"
              value={form.phone}
              inputMode="tel"
              placeholder="+1 555 010 2020"
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="h-9 text-xs rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Currency
            </Label>
            <Select
              value={form.currency}
              onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/60">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="text-xs rounded-lg">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Timezone
            </Label>
            <Select
              value={form.timezone}
              onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20">
                <SelectValue placeholder="Time zone" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/60">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz} className="text-xs rounded-lg">
                    {tz.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Label
            htmlFor="logo_url"
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
          >
            Logo / Brand Asset URL
          </Label>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={form.logo_url || "/favicon.png"}
                alt="Logo preview"
                referrerPolicy="no-referrer"
                className="size-12 rounded-xl border border-border bg-background p-1 object-contain shrink-0 shadow-sm transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/favicon.png";
                }}
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity pointer-events-none" />
            </div>
            <Input
              id="logo_url"
              value={form.logo_url}
              placeholder="https://... or /favicon.png"
              onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
              className="h-9 text-xs flex-1 rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20"
            />
          </div>

          {/* Social preview card - Anti-slop polish */}
          <div className="rounded-2xl border border-border/40 bg-surface/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-primary/70">
                <Share2 className="size-3" />
                Share Preview
              </span>
              <span className="text-[9px] font-medium text-muted-foreground/50">
                SMART THUMBNAIL
              </span>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-background p-3 shadow-sm">
              <img
                src={form.logo_url || "/favicon.png"}
                alt="Social preview thumbnail"
                referrerPolicy="no-referrer"
                className="size-10 rounded-lg border border-border/80 bg-surface object-contain p-1 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/favicon.png";
                }}
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-[11px] font-bold text-foreground">
                  {form.business_name || "Your Business"} — Instant Quote
                </p>
                <p className="truncate text-[9px] font-medium text-muted-foreground leading-tight">
                  {form.tagline || "Select vehicle type and get an instant detailing estimate."}
                </p>
                <p className="truncate text-[9px] font-bold text-primary/80 mt-1 font-mono tracking-tighter">
                  detailr.online/{form.slug || "your-link"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="hero"
            size="sm"
            className="h-9 px-8 font-bold text-xs rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={save.isPending || !form.business_name.trim() || !form.slug}
            onClick={() =>
              save.mutate({
                id: profile.id,
                business_name: form.business_name.trim(),
                slug: form.slug,
                phone: form.phone.trim(),
                logo_url: form.logo_url.trim() || null,
                currency: form.currency,
                timezone: form.timezone,
              })
            }
          >
            {save.isPending && <Loader2 className="size-3 animate-spin mr-2" />}
            Save Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
