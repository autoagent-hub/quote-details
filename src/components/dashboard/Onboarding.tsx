import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/pricing";

export function Onboarding() {
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
              setSlug(slugify(e.target.value));
            }}
            placeholder="e.g. Apex Auto Detailing"
            className="h-11 text-sm rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="ob-slug"
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
          >
            Quote link URL
          </Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground/40 font-mono">
              detailr.online/
            </span>
            <Input
              id="ob-slug"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="apex-auto"
              className="h-11 pl-[96px] text-sm font-mono font-bold rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20"
            />
          </div>
          <p className="text-[10px] font-medium text-muted-foreground/60 px-1">
            This is the permanent link you will share with your customers.
          </p>
        </div>

        <Button
          variant="hero"
          size="lg"
          className="w-full font-bold h-11 text-sm mt-4 rounded-xl shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          disabled={!businessName.trim() || create.isPending}
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
