import { createServerFn } from "@tanstack/react-start";
import { requireActiveSubscription } from "@/lib/subscription-guard.server";
import { getAdminClient } from "@/lib/admin.server";
import { sanitizeText, sanitizePhone } from "@/lib/sanitize";
import type { TablesUpdate } from "@/integrations/supabase/types";

export const updateDetailerProfile = createServerFn({ method: "POST" })
  .middleware([requireActiveSubscription])
  .inputValidator((payload: TablesUpdate<"profiles">) => payload)
  .handler(async ({ data: payload, context }) => {
    const admin = getAdminClient();
    const db = admin ?? context.supabase;

    // Strip protected billing fields to prevent request injection
    const updates = { ...payload } as Record<string, unknown>;
    delete updates["trial_status"];
    delete updates["trial_expiry"];
    delete updates["whop_membership_id"];
    delete updates["id"];
    delete updates["created_at"];

    // Sanitize string fields if provided
    if (typeof updates["business_name"] === "string") {
      updates["business_name"] = sanitizeText(updates["business_name"], 100);
    }
    if (typeof updates["phone"] === "string") {
      updates["phone"] = sanitizePhone(updates["phone"], 30);
    }
    if (typeof updates["tagline"] === "string") {
      updates["tagline"] = sanitizeText(updates["tagline"], 200);
    }
    if (typeof updates["slug"] === "string") {
      const cleanSlug = updates["slug"]
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "")
        .slice(0, 50);
      if (!cleanSlug) {
        throw new Error("Invalid shop URL slug.");
      }
      updates["slug"] = cleanSlug;
    }

    // Number constraints
    if (typeof updates["sedan_base"] === "number") {
      updates["sedan_base"] = Math.max(0, updates["sedan_base"]);
    }
    if (typeof updates["suv_base"] === "number") {
      updates["suv_base"] = Math.max(0, updates["suv_base"]);
    }
    if (typeof updates["truck_base"] === "number") {
      updates["truck_base"] = Math.max(0, updates["truck_base"]);
    }

    const { error } = await db.from("profiles").update(updates).eq("id", context.userId);

    if (error) {
      if (error.message.includes("profiles_slug_key") || error.message.includes("duplicate key")) {
        throw new Error("This URL slug is already taken by another shop. Please choose another.");
      }
      throw new Error(`Profile update failed: ${error.message}`);
    }

    return { success: true };
  });
