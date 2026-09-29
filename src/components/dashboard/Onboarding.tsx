import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { slugify, cleanSlugInput } from "@/lib/pricing";
import { useSlugValidator } from "@/hooks/useSlugValidator";

export function Onboarding() {
  const queryClient = useQueryClient();
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");

  const slugStatus = useSlugValidator(slug || businessName);

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const finalSlug = slugify(slug || businessName);
      if (!finalSlug) throw new Error("Pick a link for your quote form");
      if (slugStatus.isTaken) {
        throw new Error(`'${finalSlug}' is already taken. Please select an available alternative.`);
      }

      const { error } = await supabase.from("profiles").insert({
        id: uid,
        business_name: businessName.trim(),
        slug: finalSlug,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Welcome aboard! Business created.");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card className="mx-auto max-w-md shadow-2xl border-border/60 bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden mt-12">
      <div className="bg-primary/5 p-8 border-b border-border/40 text-center space-y-2">
        <div className="mx-auto size-12 flex items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 mb-4">
          <Sparkles className="size-6" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight">Set up your Shop</CardTitle>
        <CardDescription className="text-sm font-medium text-muted-foreground/80">
          Enter your company name to generate your instant customer quote form and link.
        </CardDescription>
      </div>

      <CardContent className="p-8 space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="ob-name"
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
          >
            Business name
          </Label>
          <Input
            id="ob-name"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              setSlug(cleanSlugInput(e.target.value));
            }}
            placeholder="e.g. Apex Auto Detailing"
            className="h-11 text-sm rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="ob-slug"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
            >
              Quote link URL
            </Label>
            {slugStatus.isChecking ? (
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Loader2 className="size-3 animate-spin text-primary" /> Checking...
              </span>
            ) : slugStatus.isTaken ? (
              <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3 shrink-0" /> Slug Taken
              </span>
            ) : slugStatus.isValid && (slug || businessName) ? (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="size-3" /> Available
              </span>
            ) : null}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground/40 font-mono pointer-events-none z-10">
              detailr.online/
            </span>
            <Input
              id="ob-slug"
              value={slug}
              onChange={(e) => setSlug(cleanSlugInput(e.target.value))}
              placeholder="apex-auto"
              className={`h-11 pl-[96px] text-sm font-mono font-bold rounded-xl bg-background/50 transition-colors ${
                slugStatus.isTaken
                  ? "border-red-500/80 focus-visible:ring-red-500/30 bg-red-50/10"
                  : slugStatus.isValid && (slug || businessName)
                    ? "border-emerald-500/60 focus-visible:ring-emerald-500/30"
                    : "border-border/60 focus-visible:ring-primary/20"
              }`}
            />
          </div>

          {/* Slug Taken Alert & Alternative Pills */}
          {slugStatus.isTaken ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 space-y-2 text-xs animate-in fade-in-50 duration-150">
              <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 leading-tight">
                {slugStatus.message}
              </p>

              {slugStatus.suggestions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Click an available alternative:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {slugStatus.suggestions.map((alt) => (
                      <button
                        key={alt}
                        type="button"
                        onClick={() => setSlug(alt)}
                        className="rounded-lg border border-primary/30 bg-background/90 hover:bg-primary/10 px-2.5 py-1 text-[11px] font-mono font-bold text-primary transition-all hover:scale-105 cursor-pointer shadow-2xs"
                      >
                        + {alt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] font-medium text-muted-foreground/60 px-1">
              This is the permanent link you will share with your customers.
            </p>
          )}
        </div>

        <Button
          variant="hero"
          size="lg"
          className="w-full font-bold h-11 text-sm mt-4 rounded-xl shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          disabled={
            !businessName.trim() ||
            create.isPending ||
            slugStatus.isChecking ||
            slugStatus.isTaken ||
            !slugStatus.isValid
          }
          onClick={() => create.mutate()}
        >
          {create.isPending ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="size-4 mr-2" />
          )}
          Create My Shop & Link
        </Button>

        <p className="text-center text-[10px] text-muted-foreground/50 font-medium italic">
          You can change these settings later in your dashboard.
        </p>
      </CardContent>
    </Card>
  );
}
