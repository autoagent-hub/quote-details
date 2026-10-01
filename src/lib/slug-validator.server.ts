import { getAdminClient } from "@/lib/admin.server";
import { slugify } from "@/lib/pricing";
import { RESERVED_SLUGS, type SlugValidationResult } from "@/lib/slug-validator";

/**
 * Server-side check that bypasses Supabase RLS using the service role client
 * to verify if a slug is taken across ALL shop profiles in the database.
 */
export async function checkSlugAvailabilityOnServer(
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

  // 1. Check system reserved slugs
  if (RESERVED_SLUGS.has(cleanSlug)) {
    const suggestions = await findAvailableAlternativesServer(cleanSlug, currentUserId);
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

  // 2. Query all profiles via admin client (bypasses RLS)
  const admin = getAdminClient();
  if (!admin) {
    console.warn("[checkSlugAvailabilityOnServer] Admin client unavailable");
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

  try {
    const { data: existingProfile, error } = await admin
      .from("profiles")
      .select("id, slug")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (error) {
      console.error("[checkSlugAvailabilityOnServer] Database query error:", error);
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
        const suggestions = await findAvailableAlternativesServer(cleanSlug, currentUserId);
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
    console.error("[checkSlugAvailabilityOnServer] Exception:", err);
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
 * Generates verified available alternative suggestions using the admin client.
 */
export async function findAvailableAlternativesServer(
  baseSlug: string,
  currentUserId?: string | null,
): Promise<string[]> {
  const admin = getAdminClient();
  const candidates = [
    `${baseSlug}-detailing`,
    `${baseSlug}-auto`,
    `${baseSlug}-mobile`,
    `${baseSlug}-pro`,
    `${baseSlug}-hq`,
    `${baseSlug}-official`,
    `${baseSlug}-1`,
  ];

  const results: string[] = [];

  for (const candidate of candidates) {
    if (results.length >= 3) break;
    const cleanCandidate = slugify(candidate);
    if (!cleanCandidate || RESERVED_SLUGS.has(cleanCandidate)) continue;

    if (!admin) {
      results.push(cleanCandidate);
      continue;
    }

    const { data } = await admin
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
