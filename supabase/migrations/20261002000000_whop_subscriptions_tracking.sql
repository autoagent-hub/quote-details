-- Migration: Whop subscription tracking and email reconciliation
-- Stores Whop memberships to handle mismatched checkout emails (e.g. srti@gmail.com on app vs jjj@gmail.com on checkout).

CREATE TABLE IF NOT EXISTS public.whop_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  plan_type TEXT DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active',
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning-fast email and user lookups
CREATE INDEX IF NOT EXISTS whop_memberships_email_idx ON public.whop_memberships (LOWER(customer_email));
CREATE INDEX IF NOT EXISTS whop_memberships_user_id_idx ON public.whop_memberships (user_id);
CREATE INDEX IF NOT EXISTS whop_memberships_membership_id_idx ON public.whop_memberships (membership_id);

GRANT ALL ON public.whop_memberships TO service_role;
GRANT SELECT ON public.whop_memberships TO authenticated;

ALTER TABLE public.whop_memberships ENABLE ROW LEVEL SECURITY;

-- Allow users to view memberships associated with their user_id
CREATE POLICY "Users view own whop memberships" ON public.whop_memberships
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
