-- ============================================================================
-- Dosiq AI Web App — Onboarding Fields for family_members
-- Adds: phone_number, avatar_url, onboarding_completed
-- ============================================================================

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for quick onboarding-status lookups
CREATE INDEX IF NOT EXISTS idx_family_members_onboarding
  ON public.family_members(user_id, onboarding_completed);
