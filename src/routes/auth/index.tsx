import { createFileRoute, Link, redirect, useSearch } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AuthCard, type AuthMode } from "@/components/auth/AuthCard";
import { supabase } from "@/integrations/supabase/client";

type AuthSearchParams = {
  mode?: "signin" | "signup" | "forgot";
};

export const Route = createFileRoute("/auth/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  validateSearch: (search: Record<string, unknown>): AuthSearchParams => {
    const mode = search["mode"] as string | undefined;
    if (mode === "signin" || mode === "signup" || mode === "forgot") {
      return { mode };
    }
    return {};
  },
  head: () => ({
    meta: [
      { title: "Sign In or Create Account — Detailr Online" },
      {
        name: "description",
        content:
          "Sign in or create your Detailr account to manage detailing pricing and quotes on Detailr Online.",
      },
      { property: "og:title", content: "Sign In or Create Account — Detailr Online" },
      { property: "og:description", content: "Access your Detailr Online detailer dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth/" });
  const initialMode: AuthMode = search.mode === "signin" ? "signin" : "signup";

  return (
    <div className="min-h-screen bg-surface px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto mb-6 flex max-w-5xl items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to home
        </Link>
      </div>

      <AuthCard initialMode={initialMode} />
    </div>
  );
}
