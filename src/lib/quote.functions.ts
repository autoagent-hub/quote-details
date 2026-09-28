import { createServerFn } from "@tanstack/react-start";
import { getAdminClient } from "@/lib/admin.server";
import { supabase } from "@/integrations/supabase/client";

export type PublicQuoteInput = {
  detailerId: string;
  customerName: string;
  customerPhone: string;
  vehicleType: string;
  vehicleDesc: string;
  serviceKey: string;
  serviceLabel: string;
  servicePrice: number;
  addons: string[];
  notes: string;
  currency: string;
  estimatedPrice: number;
  isTest?: boolean;
};

export const submitPublicQuote = createServerFn({ method: "POST" })
  .inputValidator((data: PublicQuoteInput) => data)
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const db = admin ?? supabase;

    // 1. Insert quote record securely on server
    const { data: newQuote, error: insertError } = await db
      .from("quotes")
      .insert({
        detailer_id: data.detailerId,
        customer_name: data.customerName.trim(),
        customer_phone: data.customerPhone.trim(),
        vehicle_type: data.vehicleType,
        vehicle_desc: data.vehicleDesc.trim(),
        service_key: data.serviceKey,
        service_label: data.serviceLabel,
        service_price: data.servicePrice,
        addons: data.addons,
        notes: data.notes.trim(),
        photo_urls: [],
        currency: data.currency,
        estimated_price: data.estimatedPrice,
        is_test: !!data.isTest,
      })
      .select("id")
      .maybeSingle();

    if (insertError) {
      console.error("[submitPublicQuote] insert error:", insertError);
      throw new Error(`Could not record quote: ${insertError.message}`);
    }

    // 2. If detailer is in TRIAL_PENDING, automatically activate 7-day trial starting now
    try {
      const { data: profile } = await db
        .from("profiles")
        .select("trial_status, trial_expiry")
        .eq("id", data.detailerId)
        .maybeSingle();

      if (profile && (profile.trial_status === "TRIAL_PENDING" || !profile.trial_expiry)) {
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const expiry = new Date(Date.now() + sevenDaysMs).toISOString();
        await db
          .from("profiles")
          .update({
            trial_status: "TRIAL",
            trial_expiry: expiry,
          })
          .eq("id", data.detailerId);
      }
    } catch (e) {
      console.warn("[submitPublicQuote] trial activation notice:", e);
    }

    return { quoteId: newQuote?.id ?? null };
  });
