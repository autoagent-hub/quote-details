import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, AlertTriangle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QuoteForm } from "@/routes/$business_slug";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/test-bot")({
  component: TestBotPage,
});

function TestBotPage() {
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
      return data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div className="min-h-screen bg-surface">
      <QuoteForm
        extraBanner={
          <div className="bg-amber-500/10 text-amber-900 dark:text-amber-100 px-4 py-4 shadow-xs border-b border-amber-500/30 sticky top-0 z-40">
            <div className="mx-auto flex max-w-md items-center gap-3">
              <AlertTriangle className="size-8 text-amber-600 shrink-0" />
              <div>
                <h2 className="font-bold text-sm">Sandbox Test Mode</h2>
                <p className="text-xs opacity-90">
                  This is a test link. Testing here <strong>will not activate</strong> your 7-day free trial. The trial only activates when a customer uses your public link.
                </p>
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline" className="h-8 text-xs font-bold gap-1.5">
                    <Link to="/dashboard">
                      <ArrowLeft className="size-3.5" /> Back to Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
