import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, FlaskConical, Globe, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { sendQuoteAlert } from "@/lib/telegram.functions";
import type { Profile } from "./types";

export function LinkTestingBanner({ profile }: { profile: Profile }) {
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
    <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden transition-all hover:border-border/80">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Shop Logo & URL */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0 group">
              <img
                src={profile.logo_url || "/favicon.png"}
                alt={profile.business_name}
                referrerPolicy="no-referrer"
                className="size-14 rounded-2xl border border-border/80 bg-background p-1.5 object-contain shadow-sm transition-transform group-hover:scale-105"
              />
              <span className="absolute -bottom-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-bold ring-4 ring-card">
                ✓
              </span>
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-bold text-base tracking-tight text-foreground">
                  {profile.business_name}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Shop Live
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                  Your Public Link:
                </span>
                <code className="font-mono text-xs font-bold text-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40 truncate max-w-[240px] sm:max-w-md">
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
              className="h-9 text-xs font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/10 rounded-xl px-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link
                to="/$business_slug"
                params={{ business_slug: profile.slug }}
                search={{ test: true }}
                target="_blank"
              >
                <FlaskConical className="size-4" /> Test Sandbox
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 text-xs font-bold gap-2 rounded-xl px-4 border-border/80 hover:bg-surface"
            >
              <Link
                to="/$business_slug"
                params={{ business_slug: profile.slug }}
                search={{}}
                target="_blank"
              >
                <Globe className="size-4 text-muted-foreground opacity-70" /> View Live
              </Link>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="h-9 text-xs font-bold gap-2 rounded-xl px-4 bg-muted/50 hover:bg-muted"
              onClick={copyLive}
            >
              {copied ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <Copy className="size-4 opacity-70" />
              )}
              {copied ? "Copied" : "Copy Link"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs font-bold gap-2 text-muted-foreground hover:text-foreground rounded-xl px-4"
              disabled={sendingTest}
              onClick={sendTest}
              title="Send a sample quote alert to your Telegram bot"
            >
              {sendingTest ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4 text-blue-500 opacity-70" />
              )}
              Send Test Alert
            </Button>
          </div>
        </div>

        {/* Informative testing guidance footer */}
        <div className="pt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-lg border border-border/40">
              💡 TIP
            </span>
            <span className="font-medium">
              Use <strong>Test Sandbox</strong> to simulate customer entries without affecting your
              real business analytics.
            </span>
          </div>
          {connected ? (
            <span className="text-emerald-600 font-bold inline-flex items-center gap-2 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Telegram Bot Active
            </span>
          ) : (
            <span className="text-amber-600 font-bold inline-flex items-center gap-2 bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10">
              ⚠️ Link your Telegram bot in settings
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
