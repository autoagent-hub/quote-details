-- Migration: Enforce server-side and database-level subscription checks
-- Prevents request injection by validating subscription status directly in PostgreSQL.

-- 1. Protect quote submissions against expired or suspended shops
CREATE OR REPLACE FUNCTION public.check_detailer_active_for_quotes()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
  v_expiry TIMESTAMPTZ;
  v_whop TEXT;
  v_has_active_whop BOOLEAN := false;
BEGIN
  -- Service role bypass for migrations/seed scripts
  IF current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Read current subscription state from profiles
  SELECT trial_status, trial_expiry, whop_membership_id
  INTO v_status, v_expiry, v_whop
  FROM public.profiles
  WHERE id = NEW.detailer_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Target shop profile does not exist.';
  END IF;

  IF v_status = 'SUSPENDED' OR v_status = 'BANNED' THEN
    RAISE EXCEPTION 'Access Denied: This shop is currently suspended.';
  END IF;

  -- Check if shop owner is Master Admin
  IF NEW.detailer_id = '3c7f1a25-615e-4cfc-9c23-a049bafe9337'::uuid THEN
    RETURN NEW;
  END IF;

  -- Check if subscribed directly on profile or holds authentic Whop reference
  IF v_status = 'SUBSCRIBED' OR v_status = 'ADMIN' OR (v_whop IS NOT NULL AND (v_whop LIKE 'mem_%' OR v_whop LIKE 'pay_%')) THEN
    RETURN NEW;
  END IF;

  -- Check if whop_memberships holds an active record
  SELECT EXISTS (
    SELECT 1 FROM public.whop_memberships
    WHERE user_id = NEW.detailer_id AND (status = 'active' OR status = 'subscribed')
  ) INTO v_has_active_whop;

  IF v_has_active_whop THEN
    RETURN NEW;
  END IF;

  -- Pending trial (has not completed 7-day countdown yet)
  IF v_status = 'TRIAL_PENDING' OR v_expiry IS NULL THEN
    RETURN NEW;
  END IF;

  -- Active trial within the 7-day period
  IF v_expiry > now() THEN
    RETURN NEW;
  END IF;

  -- Allow authenticated shop owner themselves to run preview tests
  IF NEW.is_test = true AND auth.uid() = NEW.detailer_id THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Subscription Required: This shop''s trial has expired. Quote requests are paused until upgraded.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_detailer_active_for_quotes ON public.quotes;
CREATE TRIGGER trg_check_detailer_active_for_quotes
BEFORE INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.check_detailer_active_for_quotes();


-- 2. Protect profile configuration modifications (pricing, services, slug, telegram settings)
CREATE OR REPLACE FUNCTION public.check_subscription_before_profile_update()
RETURNS TRIGGER AS $$
DECLARE
  v_has_active_whop BOOLEAN := false;
BEGIN
  -- Service role and server background routines can update anytime
  IF current_user = 'service_role' OR auth.jwt() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Master Admin bypass
  IF auth.uid() = '3c7f1a25-615e-4cfc-9c23-a049bafe9337'::uuid THEN
    RETURN NEW;
  END IF;

  -- Check if user is suspended
  IF OLD.trial_status = 'SUSPENDED' OR OLD.trial_status = 'BANNED' THEN
    RAISE EXCEPTION 'Access Denied: Your account is suspended. Contact support@detailr.online.';
  END IF;

  -- Allow active subscribers or admin accounts
  IF OLD.trial_status = 'SUBSCRIBED' OR OLD.trial_status = 'ADMIN' OR (OLD.whop_membership_id IS NOT NULL AND (OLD.whop_membership_id LIKE 'mem_%' OR OLD.whop_membership_id LIKE 'pay_%')) THEN
    RETURN NEW;
  END IF;

  -- Check if whop_memberships holds an active subscription
  SELECT EXISTS (
    SELECT 1 FROM public.whop_memberships
    WHERE user_id = auth.uid() AND (status = 'active' OR status = 'subscribed')
  ) INTO v_has_active_whop;

  IF v_has_active_whop THEN
    RETURN NEW;
  END IF;

  -- Allow if trial is pending or still active
  IF OLD.trial_status = 'TRIAL_PENDING' OR OLD.trial_expiry IS NULL OR OLD.trial_expiry > now() THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Subscription Required: Your 7-day free trial has expired. Please upgrade to Detailr Pro to modify your pricing and shop settings.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_subscription_before_profile_update ON public.profiles;
CREATE TRIGGER trg_check_subscription_before_profile_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_subscription_before_profile_update();
