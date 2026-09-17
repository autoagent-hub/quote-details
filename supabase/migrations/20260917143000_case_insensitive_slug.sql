-- Make get_public_pricing case-insensitive and robust against whitespace/casing
DROP FUNCTION IF EXISTS public.get_public_pricing(text);
CREATE FUNCTION public.get_public_pricing(_slug text)
RETURNS TABLE(
  id uuid,
  business_name text,
  slug text,
  tagline text,
  phone text,
  logo_url text,
  currency text,
  allow_photos boolean,
  sedan_base numeric,
  suv_base numeric,
  truck_base numeric,
  addon_pet_hair numeric,
  addon_stains numeric,
  addon_ceramic numeric,
  services jsonb,
  packages jsonb,
  vehicle_categories jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.business_name, p.slug, p.tagline, p.phone, p.logo_url, p.currency, p.allow_photos,
         p.sedan_base, p.suv_base, p.truck_base,
         p.addon_pet_hair, p.addon_stains, p.addon_ceramic,
         p.services, p.packages, p.vehicle_categories
  FROM public.profiles p
  WHERE lower(p.slug) = lower(trim(_slug))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_pricing(text) TO anon, authenticated;
