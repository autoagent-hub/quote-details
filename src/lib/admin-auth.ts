// Admin authorization helper

export const ADMIN_EMAILS = [
  "ayinlasalami6@gmail.com",
  "support@detailr.online",
  "teamnerochaze@gmail.com",
];

export function getAdminEmails(): string[] {
  const envAdmin =
    typeof process !== "undefined"
      ? process.env?.["ADMIN_EMAIL"] || process.env?.["ADMIN_EMAILS"] || ""
      : "";
  const extra = envAdmin
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([...ADMIN_EMAILS.map((e) => e.toLowerCase()), ...extra]));
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return getAdminEmails().includes(clean);
}
