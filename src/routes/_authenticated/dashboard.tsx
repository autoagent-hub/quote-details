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
  Globe,
  Image as ImageIcon,
  Link2,
  Loader2,
  LogOut,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  Settings2,
  Sliders,
  ReceiptText,
} from "lucide-react";
import { toast } from "sonner";

import type { TablesUpdate } from "@/integrations/supabase/types";
import { QuoteFlowLogo } from "@/components/QuoteFlowLogo";
import { SkeletonDashboard } from "@/components/skeletons/SkeletonDashboard";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  slugify,
  vehicleLabel,
  type PackageItem,
  type Profile,
  type Quote,
  type ServiceItem,
  type VehicleCategory,
} from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Detailr (detailr.online)" },
      {
        name: "description",
        content: "Manage your auto detailing quote requests, pricing rates, and Telegram alerts.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
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
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-surface pb-16 text-foreground">
      {/* Clean Minimal Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <QuoteFlowLogo size="sm" linkToHome />
          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-border">
                <img
                  src={profile.logo_url || "/favicon.png"}
                  alt={profile.business_name}
                  className="size-6 rounded-md border border-border object-contain bg-background"
                />
                <span className="text-xs font-semibold max-w-[160px] truncate">
                  {profile.business_name}
                </span>
              </div>
            )}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 text-xs font-semibold px-2.5"
            >
              <Link to="/upgrade">
                <CreditCard className="size-3 mr-1" /> Pro Plan
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
              onClick={signOut}
            >
              <LogOut className="size-3 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 py-6">
        {profile ? (
          <>
            <TrialBanner />

            {/* Top Grid: Key Overview & Actions */}
            <TopMetricsGrid profile={profile} quotes={quotes ?? []} />

            {/* Dedicated Link Testing & Logo Showcase Banner */}
            <LinkTestingBanner profile={profile} />

            {/* Segmented View Container */}
            <Tabs defaultValue="quotes" className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <TabsList className="bg-muted/80 p-1 h-9 rounded-lg">
                  <TabsTrigger
                    value="quotes"
                    className="text-xs font-semibold gap-1.5 px-3 rounded-md"
                  >
                    <ReceiptText className="size-3.5" /> Quote Requests ({quotes?.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="pricing"
                    className="text-xs font-semibold gap-1.5 px-3 rounded-md"
                  >
                    <Sliders className="size-3.5" /> Pricing & Services
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="text-xs font-semibold gap-1.5 px-3 rounded-md"
                  >
                    <Settings2 className="size-3.5" /> Settings & Bot
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: Quote Requests */}
              <TabsContent value="quotes" className="focus-visible:outline-none">
                <QuoteHistoryCard
                  quotes={quotes ?? []}
                  currency={profile.currency}
                  timezone={profile.timezone}
                  services={parseServices(profile.services)}
                  categories={parseVehicleCategories(profile.vehicle_categories)}
                />
              </TabsContent>

              {/* TAB 2: Pricing */}
              <TabsContent value="pricing" className="focus-visible:outline-none">
                <PricingCard profile={profile} />
              </TabsContent>

              {/* TAB 3: Settings */}
              <TabsContent value="settings" className="space-y-5 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <BusinessProfileCard profile={profile} />
                  <NotificationSettingsCard profile={profile} />
                </div>
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

function LinkTestingBanner({ profile }: { profile: Profile }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);
  const liveUrl = origin ? `${origin}/${profile.slug}` : `https://detailr.online/${profile.slug}`;
  const connected = !!profile.telegram_chat_id;

  const copyLive = () => {
    void navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    toast.success("Quote link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const sendTest = async () => {
    setSendingTest(true);
    try {
      const result = await sendQuoteAlert({
        data: {
          detailerId: profile.id,
          customerName: "Alex Morgan (Test Lead)",
          customerPhone: profile.phone || "+1 555-019-2834",
          vehicle: "2024 Tesla Model Y (Midsize SUV)",
          service: { label: "Full Detail", price: 190 },
          addons: [{ label: "Pet Hair Removal", price: 40 }],
          estimate: 230,
          notes: "Sample test lead triggered from your dashboard!",
          isTest: true,
        },
      });
      if (result?.sent) {
        toast.success("Test alert sent to your Telegram chat!");
      } else if (result?.reason === "not_connected") {
        toast.error("Please connect your Telegram bot first in Settings & Bot.");
      } else {
        toast.error("Could not send test alert.");
      }
    } catch {
      toast.error("Could not send test alert.");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Shop Logo & URL */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={profile.logo_url || "/favicon.png"}
                alt={profile.business_name}
                referrerPolicy="no-referrer"
                className="size-11 rounded-xl border border-border bg-background p-1 object-contain shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white font-bold ring-2 ring-background">
                ✓
              </span>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">{profile.business_name}</span>
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Form
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Your Link:</span>
                <code className="font-mono text-xs font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border truncate max-w-[280px] sm:max-w-md">
                  {liveUrl}
                </code>
              </div>
            </div>
          </div>

          {/* Action Buttons: Test Link, Live Link, Copy */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              asChild
              variant="default"
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5 bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
            >
              <Link
                to="/$business_slug"
                params={{ business_slug: profile.slug }}
                search={{ test: true }}
                target="_blank"
              >
                <FlaskConical className="size-3.5" /> Test Quote Link
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5"
            >
              <Link
                to="/$business_slug"
                params={{ business_slug: profile.slug }}
                search={{}}
                target="_blank"
              >
                <Globe className="size-3.5 text-muted-foreground" /> View Live
              </Link>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5"
              onClick={copyLive}
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy Link"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
              disabled={sendingTest}
              onClick={sendTest}
              title="Send a sample quote alert to your Telegram bot"
            >
              {sendingTest ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5 text-blue-500" />
              )}
              Send Test Alert
            </Button>
          </div>
        </div>

        {/* Informative testing guidance footer */}
        <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">💡 How to test your link:</span>
            <span>
              Click <strong>Test Quote Link</strong> to open your calculator in Sandbox Mode. Submit
              sample cars to hear your Telegram bot chime without distorting real sales stats.
            </span>
          </div>
          {connected ? (
            <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Bot connected
            </span>
          ) : (
            <span className="text-amber-600 font-medium inline-flex items-center gap-1">
              ⚠️ Connect Telegram bot in Settings & Bot
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TopMetricsGrid({ profile, quotes }: { profile: Profile; quotes: Quote[] }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);
  const quoteUrl = `${origin}/${profile.slug}`;
  const connected = !!profile.telegram_chat_id;

  const totalPipeline = quotes.reduce((acc, q) => acc + (Number(q.estimated_price) || 0), 0);
  const avgQuote = quotes.length ? Math.round(totalPipeline / quotes.length) : 0;
  const realQuotes = quotes.filter((q) => !q.is_test);

  const handleCopy = () => {
    void navigator.clipboard.writeText(quoteUrl);
    setCopied(true);
    toast.success("Quote form link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const sendTest = async () => {
    setSendingTest(true);
    try {
      const result = await sendQuoteAlert({
        data: {
          detailerId: profile.id,
          customerName: "Alex Morgan",
          customerPhone: profile.phone || "+1 555-019-2834",
          vehicle: "2024 Tesla Model Y (Midsize SUV)",
          service: { label: "Full Detail", price: 190 },
          addons: [{ label: "Pet Hair Removal", price: 40 }],
          estimate: 230,
          notes: "Need it done this weekend!",
          isTest: true,
        },
      });
      if (result?.sent) {
        toast.success("Test alert sent to your Telegram chat!");
      } else if (result?.reason === "not_connected") {
        toast.error("Please connect your Telegram bot first.");
      } else {
        toast.error("Could not send test alert.");
      }
    } catch {
      toast.error("Could not send test alert.");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Card 1: Live Quote Link with Shop Logo */}
      <Card className="border-border/80 shadow-xs flex flex-col justify-between">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Your Quote Link
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-1.5">
            <img
              src={profile.logo_url || "/favicon.png"}
              alt={profile.business_name}
              referrerPolicy="no-referrer"
              className="size-6 rounded border border-border/80 bg-background object-contain shrink-0 shadow-2xs"
            />
            <span className="font-mono text-xs font-medium truncate text-foreground flex-1">
              {origin
                ? `${origin.replace(/^https?:\/\//, "")}/${profile.slug}`
                : `detailr.online/${profile.slug}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 text-xs font-semibold px-2"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-3 text-emerald-600 mr-1" />
              ) : (
                <Copy className="size-3 mr-1" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              asChild
              variant="default"
              size="sm"
              className="h-7 text-xs font-semibold px-2 gap-1 bg-amber-500 hover:bg-amber-600 text-white"
              title="Test quote link in sandbox mode"
            >
              <Link
                to="/$business_slug"
                params={{ business_slug: profile.slug }}
                search={{ test: true }}
                target="_blank"
              >
                <FlaskConical className="size-3" />
                <span>Test</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="h-7 text-xs font-semibold px-2"
              title="View live customer form"
            >
              <Link
                to="/$business_slug"
                params={{ business_slug: profile.slug }}
                search={{}}
                target="_blank"
              >
                <ExternalLink className="size-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Total Pipeline */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Pipeline Value
            </span>
            <DollarSign className="size-3.5 text-emerald-600" />
          </div>
          <p className="font-display text-2xl font-bold text-emerald-600">
            {money(totalPipeline, profile.currency)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {realQuotes.length} customer lead{realQuotes.length === 1 ? "" : "s"} ({quotes.length}{" "}
            total)
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Avg Ticket */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Average Ticket
            </span>
            <TrendingUp className="size-3.5 text-blue-500" />
          </div>
          <p className="font-display text-2xl font-bold text-foreground">
            {money(avgQuote, profile.currency)}
          </p>
          <p className="text-[11px] text-muted-foreground">Estimated revenue per job</p>
        </CardContent>
      </Card>

      {/* Card 4: Telegram Alerts Status */}
      <Card className="border-border/80 shadow-xs flex flex-col justify-between">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Telegram Alerts
            </span>
            <Send className="size-3.5 text-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`size-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            <span className="text-xs font-bold">{connected ? "Bot Connected" : "Not Linked"}</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {connected ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-full text-xs font-semibold"
                disabled={sendingTest}
                onClick={sendTest}
              >
                {sendingTest ? (
                  <Loader2 className="size-3 animate-spin mr-1" />
                ) : (
                  <Send className="size-3 mr-1" />
                )}
                Send Test Alert
              </Button>
            ) : (
              <Button asChild variant="hero" size="sm" className="h-7 w-full text-xs font-semibold">
                <a href="#settings">Connect Bot</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuoteHistoryCard({
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
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-sm font-bold">Incoming Customer Quotes</CardTitle>
          <CardDescription className="text-xs">
            Review customer vehicle specs, requested packages, and initiate 1-tap contact.
          </CardDescription>
        </div>

        <div className="flex items-center gap-3">
          {testCount > 0 && (
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
              <span>Show tests ({testCount})</span>
              <Switch
                checked={showTests}
                aria-label="Show test requests"
                onCheckedChange={setShowTests}
              />
            </label>
          )}
        </div>
      </CardHeader>

      {/* Filter bar */}
      {quotes.length > 0 && (
        <div className="border-b border-border/80 px-4 py-2 bg-muted/20">
          <div className="relative max-w-xs">
            <Search className="absolute top-1/2 left-2.5 size-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter customer name, phone, or car..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 text-xs bg-background"
            />
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <p className="mt-2.5 text-xs font-semibold text-foreground">
              {searchQuery ? "No matching quotes found" : "No quote requests yet"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground max-w-xs mx-auto">
              {searchQuery
                ? "Clear your search term to see all incoming leads."
                : "Share your quote link to begin receiving customer requests."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] h-9">Customer</TableHead>
                  <TableHead className="text-[11px] h-9">Contact</TableHead>
                  <TableHead className="text-[11px] h-9">Vehicle</TableHead>
                  <TableHead className="text-[11px] h-9">Package</TableHead>
                  <TableHead className="text-[11px] h-9">Add-ons</TableHead>
                  <TableHead className="text-[11px] h-9">Notes / Photos</TableHead>
                  <TableHead className="text-[11px] h-9 text-right">Estimate</TableHead>
                  <TableHead className="text-[11px] h-9 text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((q) => (
                  <TableRow key={q.id} className={q.is_test ? "opacity-75 bg-muted/20" : undefined}>
                    <TableCell className="font-semibold text-xs py-2.5">
                      <div className="flex items-center gap-1.5">
                        {q.customer_name}
                        {q.is_test && (
                          <Badge variant="secondary" className="text-[9px] py-0 px-1">
                            TEST
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${q.customer_phone}`}
                          title={`Call ${q.customer_name}`}
                          className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-500/20"
                        >
                          <Phone className="size-2.5" /> Call
                        </a>
                        <a
                          href={`sms:${q.customer_phone}`}
                          title={`SMS ${q.customer_name}`}
                          className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-500/20"
                        >
                          <MessageSquare className="size-2.5" /> SMS
                        </a>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs py-2.5">
                      <span className="block font-medium">
                        {q.vehicle_desc || vehicleLabel(q.vehicle_type, categories)}
                      </span>
                      {q.vehicle_desc && (
                        <span className="text-[10px] text-muted-foreground">
                          {vehicleLabel(q.vehicle_type, categories)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs py-2.5">
                      <span className="font-medium">{q.service_label || "—"}</span>
                      {q.service_price ? (
                        <span className="block text-[10px] text-muted-foreground">
                          {money(Number(q.service_price), q.currency || currency)}
                        </span>
                      ) : null}
                    </TableCell>

                    <TableCell className="text-[11px] text-muted-foreground py-2.5">
                      {q.addons.length
                        ? q.addons.map((a) => addonLabel(a, services)).join(", ")
                        : "—"}
                    </TableCell>

                    <TableCell className="text-xs py-2.5">
                      <div className="flex items-center gap-1.5">
                        {q.photo_urls?.length ? (
                          <PhotoDialog paths={q.photo_urls} customer={q.customer_name} />
                        ) : null}
                        {q.notes?.trim() ? (
                          <span
                            className="max-w-[120px] truncate text-[11px] text-muted-foreground"
                            title={q.notes}
                          >
                            {q.notes}
                          </span>
                        ) : (
                          !q.photo_urls?.length && (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          )
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right py-2.5">
                      <span className="font-display font-bold text-xs">
                        {money(Number(q.estimated_price), q.currency || currency)}
                      </span>
                    </TableCell>

                    <TableCell className="text-right text-[10px] text-muted-foreground py-2.5">
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
    phone: profile.phone ?? "",
    logo_url: profile.logo_url ?? "",
    currency: profile.currency,
    timezone: profile.timezone,
  });
  const save = useProfileUpdate("Profile settings saved");

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold">Shop Profile</CardTitle>
        <CardDescription className="text-xs">
          Manage your detailing company name, quote link, and locale.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="business_name" className="text-xs">
            Business name
          </Label>
          <Input
            id="business_name"
            value={form.business_name}
            onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="slug" className="text-xs">
              Quote Link Slug
            </Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              className="h-8 text-xs font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs">
              Phone Number
            </Label>
            <Input
              id="phone"
              value={form.phone}
              inputMode="tel"
              placeholder="+1 555 010 2020"
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="text-xs">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Timezone</Label>
            <Select
              value={form.timezone}
              onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Time zone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz} className="text-xs">
                    {tz.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo_url" className="text-xs">
            Logo / Avatar URL
          </Label>
          <div className="flex items-center gap-2.5">
            <img
              src={form.logo_url || "/favicon.png"}
              alt="Logo preview"
              referrerPolicy="no-referrer"
              className="size-9 rounded-lg border border-border bg-background p-1 object-contain shrink-0 shadow-xs"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/favicon.png";
              }}
            />
            <Input
              id="logo_url"
              value={form.logo_url}
              placeholder="https://... or /favicon.png"
              onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
              className="h-8 text-xs flex-1"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Shown next to your quote link, on your customer quote form, in Telegram alerts, and as
            your preview card image when sharing your link on social media.
          </p>

          {/* Social media share card preview */}
          <div className="rounded-lg border border-border/70 bg-surface/50 p-2.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <Share2 className="size-3 text-primary" />
                Social Media Share Preview
              </span>
              <span className="text-[10px]">iMessage • WhatsApp • X • Facebook</span>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-border/80 bg-background p-2 shadow-2xs">
              <img
                src={form.logo_url || "/favicon.png"}
                alt="Social preview thumbnail"
                referrerPolicy="no-referrer"
                className="size-12 rounded-lg border border-border/80 bg-surface object-contain p-1 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/favicon.png";
                }}
              />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-bold text-foreground">
                  {form.business_name || "Your Business"} — Instant Auto Detailing Quote
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {form.tagline ||
                    "Select vehicle type and get an instant mobile detailing estimate."}
                </p>
                <p className="truncate text-[10px] text-primary/90 mt-0.5 font-mono">
                  detailr.online/{form.slug || "your-link"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            variant="hero"
            size="sm"
            className="h-8 text-xs font-semibold"
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
            {save.isPending && <Loader2 className="size-3 animate-spin mr-1" />}
            Save Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettingsCard({ profile }: { profile: Profile }) {
  const [settings, setSettings] = useState({
    notify_telegram: profile.notify_telegram,
    notify_include_photos: profile.notify_include_photos,
    notify_include_notes: profile.notify_include_notes,
    allow_photos: profile.allow_photos,
  });
  const save = useProfileUpdate("Notification preferences saved");

  const rows: { key: keyof typeof settings; label: string; sub: string }[] = [
    {
      key: "notify_telegram",
      label: "Send Telegram instant alerts",
      sub: "Receive quote notifications in real time",
    },
    {
      key: "notify_include_photos",
      label: "Include photos in alerts",
      sub: "Send vehicle photos directly in Telegram",
    },
    {
      key: "notify_include_notes",
      label: "Include customer notes",
      sub: "Include extra notes in alert payload",
    },
    {
      key: "allow_photos",
      label: "Allow photo uploads",
      sub: "Let customers attach up to 5 vehicle photos",
    },
  ];

  const prepare = useMutation({
    mutationFn: () => prepareTelegramLink(),
    onSuccess: ({ href }) => window.open(href, "_blank", "noopener,noreferrer"),
    onError: (error: Error) => toast.error(error.message || "Failed to start Telegram connection"),
  });

  return (
    <Card className="border-border/80 shadow-xs flex flex-col justify-between" id="settings">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">Telegram Bot & Notifications</CardTitle>
            <Badge
              variant={profile.telegram_chat_id ? "default" : "secondary"}
              className="text-[10px]"
            >
              {profile.telegram_chat_id ? "Connected" : "Unlinked"}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Connect your Telegram chat for real-time lead alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5">
          <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="font-semibold block">Telegram Connection</span>
              <span className="text-muted-foreground text-[11px]">
                {profile.telegram_chat_id
                  ? "Active and receiving leads"
                  : "Tap to open bot and start"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-semibold"
              disabled={prepare.isPending}
              onClick={() => prepare.mutate()}
            >
              <Send className="size-3 mr-1 text-blue-500" />
              {profile.telegram_chat_id ? "Reconnect" : "Connect"}
            </Button>
          </div>

          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {rows.map((r) => (
              <div key={r.key} className="flex items-center justify-between p-2.5 text-xs">
                <span className="min-w-0 pr-2">
                  <span className="block font-medium">{r.label}</span>
                  <span className="text-[10px] text-muted-foreground">{r.sub}</span>
                </span>
                <Switch
                  checked={settings[r.key]}
                  aria-label={r.label}
                  onCheckedChange={(checked) => setSettings((s) => ({ ...s, [r.key]: checked }))}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </div>

      <div className="p-4 pt-0 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold"
          disabled={save.isPending}
          onClick={() => save.mutate({ id: profile.id, ...settings })}
        >
          {save.isPending && <Loader2 className="size-3 animate-spin mr-1" />}
          Save Preferences
        </Button>
      </div>
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
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {items.map((s, i) => (
        <div
          key={s.key}
          className={`flex items-center gap-3 p-2.5 text-xs ${s.enabled ? "" : "opacity-50"}`}
        >
          <Switch
            checked={s.enabled}
            aria-label={`Offer ${s.label}`}
            onCheckedChange={(checked) => patch(i, { enabled: checked })}
          />
          <div className="min-w-0 flex-1 space-y-0.5">
            <Input
              aria-label={`${s.label} name`}
              className="h-7 text-xs font-semibold px-2"
              value={s.label}
              onChange={(e) => patch(i, { label: e.target.value })}
            />
            <Input
              aria-label={`${s.label} description`}
              placeholder="Short description"
              className="h-6 text-[11px] px-2 text-muted-foreground"
              value={s.sub}
              onChange={(e) => patch(i, { sub: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground">{unitLabel}</span>
            <Input
              type="number"
              step={1}
              inputMode="numeric"
              aria-label={`${s.label} ${unitLabel} in ${currency}`}
              className="h-7 w-20 text-right font-mono text-xs font-bold px-2"
              value={s[field] === 0 ? "0" : s[field] || ""}
              onChange={(e) => patch(i, { [field]: Number(e.target.value) || 0 })}
            />
            {!lockedKeys.includes(s.key) && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${s.label}`}
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PricingCard({ profile }: { profile: Profile }) {
  const save = useProfileUpdate("Pricing rates saved");
  const currency = profile.currency;

  const [categories, setCategories] = useState<VehicleCategory[]>(() =>
    parseVehicleCategories(profile.vehicle_categories),
  );
  const [packages, setPackages] = useState<PackageItem[]>(() => parsePackages(profile.packages));
  const [addons, setAddons] = useState<ServiceItem[]>(() => parseServices(profile.services));

  const addCategory = () => {
    const label = "Extra Large / Dually";
    const key = makeKey(
      label,
      categories.map((c) => c.key),
    );
    setCategories((prev) => [
      ...prev,
      { key, label, sub: "Long bed or dually truck", uplift: 40, enabled: true },
    ]);
  };

  const addPackage = () => {
    const label = "Ceramic Coating";
    const key = makeKey(
      label,
      packages.map((p) => p.key),
    );
    setPackages((prev) => [
      ...prev,
      { key, label, sub: "Paint prep & 3-yr ceramic coating", price: 500, enabled: true },
    ]);
  };

  const addAddon = () => {
    const label = "Engine Bay Clean";
    const key = makeKey(
      label,
      addons.map((a) => a.key),
    );
    setAddons((prev) => [
      ...prev,
      { key, label, sub: "Degreased and dressed", price: 45, enabled: true },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sizing Card */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex-row items-center justify-between pb-2.5">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider">
                1. Vehicle Size Uplift
              </CardTitle>
              <CardDescription className="text-[11px]">
                Size fee added on top of packages.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2"
              onClick={addCategory}
            >
              <Plus className="size-3 mr-0.5" /> Add
            </Button>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <EditableRows
              items={categories}
              field="uplift"
              unitLabel={`+${currency}`}
              currency={currency}
              lockedKeys={DEFAULT_VEHICLE_CATEGORIES.map((c) => c.key)}
              onChange={setCategories}
            />
          </CardContent>
        </Card>

        {/* Packages Card */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex-row items-center justify-between pb-2.5">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider">
                2. Primary Packages
              </CardTitle>
              <CardDescription className="text-[11px]">
                Base rates for detailing services.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2" onClick={addPackage}>
              <Plus className="size-3 mr-0.5" /> Add
            </Button>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <EditableRows
              items={packages}
              field="price"
              unitLabel={currency}
              currency={currency}
              lockedKeys={DEFAULT_PACKAGES.map((p) => p.key)}
              onChange={setPackages}
            />
          </CardContent>
        </Card>

        {/* Addons Card */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex-row items-center justify-between pb-2.5">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider">
                3. Add-On Services
              </CardTitle>
              <CardDescription className="text-[11px]">
                Optional extras customers can add.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2" onClick={addAddon}>
              <Plus className="size-3 mr-0.5" /> Add
            </Button>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <EditableRows
              items={addons}
              field="price"
              unitLabel={currency}
              currency={currency}
              lockedKeys={DEFAULT_SERVICES.map((s) => s.key)}
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
          className="h-8 font-bold text-xs"
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
          {save.isPending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
          Save Pricing Configuration
        </Button>
      </div>
    </div>
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
      <Button
        variant="outline"
        size="sm"
        className="h-6 text-[10px] px-1.5 gap-1"
        onClick={() => void load()}
      >
        <ImageIcon className="size-2.5" /> {paths.length}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Photos from {customer}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              {urls.map((u) => (
                <a key={u} href={u} target="_blank" rel="noreferrer">
                  <img
                    src={u}
                    alt={`Photo from ${customer}`}
                    loading="lazy"
                    className="aspect-square w-full rounded-md border border-border object-cover hover:opacity-95"
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
    <Card className="mx-auto max-w-sm shadow-xs border-border/80">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Set up your Detailing Shop</CardTitle>
        <CardDescription className="text-xs">
          Enter your company name to generate your instant customer quote form.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3.5">
        <div className="space-y-1">
          <Label htmlFor="ob-name" className="text-xs">
            Business name
          </Label>
          <Input
            id="ob-name"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              setSlug(slugify(e.target.value));
            }}
            placeholder="Apex Auto Detailing"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ob-slug" className="text-xs">
            Quote link slug
          </Label>
          <Input
            id="ob-slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="apex-auto-detailing"
            className="h-8 text-xs font-mono"
          />
        </div>
        <Button
          variant="hero"
          size="sm"
          className="w-full font-bold h-8 text-xs mt-2"
          disabled={!businessName.trim() || create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending && <Loader2 className="size-3 animate-spin mr-1" />}
          Create Quote Form
        </Button>
      </CardContent>
    </Card>
  );
}

function TrialBanner() {
  const fetchTrial = useServerFn(getTrialState);
  const { data: trial, isLoading } = useQuery({
    queryKey: ["trial-state"],
    queryFn: async () => fetchTrial(),
  });

  if (isLoading || !trial) return null;
  const { status, daysLeft } = trial;

  if (status === "ACTIVE") return null;

  if (status === "TRIALING") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-950 dark:text-amber-200">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-amber-600 shrink-0" />
          <span>
            <strong className="font-bold">7-Day Free Trial</strong> ({daysLeft}{" "}
            {daysLeft === 1 ? "day" : "days"} remaining)
          </span>
        </div>
        <Button asChild variant="hero" size="sm" className="h-6 text-[11px] font-semibold px-2.5">
          <Link to="/upgrade">Upgrade ($9.99/mo)</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs text-destructive">
      <div className="flex items-center gap-2">
        <CreditCard className="size-3.5 shrink-0" />
        <span>Trial expired. Upgrade to keep receiving quote requests.</span>
      </div>
      <Button asChild variant="hero" size="sm" className="h-6 text-[11px] font-semibold px-2.5">
        <Link to="/upgrade">Activate Pro ($9.99/mo)</Link>
      </Button>
    </div>
  );
}
