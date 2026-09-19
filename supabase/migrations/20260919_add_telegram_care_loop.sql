-- ============================================================================
-- Dosiq AI Web App — Dedicated Telegram Care Loop Architecture (Option B)
-- Connects Family Dossiers to Telegram Adherence Check-ins & Audit Sessions
-- ============================================================================

-- 1. Extend family_members with Telegram Care Loop configuration
ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS care_loop_enabled BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_family_members_telegram_chat ON public.family_members(telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;

-- 2. Create care_loop_events (Dedicated Care Loop Audit & Session Table)
CREATE TABLE IF NOT EXISTS public.care_loop_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    medication_schedule_id UUID REFERENCES public.medication_schedules(id) ON DELETE SET NULL,
    
    -- Clinical Context
    medication_name TEXT NOT NULL,
    dosage_instruction TEXT,
    scheduled_slot TEXT, -- e.g. "morning", "08:00", "afternoon", "night"
    
    -- Messaging Telemetry
    channel TEXT NOT NULL DEFAULT 'telegram' CHECK (channel IN ('telegram', 'whatsapp', 'simulator')),
    telegram_chat_id TEXT NOT NULL,
    telegram_message_id BIGINT,
    
    -- Delivery & Adherence Lifecycle
    dispatch_status TEXT NOT NULL DEFAULT 'sent' CHECK (dispatch_status IN ('pending', 'sent', 'failed', 'delivered')),
    response_status TEXT NOT NULL DEFAULT 'pending' CHECK (response_status IN ('pending', 'confirmed', 'skipped', 'snoozed', 'no_response')),
    response_callback_data TEXT, -- e.g. 'took_dose', 'skipped_dose'
    dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    response_at TIMESTAMPTZ,
    latency_seconds INTEGER,
    
    -- Audit & Raw Webhook Diagnostics
    raw_payload JSONB DEFAULT '{}'::JSONB,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for lightning-fast queries and callback matching
CREATE INDEX IF NOT EXISTS idx_care_loop_user_id ON public.care_loop_events(user_id);
CREATE INDEX IF NOT EXISTS idx_care_loop_family_member ON public.care_loop_events(family_member_id);
CREATE INDEX IF NOT EXISTS idx_care_loop_response_status ON public.care_loop_events(response_status);
CREATE INDEX IF NOT EXISTS idx_care_loop_telegram_msg ON public.care_loop_events(telegram_chat_id, telegram_message_id);
CREATE INDEX IF NOT EXISTS idx_care_loop_dispatched_at ON public.care_loop_events(dispatched_at DESC);

-- 3. Row-Level Security (RLS)
ALTER TABLE public.care_loop_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own care loop events"
  ON public.care_loop_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Enable Realtime Sync on care_loop_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.care_loop_events;
