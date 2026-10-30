import { createServerFn } from "@tanstack/react-start";
import { getAdminClient } from "@/lib/admin.server";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/pricing";

export interface CompleteOnboardingInput {
  userId?: string;
  businessName: string;
  slug: string;
}

export interface CompleteOnboardingResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const completeOnboarding = createServerFn({ method: "POST" })
  .inputValidator((input: CompleteOnboardingInput) => input)
  .handler(async ({ data }): Promise<CompleteOnboardingResult> => {
    const admin = getAdminClient();
    const db = admin ?? supabase;

    const rawName = (data.businessName || "").trim();
    if (!rawName) {
      throw new Error("Please enter your business name.");
    }

    const finalSlug = slugify(data.slug || rawName);
    if (!finalSlug || finalSlug.length < 2) {
      throw new Error("Please enter a valid link for your quote form.");
    }

    const uid = data.userId;
    if (!uid) {
      throw new Error("Not signed in. Please sign in to create your shop.");
    }

    // Check if another profile is already using this slug
    const { data: conflict } = await db
      .from("profiles")
      .select("id")
      .eq("slug", finalSlug)
      .neq("id", uid)
      .maybeSingle();

    if (conflict) {
      throw new Error(
        `'detailr.online/${finalSlug}' is already taken by another shop. Please choose another link.`,
      );
    }

    // Check if profile exists for this user
    const { data: existingProfile } = await db
      .from("profiles")
      .select("id")
      .eq("id", uid)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile with new business_name and slug
      const { error: updateErr } = await db
        .from("profiles")
        .update({
          business_name: rawName,
          slug: finalSlug,
        } as never)
        .eq("id", uid);

      if (updateErr) {
        console.error("[onboarding] Failed to update profile:", updateErr);
        throw new Error(`Failed to update profile: ${updateErr.message}`);
      }
    } else {
      // Insert new profile
      const { error: insertErr } = await db.from("profiles").insert({
        id: uid,
        business_name: rawName,
        slug: finalSlug,
        trial_status: "TRIAL",
      } as never);

      if (insertErr) {
        console.error("[onboarding] Failed to insert profile:", insertErr);
        // If it failed because of duplicate key (race condition), fallback to update
        if (
          insertErr.message.includes("profiles_pkey") ||
          insertErr.message.includes("duplicate key")
        ) {
          const { error: retryErr } = await db
            .from("profiles")
            .update({
              business_name: rawName,
              slug: finalSlug,
            } as never)
            .eq("id", uid);
          if (retryErr) throw new Error(retryErr.message);
        } else {
          throw new Error(`Failed to create profile: ${insertErr.message}`);
        }
      }
    }

    // Also update auth user metadata if admin client is available
    if (admin) {
      try {
        const { data: userRecord } = await admin.auth.admin.getUserById(uid);
        if (userRecord?.user) {
          const existingMeta = (userRecord.user.user_metadata || {}) as Record<string, unknown>;
          await admin.auth.admin.updateUserById(uid, {
            user_metadata: {
              ...existingMeta,
              business_name: rawName,
              slug: finalSlug,
            },
          });
        }
      } catch (metaErr) {
        console.warn("[onboarding] Failed to update user metadata (non-fatal):", metaErr);
      }
    }

    return { success: true, message: "Shop and quote link created successfully!" };
  });
