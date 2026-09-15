import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Loader2, Send, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { prepareTelegramLink, sendQuoteAlert } from "@/lib/telegram.functions";
import type { Profile } from "./types";

export function TelegramConnectModal({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
}) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);

  const prepare = useMutation({
    mutationFn: () => prepareTelegramLink(),
    onError: (err: Error) => {
      toast.error(err.message || "Failed to generate Telegram connection link.");
    },
  });

  // Automatically fetch link when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen && !prepare.data && !prepare.isPending) {
      prepare.mutate();
    }
  };

  const linkData = prepare.data;
  const isConnected = !!profile.telegram_chat_id;

  const copyLink = () => {
    if (!linkData?.href) return;
    void navigator.clipboard.writeText(linkData.href);
    setCopied(true);
    toast.success("Telegram connection link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const testAlert = async () => {
    setTesting(true);
    try {
      const res = await sendQuoteAlert({
        data: {
          detailerId: profile.id,
          customerName: "Alex Morgan (Test Lead)",
          customerPhone: profile.phone || "+1 555-019-2834",
          vehicle: "2024 Tesla Model Y (Midsize SUV)",
          service: { label: "Full Detail", price: 190 },
          addons: [{ label: "Pet Hair Removal", price: 40 }],
          estimate: 230,
          notes: "Testing Telegram connection!",
          isTest: true,
        },
      });
      if (res?.sent) {
        toast.success("🎉 Success! Test alert received in Telegram.");
        void queryClient.invalidateQueries({ queryKey: ["profile"] });
      } else {
        toast.error("Not connected yet. Please tap 'Start' in Telegram first!");
      }
    } catch {
      toast.error("Could not test connection. Ensure you pressed Start in Telegram.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-border/80 bg-background/95 backdrop-blur-xl p-6 shadow-2xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 w-fit">
            <Send className="size-3.5" />
            <span>Instant Phone Alerts</span>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight font-display text-foreground">
            Connect Telegram Bot
          </DialogTitle>

          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Get instant customer quote requests pushed directly to your phone via Telegram.
          </DialogDescription>
        </DialogHeader>

        {prepare.isPending ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="size-8 animate-spin mx-auto text-blue-500" />
            <p className="text-xs font-semibold text-muted-foreground">
              Generating secure bot connection link...
            </p>
          </div>
        ) : linkData ? (
          <div className="space-y-5 pt-2">
            {/* Direct Open Button (Unblockable HTML <a> tag) */}
            <div className="space-y-2">
              <Button
                asChild
                variant="default"
                size="lg"
                className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm gap-2.5 shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <a href={linkData.href} target="_blank" rel="noopener noreferrer">
                  <Send className="size-4" />
                  <span>Open Telegram Bot App</span>
                  <ExternalLink className="size-4 ml-auto opacity-70" />
                </a>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 rounded-xl border-border/60 text-xs font-bold gap-2 text-muted-foreground hover:text-foreground"
                onClick={copyLink}
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>{copied ? "Link Copied!" : "Copy Connection Link"}</span>
              </Button>
            </div>

            {/* Step by step guide */}
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" />
                How to connect:
              </h4>

              <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside font-medium leading-relaxed">
                <li>
                  Tap <strong>Open Telegram Bot App</strong> above.
                </li>
                <li>
                  Tap <strong>START</strong> at the bottom of the Telegram chat.
                </li>
                <li>
                  You will get a message: <em>"Shop Connected!"</em>
                </li>
              </ol>
            </div>

            {/* Manual fallback code */}
            <div className="rounded-xl border border-border/40 bg-background/50 p-3 text-center space-y-1">
              <p className="text-[11px] text-muted-foreground font-medium">
                Or search <strong className="text-foreground">@{linkData.botUsername}</strong> in
                Telegram & send:
              </p>
              <code className="font-mono text-xs font-bold text-primary select-all bg-primary/10 px-2 py-0.5 rounded border border-primary/20 inline-block">
                /start {linkData.authCode}
              </code>
            </div>

            {/* Connection Test & Status Footer */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2.5 rounded-full ${
                    isConnected ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-amber-500"
                  }`}
                />
                <span className="text-xs font-bold">
                  {isConnected ? "Bot Active" : "Waiting for Start..."}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl px-3 text-xs font-bold border-border/60"
                disabled={testing}
                onClick={testAlert}
              >
                {testing ? (
                  <Loader2 className="size-3 animate-spin mr-1.5" />
                ) : (
                  <ShieldCheck className="size-3.5 mr-1.5 text-blue-500" />
                )}
                <span>Test Connection</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <p className="text-xs text-destructive font-semibold">
              Could not load connection link.
            </p>
            <Button variant="outline" size="sm" onClick={() => prepare.mutate()}>
              Retry
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
