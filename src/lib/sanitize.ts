/**
 * Input sanitization utility to strip script tags, dangerous HTML, and control characters
 * to prevent stored XSS, script injection, and payload flooding in quote and profile fields.
 */

export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";

  return (
    input
      // Remove HTML tags and script elements
      .replace(/<[^>]*>?/gm, "")
      // Remove common script execution patterns
      .replace(/javascript\s*:/gi, "")
      .replace(/data\s*:\s*text\/html/gi, "")
      .replace(/vbscript\s*:/gi, "")
      // Remove null bytes and non-printable control characters (except common whitespace)
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .trim()
      .slice(0, maxLength)
  );
}

export function sanitizePhone(input: unknown, maxLength = 30): string {
  if (typeof input !== "string") return "";
  // Keep only valid phone characters (digits, +, -, space, parentheses, extension)
  return input
    .replace(/[^0-9+\-()\s.extEXT]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeStringArray(input: unknown, maxItems = 20, maxItemLength = 80): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is string => typeof item === "string")
    .map((item) => sanitizeText(item, maxItemLength))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}
