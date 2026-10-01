// Admin authorization helper

export const ADMIN_EMAILS = ["support@detailr.online", "teamnerochaze@gmail.com"];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
