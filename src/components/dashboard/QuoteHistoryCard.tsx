import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  FlaskConical,
  Loader2,
  MessageSquare,
  Phone,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  money,
  formatWhen,
  vehicleLabel,
  addonLabel,
  type ServiceItem,
  type VehicleCategory,
} from "@/lib/pricing";
import type { Quote } from "./types";
import { PhotoDialog } from "./PhotoDialog";

export function QuoteHistoryCard({
  quotes,
  currency,
  timezone,
  services,
  categories,
  slug,
  detailerId,
}: {
  quotes: Quote[];
  currency: string;
  timezone: string;
  services: ServiceItem[];
  categories: VehicleCategory[];
  slug?: string;
  detailerId?: string;
}) {
  const queryClient = useQueryClient();
  const [showTests, setShowTests] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [creatingTestLead, setCreatingTestLead] = useState(false);

  // Confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [confirmClearTests, setConfirmClearTests] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const testCount = quotes.filter((q) => q.is_test).length;
  const realQuotes = quotes.filter((q) => !q.is_test);
  const visible = showTests ? quotes : realQuotes;

  const liveUrl = slug
    ? typeof window !== "undefined"
      ? `${window.location.origin}/${slug}`
      : `https://detailr.online/${slug}`
    : "";

  const handleCopyLink = () => {
    if (!liveUrl) return;
    void navigator.clipboard.writeText(liveUrl);
    setCopiedLink(true);
    toast.success("Quote link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateSampleLead = async () => {
    if (!detailerId) return;
    setCreatingTestLead(true);
    try {
      const { error } = await supabase.from("quotes").insert({
        detailer_id: detailerId,
        customer_name: "Jordan Lee (Sample Lead)",
        customer_phone: "+1 555-014-4921",
        vehicle_type: "suv",
        vehicle_desc: "2023 Porsche Macan (Compact SUV)",
        service_key: "full-detail",
        service_label: "Full Detail Package",
        service_price: 180,
        addons: ["ceramic", "stains"],
        estimated_price: 260,
        notes: "Sample lead created to test your leads queue. Try the Call or SMS buttons!",
        is_test: true,
        currency: currency || "USD",
      });

      if (error) throw error;
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Sample lead created! You can test the Call and SMS buttons.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create sample lead.");
    } finally {
      setCreatingTestLead(false);
    }
  };

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

  // Mutations for deletion
  const deleteSingleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead record deleted");
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not delete lead record");
    },
  });

  const clearTestsMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("detailer_id", uid)
        .eq("is_test", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("All test leads cleared");
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setConfirmClearTests(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not clear test leads");
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const { error } = await supabase.from("quotes").delete().eq("detailer_id", uid);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quote history cleared");
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setConfirmClearAll(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not clear quote history");
    },
  });

  return (
    <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 px-6">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            Incoming Leads
            <Badge
              variant="secondary"
              className="font-mono text-[10px] py-0 h-4 px-1.5 bg-muted/80"
            >
              {filtered.length}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground/80">
            Real-time customer vehicle specs, package choices, and 1-tap contact.
          </CardDescription>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {testCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 rounded-lg gap-1.5"
              onClick={() => setConfirmClearTests(true)}
            >
              <Trash2 className="size-3" />
              Clear Tests ({testCount})
            </Button>
          )}

          {quotes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border/60 rounded-lg gap-1.5"
              onClick={() => setConfirmClearAll(true)}
            >
              <Trash2 className="size-3" />
              Clear All
            </Button>
          )}

          {testCount > 0 && (
            <label className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground cursor-pointer select-none border-l border-border/40 pl-3">
              <span className="opacity-70 uppercase tracking-wider">Show tests</span>
              <Switch
                checked={showTests}
                aria-label="Show test requests"
                onCheckedChange={setShowTests}
                className="scale-75"
              />
            </label>
          )}
        </div>
      </CardHeader>

      {/* Filter bar */}
      <div className="border-y border-border/40 px-6 py-3 bg-muted/10 backdrop-blur-sm">
        <div className="relative max-w-sm">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            type="search"
            placeholder="Search leads, cars, or phone numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-xs bg-background/50 border-border/60 rounded-xl focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          searchQuery ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground/60 shadow-inner">
                <Users className="size-6" />
              </div>
              <p className="mt-4 text-sm font-bold text-foreground">No matching leads found</p>
              <p className="mt-1 text-xs text-muted-foreground/80 max-w-[240px] mx-auto leading-relaxed">
                Refine your search term to find a specific customer record.
              </p>
            </div>
          ) : (
            <div className="px-6 py-12 sm:py-16 text-center max-w-lg mx-auto space-y-6">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                <Sparkles className="size-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-foreground">Your Lead Queue is Ready!</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When customers use your quote form, their name, phone number, vehicle type, and
                  requested services will arrive right here in real time.
                </p>
              </div>

              {/* 3 Quick Tips for Getting Leads */}
              <div className="text-left rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2.5 text-xs">
                <span className="font-bold text-foreground block text-[11px] uppercase tracking-wider text-muted-foreground">
                  How to get your first customer quote:
                </span>
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-md bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    <strong className="text-foreground">Share your link</strong> in your Instagram
                    bio, TikTok, or text it when customers ask "how much for a detail?".
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-md bg-amber-500/10 text-amber-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    <strong className="text-foreground">Customers get instant pricing</strong>{" "}
                    without back-and-forth messaging.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    <strong className="text-foreground">1-Tap Booking:</strong> Click Call or SMS
                    right from this dashboard to lock in the appointment!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                {liveUrl && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full sm:w-auto h-9 text-xs font-bold rounded-xl gap-2 bg-primary text-white hover:bg-primary/90 shadow-sm"
                    onClick={handleCopyLink}
                  >
                    {copiedLink ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    <span>{copiedLink ? "Link Copied!" : "Copy My Quote Link"}</span>
                  </Button>
                )}

                {detailerId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto h-9 text-xs font-bold rounded-xl border-border/80 gap-1.5"
                    disabled={creatingTestLead}
                    onClick={handleCreateSampleLead}
                  >
                    {creatingTestLead ? (
                      <Loader2 className="size-3.5 animate-spin mr-1 text-primary" />
                    ) : (
                      <FlaskConical className="size-3.5 text-amber-500" />
                    )}
                    <span>{creatingTestLead ? "Generating..." : "Try Sample Test Lead"}</span>
                  </Button>
                )}
              </div>
            </div>
          )
        ) : (
          <>
            {/* Mobile & Tablet Flexible Card Grid (< lg) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4 p-4 bg-muted/5">
              {filtered.map((q) => (
                <div
                  key={q.id}
                  className={`rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-3.5 transition-all hover:border-border ${
                    q.is_test ? "opacity-80 bg-muted/20" : ""
                  }`}
                >
                  {/* Top Header: Customer Name & Received Time & Price */}
                  <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm tracking-tight text-foreground truncate">
                          {q.customer_name || "Anonymous Customer"}
                        </h3>
                        {q.is_test && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] py-0 h-4 px-1.5 font-mono"
                          >
                            TEST
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-3 opacity-60" />
                        {formatWhen(q.created_at || new Date().toISOString(), timezone)}
                      </p>
                    </div>

                    {/* Total Estimate Tag */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Estimate
                      </span>
                      <span className="font-display font-bold text-base text-emerald-600">
                        {money(Number(q.estimated_price), q.currency || currency)}
                      </span>
                    </div>
                  </div>

                  {/* Flexible Grid of Vehicle, Package */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {/* Vehicle Details */}
                    <div className="rounded-xl bg-muted/30 p-2.5 border border-border/30 space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Car className="size-3 opacity-70" /> Vehicle
                      </span>
                      <p className="font-bold text-foreground text-xs leading-snug">
                        {q.vehicle_desc || vehicleLabel(q.vehicle_type, categories)}
                      </p>
                      {q.vehicle_desc && (
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {vehicleLabel(q.vehicle_type, categories)}
                        </p>
                      )}
                    </div>

                    {/* Selected Package */}
                    <div className="rounded-xl bg-muted/30 p-2.5 border border-border/30 space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="size-3 opacity-70" /> Package
                      </span>
                      <p className="font-bold text-foreground text-xs leading-snug">
                        {q.service_label || "Base Detail"}
                      </p>
                      {q.service_price ? (
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {money(Number(q.service_price), q.currency || currency)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Add-ons Requested Pills */}
                  {q.addons && q.addons.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Add-ons Requested:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {q.addons.map((a, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-lg bg-surface border border-border/60 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-xs"
                          >
                            {addonLabel(a, services)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer Notes & Vehicle Photos */}
                  {(q.notes?.trim() || q.photo_urls?.length) && (
                    <div className="rounded-xl border border-border/40 bg-background/50 p-2.5 space-y-2 text-xs">
                      {q.notes?.trim() && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <FileText className="size-3 opacity-70" /> Customer Notes:
                          </span>
                          <p className="text-xs text-foreground/90 font-medium italic leading-relaxed">
                            "{q.notes}"
                          </p>
                        </div>
                      )}
                      {q.photo_urls?.length ? (
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-muted-foreground">
                            {q.photo_urls.length} vehicle photo{q.photo_urls.length > 1 ? "s" : ""}
                          </span>
                          <PhotoDialog
                            paths={q.photo_urls}
                            customer={q.customer_name || "Customer"}
                          />
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* 1-Tap Action Footer (Call, SMS, & Delete) */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="h-9 flex-1 rounded-xl bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 font-bold text-xs gap-2 border border-emerald-500/20"
                    >
                      <a href={`tel:${q.customer_phone}`}>
                        <Phone className="size-3.5" /> Call
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="h-9 flex-1 rounded-xl bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 font-bold text-xs gap-2 border border-blue-500/20"
                    >
                      <a href={`sms:${q.customer_phone}`}>
                        <MessageSquare className="size-3.5" /> SMS Text
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
                      onClick={() =>
                        setDeleteTarget({ id: q.id, name: q.customer_name || "this customer" })
                      }
                      title="Delete lead record"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40 bg-muted/5">
                    <TableHead className="text-[10px] h-10 font-bold uppercase tracking-widest px-6">
                      Customer
                    </TableHead>
                    <TableHead className="text-[10px] h-10 font-bold uppercase tracking-widest">
                      Connect
                    </TableHead>
                    <TableHead className="text-[10px] h-10 font-bold uppercase tracking-widest">
                      Vehicle
                    </TableHead>
                    <TableHead className="text-[10px] h-10 font-bold uppercase tracking-widest">
                      Package
                    </TableHead>
                    <TableHead className="text-[10px] h-10 font-bold uppercase tracking-widest">
                      Add-ons
                    </TableHead>
                    <TableHead className="text-[10px] h-10 font-bold uppercase tracking-widest">
                      Details
                    </TableHead>
                    <TableHead className="text-[10px] h-10 font-bold uppercase tracking-widest text-right">
                      Estimate
                    </TableHead>
                    <TableHead className="text-[10px] h-10 font-bold uppercase tracking-widest text-right px-6">
                      Received
                    </TableHead>
                    <TableHead className="text-[10px] h-10 font-bold uppercase tracking-widest text-right px-4">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((q) => (
                    <TableRow
                      key={q.id}
                      className={`border-border/40 transition-colors hover:bg-muted/5 ${q.is_test ? "opacity-70 grayscale-[0.2]" : ""}`}
                    >
                      <TableCell className="font-bold text-xs py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[140px]">{q.customer_name}</span>
                          {q.is_test && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] py-0 h-4 px-1 bg-muted/80 font-mono tracking-tight shrink-0"
                            >
                              TEST
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="h-8 rounded-lg bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-0 shadow-none px-3 text-[11px] font-bold"
                          >
                            <a href={`tel:${q.customer_phone}`} title={`Call ${q.customer_name}`}>
                              <Phone className="size-3 mr-1.5" /> Call
                            </a>
                          </Button>
                          <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="h-8 rounded-lg bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-0 shadow-none px-3 text-[11px] font-bold"
                          >
                            <a href={`sms:${q.customer_phone}`} title={`SMS ${q.customer_name}`}>
                              <MessageSquare className="size-3 mr-1.5" /> SMS
                            </a>
                          </Button>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs py-4">
                        <div className="space-y-0.5 max-w-[180px]">
                          <span className="block font-bold text-foreground leading-snug">
                            {q.vehicle_desc || vehicleLabel(q.vehicle_type, categories)}
                          </span>
                          {q.vehicle_desc && (
                            <span className="text-[10px] font-medium text-muted-foreground opacity-70 block">
                              {vehicleLabel(q.vehicle_type, categories)}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs py-4">
                        <div className="space-y-0.5 max-w-[150px]">
                          <span className="font-bold text-foreground block leading-snug">
                            {q.service_label || "—"}
                          </span>
                          {q.service_price ? (
                            <span className="block text-[10px] font-medium text-muted-foreground opacity-70">
                              {money(Number(q.service_price), q.currency || currency)}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell className="text-[11px] font-medium text-muted-foreground/80 py-4 max-w-[180px]">
                        <div className="flex flex-wrap gap-1">
                          {q.addons.length
                            ? q.addons.map((a, i) => (
                                <span
                                  key={i}
                                  className="inline-block bg-muted/40 px-1.5 py-0.5 rounded text-[10px] font-medium text-foreground/80"
                                >
                                  {addonLabel(a, services)}
                                </span>
                              ))
                            : "—"}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs py-4">
                        <div className="flex items-center gap-2">
                          {q.photo_urls?.length ? (
                            <PhotoDialog
                              paths={q.photo_urls}
                              customer={q.customer_name || "Customer"}
                            />
                          ) : null}
                          {q.notes?.trim() ? (
                            <div
                              className="max-w-[140px] truncate text-[11px] font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded cursor-help"
                              title={q.notes}
                            >
                              {q.notes}
                            </div>
                          ) : (
                            !q.photo_urls?.length && (
                              <span className="text-muted-foreground/40 text-[11px]">—</span>
                            )
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right py-4">
                        <span className="font-display font-bold text-sm text-emerald-600">
                          {money(Number(q.estimated_price), q.currency || currency)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right text-[10px] font-bold text-muted-foreground px-6 py-4 opacity-70 whitespace-nowrap">
                        {formatWhen(q.created_at || new Date().toISOString(), timezone)}
                      </TableCell>

                      <TableCell className="text-right py-4 px-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() =>
                            setDeleteTarget({ id: q.id, name: q.customer_name || "this customer" })
                          }
                          title="Delete lead record"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      {/* Single Lead Delete Confirmation Modal */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Delete Lead Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete the quote request from{" "}
              <strong className="text-foreground">{deleteTarget?.name}</strong>? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="h-9 rounded-xl text-xs font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-9 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSingleMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteSingleMutation.mutate(deleteTarget.id);
              }}
            >
              {deleteSingleMutation.isPending ? "Deleting..." : "Delete Lead"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Test Leads Confirmation Modal */}
      <AlertDialog open={confirmClearTests} onOpenChange={setConfirmClearTests}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Clear All Test Leads?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will permanently delete all{" "}
              <strong className="text-foreground">{testCount} test quotes</strong> from your
              dashboard history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="h-9 rounded-xl text-xs font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-9 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700"
              disabled={clearTestsMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                clearTestsMutation.mutate();
              }}
            >
              {clearTestsMutation.isPending ? "Clearing..." : "Clear Test Leads"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All History Confirmation Modal */}
      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Clear Entire Quote History?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete all{" "}
              <strong className="text-foreground">{quotes.length} leads</strong> from your database?
              This will clear all customer quote requests permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="h-9 rounded-xl text-xs font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-9 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={clearAllMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                clearAllMutation.mutate();
              }}
            >
              {clearAllMutation.isPending ? "Clearing All..." : "Delete All Leads"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
