import { createServerFn } from "@tanstack/react-start";
import { getAdminClient } from "@/lib/admin.server";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeText, sanitizePhone, sanitizeStringArray } from "@/lib/sanitize";

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

    // Security check: Validate detailerId is a valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.detailerId)) {
      throw new Error("Invalid shop identifier.");
    }

    // Sanitize all inputs to strip HTML and script tags
    const cleanCustomerName = sanitizeText(data.customerName, 100);
    const cleanCustomerPhone = sanitizePhone(data.customerPhone, 30);
    const cleanVehicleDesc = sanitizeText(data.vehicleDesc, 150);
    const cleanServiceLabel = sanitizeText(data.serviceLabel, 100);
    const cleanServiceKey = sanitizeText(data.serviceKey, 50);
    const cleanNotes = sanitizeText(data.notes, 1500);
    const cleanAddons = sanitizeStringArray(data.addons, 15, 60);

    if (!cleanCustomerName || cleanCustomerName.length < 2) {
      throw new Error("Customer name is required.");
    }
    if (!cleanCustomerPhone || cleanCustomerPhone.length < 5) {
      throw new Error("Valid customer phone number is required.");
    }

    // 1. Insert quote record securely on server
    const { data: newQuote, error: insertError } = await db
      .from("quotes")
      .insert({
        detailer_id: data.detailerId,
        customer_name: cleanCustomerName,
        customer_phone: cleanCustomerPhone,
        vehicle_type: sanitizeText(data.vehicleType, 50),
        vehicle_desc: cleanVehicleDesc,
        service_key: cleanServiceKey,
        service_label: cleanServiceLabel,
        service_price: Math.max(0, Number(data.servicePrice) || 0),
        addons: cleanAddons,
        notes: cleanNotes,
        photo_urls: [],
        currency: sanitizeText(data.currency, 10) || "USD",
        estimated_price: Math.max(0, Number(data.estimatedPrice) || 0),
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
