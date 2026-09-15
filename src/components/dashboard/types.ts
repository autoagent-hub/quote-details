import type { Tables } from "@/integrations/supabase/types";
import { type ServiceItem, type PackageItem, type VehicleCategory } from "@/lib/pricing";

export type Profile = Tables<"profiles">;
export type Quote = Tables<"quotes">;

export type { ServiceItem, PackageItem, VehicleCategory };
