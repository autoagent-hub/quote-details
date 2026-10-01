import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_PACKAGES,
  DEFAULT_SERVICES,
  DEFAULT_VEHICLE_CATEGORIES,
  parsePackages,
  parseServices,
  parseVehicleCategories,
  type ServiceItem,
  type PackageItem,
  type VehicleCategory,
} from "@/lib/pricing";
import type { Profile } from "./types";
import { useProfileUpdate } from "./useProfileUpdate";

export function PricingCard({ profile }: { profile: Profile }) {
  const save = useProfileUpdate("Pricing rates saved");
  const currency = profile.currency || "USD";

  const [categories, setCategories] = useState<VehicleCategory[]>(() =>
    parseVehicleCategories(profile.vehicle_categories),
  );
  const [packages, setPackages] = useState<PackageItem[]>(() => parsePackages(profile.packages));
  const [addons, setAddons] = useState<ServiceItem[]>(() => parseServices(profile.services));

  const addCategory = () => {
    const key = `cat_${Date.now()}`;
    const newItem: VehicleCategory = {
      key,
      label: "",
      sub: "",
      uplift: 0,
      enabled: true,
    };
    setCategories((prev) => [newItem, ...prev]);
    toast.success("New empty vehicle size added at top!");
  };

  const addPackage = () => {
    const key = `pkg_${Date.now()}`;
    const newItem: PackageItem = {
      key,
      label: "",
      sub: "",
      price: 0,
      enabled: true,
    };
    setPackages((prev) => [newItem, ...prev]);
    toast.success("New empty package added at top!");
  };

  const addAddon = () => {
    const key = `srv_${Date.now()}`;
    const newItem: ServiceItem = {
      key,
      label: "",
      sub: "",
      price: 0,
      enabled: true,
    };
    setAddons((prev) => [newItem, ...prev]);
    toast.success("New empty extra service added at top!");
  };

  return (
    <div className="space-y-6">
      {/* Friendly Guide Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            💡 How Calculator Quotes Are Calculated
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Customer Total</strong> = [Base Package Rate] + [Vehicle Size Fee] + [Selected
            Add-ons]. Toggle any item off to hide it from your live calculator form.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sizing Card */}
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm transition-all hover:border-border/80">
          <CardHeader className="flex-row items-center justify-between pb-3 px-5 pt-5 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
                1. Vehicle Size
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-muted-foreground/70">
                Uplift fees added to packages.
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-[10px] font-bold px-2 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              onClick={addCategory}
            >
              <Plus className="size-3 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <EditableRows
              items={categories}
              field="uplift"
              unitLabel={`+${currency}`}
              currency={currency}
              lockedKeys={DEFAULT_VEHICLE_CATEGORIES.map((c) => c.key)}
              namePlaceholder="e.g. Extra Large / Dually"
              onChange={setCategories}
            />
          </CardContent>
        </Card>

        {/* Packages Card */}
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm transition-all hover:border-border/80">
          <CardHeader className="flex-row items-center justify-between pb-3 px-5 pt-5 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
                2. Base Packages
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-muted-foreground/70">
                Standard rates for core jobs.
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-[10px] font-bold px-2 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              onClick={addPackage}
            >
              <Plus className="size-3 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <EditableRows
              items={packages}
              field="price"
              unitLabel={currency}
              currency={currency}
              lockedKeys={DEFAULT_PACKAGES.map((p) => p.key)}
              namePlaceholder="e.g. Ceramic Coating"
              onChange={setPackages}
            />
          </CardContent>
        </Card>

        {/* Addons Card */}
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm transition-all hover:border-border/80">
          <CardHeader className="flex-row items-center justify-between pb-3 px-5 pt-5 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
                3. Extra Services
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-muted-foreground/70">
                Optional add-ons for the car.
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-[10px] font-bold px-2 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              onClick={addAddon}
            >
              <Plus className="size-3 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <EditableRows
              items={addons}
              field="price"
              unitLabel={currency}
              currency={currency}
              lockedKeys={DEFAULT_SERVICES.map((s) => s.key)}
              namePlaceholder="e.g. Engine Bay Clean"
              onChange={setAddons}
            />
          </CardContent>
        </Card>
      </div>

      {/* Save Action */}
      <div className="flex justify-end pt-2">
        <Button
          variant="hero"
          size="sm"
          className="h-9 px-8 font-bold text-xs rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          disabled={save.isPending}
          onClick={() =>
            save.mutate({
              id: profile.id,
              vehicle_categories: categories,
              packages: packages,
              services: addons,
            })
          }
        >
          {save.isPending && <Loader2 className="size-3.5 animate-spin mr-2" />}
          Update Pricing Schema
        </Button>
      </div>
    </div>
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

function EditableRows<F extends string, T extends BaseRow & Record<F, number>>({
  items,
  field,
  unitLabel,
  currency,
  lockedKeys,
  namePlaceholder = "Enter item name...",
  onChange,
}: {
  items: T[];
  field: F;
  unitLabel: string;
  currency: string;
  lockedKeys: string[];
  namePlaceholder?: string;
  onChange: (next: T[]) => void;
}) {
  const patch = (i: number, changes: Record<string, unknown>) =>
    onChange(items.map((item, idx) => (idx === i ? ({ ...item, ...changes } as T) : item)));

  return (
    <div className="space-y-2.5">
      <AnimatePresence initial={false}>
        {items.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`group flex items-center gap-4 rounded-xl border p-3.5 transition-all hover:border-border/80 hover:bg-background/80 ${
              s.enabled ? "" : "opacity-40 grayscale-[0.5]"
            } ${
              !s.label
                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                : "border-border/40 bg-background/40"
            }`}
          >
            <Switch
              checked={s.enabled}
              aria-label={`Offer ${s.label || namePlaceholder}`}
              onCheckedChange={(checked) => patch(i, { enabled: checked })}
              className="scale-90"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <Input
                autoFocus={i === 0 && !s.label}
                placeholder={namePlaceholder}
                aria-label={`${s.label || namePlaceholder} name`}
                className="h-8 border-none bg-transparent p-0 text-xs font-bold focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/50"
                value={s.label}
                onChange={(e) => patch(i, { label: e.target.value })}
              />
              <Input
                placeholder="Short description..."
                aria-label={`${s.label || namePlaceholder} description`}
                className="h-5 border-none bg-transparent p-0 text-[10px] font-medium text-muted-foreground focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/40"
                value={s.sub}
                onChange={(e) => patch(i, { sub: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative group/price">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground pointer-events-none opacity-50 uppercase">
                  {(unitLabel || "").includes("+") ? "+" : ""}
                </span>
                <Input
                  type="number"
                  step={1}
                  inputMode="numeric"
                  placeholder="0"
                  aria-label={`${s.label} ${unitLabel || ""} in ${currency || "USD"}`}
                  className="h-8 w-16 text-right font-mono text-[11px] font-bold pl-5 pr-2 rounded-lg bg-muted/30 border-border/40 focus-visible:ring-primary/20"
                  value={s[field] === 0 ? "" : (s[field] ?? "")}
                  onChange={(e) =>
                    patch(i, { [field]: e.target.value === "" ? 0 : Number(e.target.value) })
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 bg-destructive/5 sm:bg-transparent transition-colors shrink-0"
                aria-label={`Remove ${s.label}`}
                onClick={() => {
                  onChange(items.filter((_, idx) => idx !== i));
                  toast.success(`Removed "${s.label || "pricing item"}" from list`);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
