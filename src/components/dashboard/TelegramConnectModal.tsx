import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  Lock,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  prepareTelegramLink,
  sendQuoteAlert,
  disconnectTelegramBot,
  getTelegramConnectionStatus,
} from "@/lib/telegram.functions";
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
  const fetchConnectionStatus = useServerFn(getTelegramConnectionStatus);

  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Live polling of Telegram connection status while modal is open
  const {
    data: liveStatus,
    refetch: refetchLiveStatus,
    isFetching: isCheckingStatus,
  } = useQuery({
    queryKey: ["telegram-connection-status", profile.id],
    queryFn: () => fetchConnectionStatus(),
    enabled: open,
    refetchInterval: (query) => {
      // If connected, slow polling to 10s; if awaiting user to tap /start in Telegram, poll every 1.5s
      const connected = !!query.state.data?.connected || !!profile.telegram_chat_id;
      return connected ? 10000 : 1500;
    },
    staleTime: 1000,
  });

  const effectiveChatId = liveStatus?.chatId || profile.telegram_chat_id;
  const isConnected = !!effectiveChatId;
  const effectiveBusinessName =
    liveStatus?.businessName || profile.business_name || "your detailing shop";

  // Automatically detect when bot is connected and update global profile cache without manual reload
  useEffect(() => {
    if (liveStatus?.connected && !profile.telegram_chat_id) {
      toast.success("🎉 Telegram bot connected and locked exclusively to your shop!");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["telegram-status"] });
    }
  }, [liveStatus?.connected, profile.telegram_chat_id, queryClient]);

  const prepare = useMutation({
    mutationFn: () => prepareTelegramLink(),
    onError: (err: Error) => {
      toast.error(err.message || "Failed to generate Telegram connection link.");
    },
  });

  // Automatically fetch link when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen) {
      void refetchLiveStatus();
      if (!prepare.data && !prepare.isPending) {
        prepare.mutate();
      }
    }
  };

  const linkData = prepare.data;

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
          notes: "Testing 1:1 Telegram lead connection!",
          isTest: true,
        },
      });
      if (res?.sent) {
        toast.success("🎉 Success! Test alert received in Telegram.");
        void queryClient.invalidateQueries({ queryKey: ["profile"] });
        void refetchLiveStatus();
      } else {
        toast.error("Not connected yet. Please tap 'Start' in Telegram first!");
      }
    } catch {
      toast.error("Could not test connection. Ensure you pressed Start in Telegram.");
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !window.confirm(
        "Are you sure you want to unlink this Telegram bot? You will stop receiving phone alerts for new leads until you reconnect.",
      )
    ) {
      return;
    }

    setDisconnecting(true);
    try {
      await disconnectTelegramBot();
      toast.success("Telegram bot unlinked successfully.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["telegram-connection-status"] }),
      ]);
      prepare.mutate();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to disconnect Telegram bot.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-border/80 bg-background/95 backdrop-blur-xl p-6 shadow-2xl">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Send className="size-4" />
            </div>
            <DialogTitle className="text-lg font-black tracking-tight text-foreground">
              {isConnected ? "Telegram Bot Active" : "Connect Telegram Bot"}
            </DialogTitle>
          </div>

          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Instant phone alerts for every incoming customer quote with phone number, car specs, and
            1-tap call shortcuts.
          </DialogDescription>
        </DialogHeader>

        {/* Active 1:1 Connection Banner (when linked) */}
        {isConnected && (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold text-foreground">
                  1:1 Exclusive Account Lock
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-primary px-2 py-0.5 rounded-full border border-blue-500/20">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Linked Chat ID:{" "}
              <code className="font-mono font-bold text-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                {effectiveChatId}
              </code>
              . This chat is bound exclusively to <strong>{effectiveBusinessName}</strong>. No other
              shop or user can intercept or hijack your customer leads.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl px-3 text-xs font-bold gap-1.5 border-blue-500/30 bg-blue-500/10 text-primary hover:bg-blue-500/20"
                disabled={testing}
                onClick={testAlert}
              >
                {testing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5 text-blue-500" />
                )}
                <span>Send Test Alert</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl px-2.5 text-xs font-bold text-destructive hover:bg-destructive/10 gap-1.5 ml-auto"
                disabled={disconnecting}
                onClick={handleDisconnect}
              >
                {disconnecting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                <span>Unlink Bot</span>
              </Button>
            </div>
          </div>
        )}

        {prepare.isPending ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="size-8 animate-spin mx-auto text-blue-500" />
            <p className="text-xs font-semibold text-muted-foreground">
              Generating secure single-use bot link...
            </p>
          </div>
        ) : linkData ? (
          <div className="space-y-4 pt-1">
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
                  <span>
                    {isConnected ? "Reconnect / Change Telegram App" : "Open Telegram Bot App"}
                  </span>
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
                  <Check className="size-3.5 text-primary" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>{copied ? "Link Copied!" : "Copy Single-Use Link"}</span>
              </Button>
            </div>

            {/* Anti-hijacking assurance box */}
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-3.5 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" />
                Anti-Lead-Hijacking Architecture:
              </h4>

              <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside font-medium leading-relaxed">
                <li>
                  <strong>Single-Use Tokens:</strong> Each connection link is cryptographically
                  generated and expires immediately after use.
                </li>
                <li>
                  <strong>1:1 Exclusive Account Lock:</strong> A Telegram account can only belong to
                  one shop. No duplicate or overlapping chats.
                </li>
                <li>
                  <strong>Auto-Healing Connection:</strong> Telegram webhook auto-syncs with
                  failover retry so you never drop incoming customer leads.
                </li>
              </ul>
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

            {/* Footer */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2.5 rounded-full ${
                    isConnected ? "bg-primary ring-4 ring-primary/20" : "bg-amber-500 animate-pulse"
                  }`}
                />
                <span className="font-bold">
                  {isConnected ? "Connected & Protected" : "Waiting for Start..."}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-xl px-2.5 text-xs font-bold gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      void refetchLiveStatus();
                      void queryClient.invalidateQueries({ queryKey: ["profile"] });
                    }}
                    disabled={isCheckingStatus}
                  >
                    <RefreshCw
                      className={`size-3 ${isCheckingStatus ? "animate-spin text-primary" : ""}`}
                    />
                    <span>{isCheckingStatus ? "Checking..." : "Verify Status"}</span>
                  </Button>
                )}

                {isConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl px-3 text-xs font-bold gap-1.5 border-blue-500/30 bg-blue-500/10 text-primary hover:bg-blue-500/20"
                    disabled={testing}
                    onClick={testAlert}
                  >
                    {testing ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Send className="size-3 text-blue-500" />
                    )}
                    <span>Test Alert</span>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl px-2.5 text-xs font-bold gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => prepare.mutate()}
                >
                  <RefreshCw className="size-3" />
                  <span>New Token</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <Lock className="size-8 mx-auto text-muted-foreground opacity-50" />
            <p className="text-xs text-muted-foreground">Click below to generate a secure link.</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold text-xs"
              onClick={() => prepare.mutate()}
            >
              Generate Link
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
