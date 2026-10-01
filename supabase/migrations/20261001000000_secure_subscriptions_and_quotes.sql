-- Security Hardening: Protect subscription, trial, and billing columns on profiles
-- Prevents authenticated users or injected client scripts from tampering with billing fields.

CREATE OR REPLACE FUNCTION public.protect_profile_subscription_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If executed by an authenticated client (not the backend service_role)
  IF (current_user != 'service_role' AND auth.jwt() IS NOT NULL) THEN
    -- Block modifications to trial_status
    IF NEW.trial_status IS DISTINCT FROM OLD.trial_status THEN
      RAISE EXCEPTION 'Access Denied: trial_status can only be modified by the billing system.';
    END IF;

    -- Block modifications to trial_expiry
    IF NEW.trial_expiry IS DISTINCT FROM OLD.trial_expiry THEN
      RAISE EXCEPTION 'Access Denied: trial_expiry can only be modified by the billing system.';
    END IF;

    -- Block modifications to whop_membership_id
    IF NEW.whop_membership_id IS DISTINCT FROM OLD.whop_membership_id THEN
      RAISE EXCEPTION 'Access Denied: whop_membership_id can only be modified by the billing system.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_subscription_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_subscription_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_subscription_fields();

-- Ensure quotes cannot be updated by clients
DROP POLICY IF EXISTS "Detailers update own quotes" ON public.quotes;

-- Ensure anyone submitting a quote must target an existing shop profile
DROP POLICY IF EXISTS "Anyone can submit a quote request" ON public.quotes;
CREATE POLICY "Anyone can submit a quote request" ON public.quotes
FOR INSERT TO anon, authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = detailer_id)
);
