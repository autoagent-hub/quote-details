import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/pricing";

export const RESERVED_SLUGS = new Set([
  "admin",
  "auth",
  "login",
  "signup",
  "dashboard",
  "quotes",
  "pricing",
  "notifications",
  "profile",
  "settings",
  "help",
  "master-hq",
  "api",
  "demo",
  "upgrade",
]);

export type SlugValidationResult = {
  cleanSlug: string;
  isValid: boolean;
  isTaken: boolean;
  isReserved: boolean;
  isCurrentOwner: boolean;
  suggestions: string[];
  message: string | null;
};

/**
 * Checks if a slug is taken and finds available alternative suggestions.
 */
export async function checkSlugAvailability(
  inputSlug: string,
  currentUserId?: string | null,
): Promise<SlugValidationResult> {
  const cleanSlug = slugify(inputSlug);

  if (!cleanSlug || cleanSlug.length < 2) {
    return {
      cleanSlug,
      isValid: false,
      isTaken: false,
      isReserved: false,
      isCurrentOwner: false,
      suggestions: [],
      message: "URL slug must be at least 2 characters.",
    };
  }

  // 1. Check reserved system slugs
  if (RESERVED_SLUGS.has(cleanSlug)) {
    const suggestions = await findAvailableAlternatives(cleanSlug, currentUserId);
    return {
      cleanSlug,
      isValid: false,
      isTaken: true,
      isReserved: true,
      isCurrentOwner: false,
      suggestions,
      message: `'${cleanSlug}' is a reserved system URL. Please pick another slug.`,
    };
  }

  // 2. Query Supabase profiles table for existing slug
  try {
    const { data: existingProfile, error } = await supabase
      .from("profiles")
      .select("id, slug")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (error) {
      console.warn("[checkSlugAvailability] Supabase select error:", error);
    }

    if (existingProfile) {
      const isCurrentOwner = !!currentUserId && existingProfile.id === currentUserId;
      if (isCurrentOwner) {
        return {
          cleanSlug,
          isValid: true,
          isTaken: false,
          isReserved: false,
          isCurrentOwner: true,
          suggestions: [],
          message: null,
        };
      } else {
        const suggestions = await findAvailableAlternatives(cleanSlug, currentUserId);
        return {
          cleanSlug,
          isValid: false,
          isTaken: true,
          isReserved: false,
          isCurrentOwner: false,
          suggestions,
          message: `'${cleanSlug}' is already taken by another shop.`,
        };
      }
    }

    // 3. Not taken
    return {
      cleanSlug,
      isValid: true,
      isTaken: false,
      isReserved: false,
      isCurrentOwner: false,
      suggestions: [],
      message: null,
    };
  } catch (err) {
    console.warn("[checkSlugAvailability] exception:", err);
    return {
      cleanSlug,
      isValid: true,
      isTaken: false,
      isReserved: false,
      isCurrentOwner: false,
      suggestions: [],
      message: null,
    };
  }
}

/**
 * Generates 2-3 available alternative suggestions for a taken slug.
 */
export async function findAvailableAlternatives(
  baseSlug: string,
  currentUserId?: string | null,
): Promise<string[]> {
  const candidates = [
    `${baseSlug}-detailing`,
    `${baseSlug}-auto`,
    `${baseSlug}-mobile`,
    `${baseSlug}-hq`,
    `${baseSlug}-official`,
    `${baseSlug}-1`,
  ];

  const results: string[] = [];

  for (const candidate of candidates) {
    if (results.length >= 3) break;
    const cleanCandidate = slugify(candidate);
    if (!cleanCandidate || RESERVED_SLUGS.has(cleanCandidate)) continue;

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", cleanCandidate)
      .maybeSingle();

    if (!data || (currentUserId && data.id === currentUserId)) {
      results.push(cleanCandidate);
    }
  }

  return results;
}
