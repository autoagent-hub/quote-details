// Shared privileged Supabase client for server routes and server functions.
// Falls back to the EXTERNAL_* variables when this project points at an
// external Supabase project instead of a managed one.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let cached: SupabaseClient<Database> | null = null;

export function getAdminClient(): SupabaseClient<Database> | null {
  if (cached) return cached;

  const url = process.env["SUPABASE_URL"] ?? process.env["EXTERNAL_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["EXTERNAL_SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !key) {
    console.error("[admin] Missing Supabase URL or service role key");
    return null;
  }

  cached = createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
