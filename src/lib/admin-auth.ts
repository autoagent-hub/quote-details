// Admin authorization helper

export const ADMIN_EMAILS = ["me@detailr.online", "ayinlasalami6@gmail.com"];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
