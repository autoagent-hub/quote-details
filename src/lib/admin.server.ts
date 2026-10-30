// Shared privileged Supabase client for server routes and server functions.
// Falls back to the EXTERNAL_* variables when this project points at an
// external Supabase project instead of a managed one.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let cached: SupabaseClient<Database> | null = null;

export function getAdminClient(): SupabaseClient<Database> | null {
  if (cached) return cached;

  const proc = typeof process !== "undefined" && process?.env ? process.env : {};
  const url = proc["SUPABASE_URL"] ?? proc["EXTERNAL_SUPABASE_URL"];
  const key = proc["SUPABASE_SERVICE_ROLE_KEY"] ?? proc["EXTERNAL_SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !key) {
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
