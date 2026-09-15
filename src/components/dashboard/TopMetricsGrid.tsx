import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  Copy,
  DollarSign,
  ExternalLink,
  FlaskConical,
  Loader2,
  Send,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { money } from "@/lib/pricing";
import { sendQuoteAlert } from "@/lib/telegram.functions";
import type { Profile, Quote } from "./types";
import { TelegramConnectModal } from "./TelegramConnectModal";

export function TopMetricsGrid({
  profile,
  quotes,
  onSelectTab,
}: {
  profile: Profile;
  quotes: Quote[];
  onSelectTab?: (tab: string) => void;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Live Quote Link with Shop Logo */}
      <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm transition-all hover:border-border hover:shadow-md flex flex-col justify-between">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-widest text-[9px] opacity-70">
              Your Quote Link
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/50 p-2">
            <img
              src={profile.logo_url || "/favicon.png"}
              alt={profile.business_name}
              referrerPolicy="no-referrer"
              className="size-7 rounded-lg border border-border/80 bg-background object-contain shrink-0 shadow-sm"
            />
            <span className="font-mono text-[11px] font-semibold truncate text-foreground flex-1">
              {origin
                ? `${origin.replace(/^https?:\/\//, "")}/${profile.slug}`
                : `detailr.online/${profile.slug}`}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-1 text-[11px] font-bold px-2 rounded-lg border-border/80 hover:bg-surface"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-3 text-emerald-600 mr-1.5" />
              ) : (
                <Copy className="size-3 mr-1.5 opacity-70" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              asChild
              variant="default"
              size="sm"
              className="h-8 text-[11px] font-bold px-3 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm"
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
              className="h-8 size-8 p-0 shrink-0 font-bold rounded-lg"
              title="View live customer form"
            >
              <Link
                to="/$business_slug"
                params={{ business_slug: profile.slug }}
                search={{}}
                target="_blank"
              >
                <ExternalLink className="size-3 opacity-70" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Total Pipeline */}
      <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm transition-all hover:border-border hover:shadow-md">
        <CardContent className="p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-widest text-[9px] opacity-70">
              Pipeline Value
            </span>
            <div className="size-6 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <DollarSign className="size-3.5" />
            </div>
          </div>
          <p className="font-display text-2xl font-bold tracking-tight text-emerald-600">
            {money(totalPipeline, profile.currency)}
          </p>
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-border" />
            {realQuotes.length} customer lead{realQuotes.length === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Avg Ticket */}
      <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm transition-all hover:border-border hover:shadow-md">
        <CardContent className="p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-widest text-[9px] opacity-70">
              Average Ticket
            </span>
            <div className="size-6 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <TrendingUp className="size-3.5" />
            </div>
          </div>
          <p className="font-display text-2xl font-bold tracking-tight text-foreground">
            {money(avgQuote, profile.currency)}
          </p>
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-border" />
            Estimated revenue per job
          </p>
        </CardContent>
      </Card>

      {/* Card 4: Telegram Alerts Status */}
      <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm transition-all hover:border-border hover:shadow-md flex flex-col justify-between">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-widest text-[9px] opacity-70">
              Telegram Alerts
            </span>
            <div className="size-6 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Send className="size-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ring-4 ${
                connected ? "bg-emerald-500 ring-emerald-500/10" : "bg-amber-500 ring-amber-500/10"
              }`}
            />
            <span className="text-xs font-bold tracking-tight">
              {connected ? "Bot Connected" : "Not Linked"}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {connected ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full text-[11px] font-bold rounded-lg border-border/80 hover:bg-surface"
                disabled={sendingTest}
                onClick={sendTest}
              >
                {sendingTest ? (
                  <Loader2 className="size-3 animate-spin mr-2" />
                ) : (
                  <Send className="size-3 mr-2 opacity-70" />
                )}
                Send Test Alert
              </Button>
            ) : (
              <Button
                variant="hero"
                size="sm"
                className="h-8 w-full text-[11px] font-bold rounded-lg shadow-sm"
                onClick={() => setConnectModalOpen(true)}
              >
                Connect Bot
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <TelegramConnectModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        profile={profile}
      />
    </div>
  );
}
