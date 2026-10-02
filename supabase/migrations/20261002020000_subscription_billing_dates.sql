-- Migration: Add next_billing_date and subscription_started_at to profiles
-- Stores both subscription start date and next billing/renewal end date directly in the database.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;

-- Backfill existing SUBSCRIBED rows with renewal date 30 days out
UPDATE public.profiles
SET
  subscription_started_at = COALESCE(subscription_started_at, created_at, now()),
  next_billing_date = COALESCE(next_billing_date, now() + INTERVAL '30 days'),
  trial_expiry = COALESCE(next_billing_date, now() + INTERVAL '30 days')
WHERE trial_status = 'SUBSCRIBED';
