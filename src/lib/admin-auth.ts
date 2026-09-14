// Admin authorization helper

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ADMIN_EMAILS = ["me@detailr.online", "ayinlasalami6@gmail.com"];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export async function requireAdminAuth() {
  const user = await requireSupabaseAuth();
  if (!user || !isAdminEmail(user.email)) {
    throw new Error("Unauthorized: Admin access required.");
  }
  return user;
}

