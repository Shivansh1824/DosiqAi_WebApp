-- ============================================================================
-- Dosiq AI Web App — Core Relational Schema
-- Sourced directly from Dosiq AI Architecture & verified against production db
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Family Members Table
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    relationship TEXT,
    gender TEXT,
    date_of_birth DATE,
    linked_user_id UUID,
    morning_dose_time TIME DEFAULT '08:00:00'::TIME,
    afternoon_dose_time TIME DEFAULT '14:00:00'::TIME,
    night_dose_time TIME DEFAULT '20:00:00'::TIME,
    snooze_duration INTEGER DEFAULT 10,
    reminder_style TEXT DEFAULT 'standard',
    alert_display_mode TEXT DEFAULT 'temporary',
    ios_followup_count INTEGER DEFAULT 2,
    ios_notification_tune TEXT DEFAULT 'default',
    android_notification_tune TEXT DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);

-- 2. Documents Table (Clinical Vault)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'Other',
    local_file_path TEXT,
    cloud_file_key TEXT,
    patient_name TEXT,
    diagnosis TEXT,
    visit_date DATE,
    follow_up_date DATE,
    issued_by TEXT,
    ai_analysis_status TEXT DEFAULT 'pending' CHECK (ai_analysis_status IN ('pending', 'processing', 'completed', 'failed')),
    ai_analysis_result JSONB,
    ai_analysis_error JSONB,
    ai_analysis_tokens_used INTEGER,
    ai_analyzed_at TIMESTAMPTZ DEFAULT now(),
    ai_analysis_stage1 TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_family_member ON public.documents(family_member_id);
CREATE INDEX IF NOT EXISTS idx_documents_analysis_status ON public.documents(ai_analysis_status);

-- 3. Medication Schedules Table (Active Regimen)
CREATE TABLE IF NOT EXISTS public.medication_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    generic_name TEXT,
    medicine_type TEXT,
    medicine_purpose TEXT,
    strength TEXT,
    dosage_instruction TEXT,
    timing_dosage TEXT,
    times_per_day INTEGER,
    reminder_times JSONB,
    food_relationship TEXT,
    interval_days INTEGER,
    start_date DATE NOT NULL,
    duration_days INTEGER,
    end_date DATE,
    notes TEXT,
    source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    ai_confidence REAL,
    created_timezone TEXT DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_med_schedules_user_id ON public.medication_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_med_schedules_family_member ON public.medication_schedules(family_member_id);
CREATE INDEX IF NOT EXISTS idx_med_schedules_source_doc ON public.medication_schedules(source_document_id);

-- 4. Medication Logs Table (Adherence Tracking)
CREATE TABLE IF NOT EXISTS public.medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    medication_id UUID NOT NULL REFERENCES public.medication_schedules(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TEXT NOT NULL,
    taken_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_medication_log_slot UNIQUE (medication_id, scheduled_date, scheduled_time)
);

CREATE INDEX IF NOT EXISTS idx_med_logs_user_date ON public.medication_logs(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_med_logs_medication ON public.medication_logs(medication_id);

-- 5. Health Vitals Table
CREATE TABLE IF NOT EXISTS public.health_vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    unit TEXT,
    status TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    trend TEXT,
    detail TEXT,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_vitals_user_id ON public.health_vitals(user_id);
CREATE INDEX IF NOT EXISTS idx_health_vitals_family_member ON public.health_vitals(family_member_id);

-- 6. Biomarkers Master Table & Aliases
CREATE TABLE IF NOT EXISTS public.biomarkers_mastertable (
    biomarker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_name VARCHAR NOT NULL,
    display_name VARCHAR,
    short_name VARCHAR,
    unit VARCHAR,
    min_value REAL,
    max_value REAL,
    description TEXT,
    category VARCHAR,
    specimen_type VARCHAR,
    interpretation_normal TEXT,
    interpretation_low TEXT,
    interpretation_high TEXT,
    interpretation_borderline TEXT,
    interpretation_critical TEXT,
    interpretation_abnormal TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.biomarkers_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    biomarker_id UUID NOT NULL REFERENCES public.biomarkers_mastertable(biomarker_id) ON DELETE CASCADE,
    alias_name VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Lab Reports Table
CREATE TABLE IF NOT EXISTS public.lab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    lab_name TEXT,
    report_type TEXT,
    patient_name TEXT,
    age INTEGER,
    gender TEXT,
    collection_date DATE,
    report_date DATE NOT NULL,
    sample_type TEXT,
    fasting_status BOOLEAN,
    status TEXT NOT NULL DEFAULT 'final' CHECK (status IN ('final', 'draft')),
    notes TEXT,
    verified_by_user BOOLEAN NOT NULL DEFAULT FALSE,
    ai_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_reports_user ON public.lab_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_family_member ON public.lab_reports(family_member_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_document ON public.lab_reports(document_id);

-- 8. Test Results Table
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    lab_report_id UUID NOT NULL REFERENCES public.lab_reports(id) ON DELETE CASCADE,
    report_date DATE,
    test_name TEXT NOT NULL,
    value TEXT,
    unit TEXT,
    ref_min NUMERIC,
    ref_max NUMERIC,
    ref_type TEXT,
    status TEXT,
    biomarker_id UUID REFERENCES public.biomarkers_mastertable(biomarker_id) ON DELETE SET NULL,
    previous_value NUMERIC,
    change_percentage NUMERIC,
    trend TEXT CHECK (trend IN ('improving', 'worsening', 'stable')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_results_user ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_lab_report ON public.test_results(lab_report_id);

-- 9. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    doctor_name TEXT NOT NULL,
    appointment_type TEXT NOT NULL DEFAULT 'General',
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_family_member ON public.appointments(family_member_id);

-- 10. Chart Preferences Table
CREATE TABLE IF NOT EXISTS public.chart_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
    default_chart_type TEXT DEFAULT 'line' CHECK (default_chart_type IN ('line', 'bar', 'area')),
    default_time_range TEXT DEFAULT '6m' CHECK (default_time_range IN ('1m', '3m', '6m', '1y', 'all')),
    show_reference_ranges BOOLEAN DEFAULT TRUE,
    show_annotations BOOLEAN DEFAULT TRUE,
    color_blind_mode BOOLEAN DEFAULT FALSE,
    pinned_metrics TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_family_pref UNIQUE(user_id, family_member_id)
);

-- 11. Upload Limits Table
CREATE TABLE IF NOT EXISTS public.upload_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
    upload_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_upload_date UNIQUE(user_id, upload_date)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biomarkers_mastertable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biomarkers_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_limits ENABLE ROW LEVEL SECURITY;

-- Biomarkers Reference (Public/Authenticated Read)
CREATE POLICY "Allow read biomarkers_mastertable" ON public.biomarkers_mastertable FOR SELECT USING (true);
CREATE POLICY "Allow read biomarkers_aliases" ON public.biomarkers_aliases FOR SELECT USING (true);

-- User-scoped policies
CREATE POLICY "Users can manage their own family members" ON public.family_members FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own documents" ON public.documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own medication schedules" ON public.medication_schedules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own medication logs" ON public.medication_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own health vitals" ON public.health_vitals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own lab reports" ON public.lab_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own test results" ON public.test_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own appointments" ON public.appointments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own chart preferences" ON public.chart_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own upload limits" ON public.upload_limits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_logs, public.documents, public.medication_schedules;
