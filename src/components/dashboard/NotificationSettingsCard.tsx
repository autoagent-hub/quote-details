import { useState } from "react";
import { Loader2, Send, ShieldCheck, Check, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { sendQuoteAlert } from "@/lib/telegram.functions";
import type { Profile } from "./types";
import { useProfileUpdate } from "./useProfileUpdate";
import { TelegramConnectModal } from "./TelegramConnectModal";

export function NotificationSettingsCard({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState({
    notify_telegram: profile.notify_telegram,
    notify_include_photos: profile.notify_include_photos,
    notify_include_notes: profile.notify_include_notes,
    allow_photos: profile.allow_photos,
  });
  const save = useProfileUpdate("Notification preferences saved");

  const isConnected = !!profile.telegram_chat_id;

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
        toast.success("🎉 Success! Test alert received on your phone.");
        void queryClient.invalidateQueries({ queryKey: ["profile"] });
      } else {
        toast.error("Not connected yet. Please tap 'Link Bot' and press Start in Telegram!");
      }
    } catch {
      toast.error("Could not test connection. Ensure you pressed Start in Telegram.");
    } finally {
      setTesting(false);
    }
  };

  const rows: { key: keyof typeof settings; label: string; sub: string }[] = [
    {
      key: "notify_telegram",
      label: "Telegram Instant Alerts",
      sub: "Receive leads in real time on your phone",
    },
    {
      key: "notify_include_photos",
      label: "Include Photos in Alerts",
      sub: "Send vehicle photos directly in the chat",
    },
    {
      key: "notify_include_notes",
      label: "Include Customer Notes",
      sub: "Show custom messages in the alert payload",
    },
    {
      key: "allow_photos",
      label: "Customer Photo Uploads",
      sub: "Let customers attach up to 5 vehicle photos",
    },
  ];

  return (
    <>
      <Card
        className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm flex flex-col justify-between"
        id="settings"
      >
        <div>
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                Alerts & Bot
              </CardTitle>
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className={`text-[9px] font-bold px-2 h-5 rounded-full ${isConnected ? "bg-primary/10 text-primary border-primary/20" : ""}`}
              >
                {isConnected ? "BOT ACTIVE · 1:1 LOCKED" : "UNLINKED"}
              </Badge>
            </div>
            <CardDescription className="text-xs font-medium text-muted-foreground/70">
              Connect your Telegram chat for real-time customer lead alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6">
            <div className="rounded-2xl border border-border bg-muted/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-blue-500" />
                  Telegram 1:1 Connection
                </span>
                <span className="text-muted-foreground text-[10px] font-medium leading-tight block max-w-sm">
                  {isConnected
                    ? `Active on Chat ID ${profile.telegram_chat_id}. Protected against lead hijacking.`
                    : "Tap Link Bot to connect your shop exclusively to our Telegram bot."}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] font-bold rounded-xl border-blue-500/30 bg-blue-500/10 text-primary hover:bg-blue-500/20 transition-all gap-1.5"
                    disabled={testing}
                    onClick={testAlert}
                  >
                    {testing ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Send className="size-3 text-blue-500" />
                    )}
                    <span>{testing ? "Sending..." : "Test Telegram"}</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px] font-bold rounded-xl border-border/80 bg-background/50 hover:bg-background transition-all"
                  onClick={() => setConnectModalOpen(true)}
                >
                  <Sparkles className="size-3 mr-1.5 text-amber-500" />
                  {isConnected ? "Manage Bot" : "Link Bot"}
                </Button>
              </div>
            </div>

            <div className="space-y-1 rounded-2xl border border-border/60 bg-background/30 overflow-hidden divide-y divide-border/40">
              {rows.map((r) => (
                <div
                  key={r.key}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/10"
                >
                  <div className="min-w-0 pr-4 space-y-0.5">
                    <span className="block font-bold text-xs tracking-tight">{r.label}</span>
                    <span className="text-[10px] font-medium text-muted-foreground/70">
                      {r.sub}
                    </span>
                  </div>
                  <Switch
                    checked={settings[r.key]}
                    aria-label={r.label}
                    onCheckedChange={(checked) => setSettings((s) => ({ ...s, [r.key]: checked }))}
                    className="scale-90"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </div>

        <div className="p-6 pt-0 flex justify-end">
          <Button
            variant="hero"
            size="sm"
            className="h-9 px-8 font-bold text-xs rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={save.isPending}
            onClick={() => save.mutate({ id: profile.id, ...settings })}
          >
            {save.isPending && <Loader2 className="size-3 animate-spin mr-2" />}
            Save Alert Rules
          </Button>
        </div>
      </Card>

      <TelegramConnectModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        profile={profile}
      />
    </>
  );
}
