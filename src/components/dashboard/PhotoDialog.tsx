import { useState } from "react";
import { Image as ImageIcon, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export function PhotoDialog({ paths, customer }: { paths: string[]; customer: string }) {
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
        className="h-7 text-[10px] font-bold px-2.5 gap-1.5 rounded-lg border-border/60 hover:bg-muted/50 transition-all"
        onClick={() => void load()}
      >
        <ImageIcon className="size-3 text-primary/70" />
        <span>{paths.length} Photos</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl bg-transparent">
          <div className="bg-card p-6 border-b border-border/40">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between">
                <span>Vehicle Photos — {customer}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-70">
                  {paths.length} items
                </span>
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="bg-surface/95 backdrop-blur-xl p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider animate-pulse">
                  Retrieving encrypted assets...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {urls.map((u, i) => (
                  <div
                    key={u}
                    className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm transition-all hover:border-primary/40 hover:shadow-lg"
                  >
                    <img
                      src={u}
                      alt={`Vehicle photo ${i + 1} from ${customer}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <a
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-bold text-black shadow-xl scale-90 transition-transform group-hover:scale-100">
                        <ExternalLink className="size-3" /> View Original
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card p-4 border-t border-border/40 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 font-bold text-xs px-6 rounded-lg"
              onClick={() => setOpen(false)}
            >
              Close Gallery
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
