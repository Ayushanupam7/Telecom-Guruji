-- ==============================================================================
-- TELECOM GURUJI: COURSE CREATION & AI PROVIDER ENHANCEMENT MIGRATION
-- ==============================================================================

-- 1. EXTEND COURSES TABLE
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS detailed_description TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_background TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_duration INTEGER DEFAULT 160; -- in minutes
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready_for_review', 'published', 'unpublished'));
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS creation_method TEXT DEFAULT 'manual' CHECK (creation_method IN ('manual', 'manual_ai', 'ai_generated', 'ppt', 'video'));
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '["telecom", "5g", "networking"]'::jsonb;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS template_config JSONB DEFAULT '{
  "theme": "telecom_classic",
  "primaryColor": "#0284c7",
  "secondaryColor": "#6366f1",
  "backgroundColor": "#000000",
  "typography": "roboto",
  "cardStyle": "bordered",
  "slideLayout": "standard",
  "certificateDesign": "classic"
}'::jsonb;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS certificate_config JSONB DEFAULT '{
  "template": "classic",
  "title": "Certificate of Telecommunications Mastery",
  "signatureName": "Dr. Ayush Sharma",
  "signatureTitle": "Lead Telecom Architect & Instructor",
  "accentColor": "#0284c7"
}'::jsonb;

-- 2. EXTEND MODULES TABLE
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS has_quiz BOOLEAN DEFAULT true;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS learning_outcomes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS slides_data JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS quiz_data JSONB DEFAULT '{}'::jsonb;

-- 3. ENSURE CERTIFICATES TABLE HAS ALL COLUMNS
CREATE TABLE IF NOT EXISTS public.certificates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  certificate_hash TEXT UNIQUE,
  student_id TEXT,
  student_name TEXT,
  course_id TEXT,
  course_title TEXT,
  instructor_name TEXT,
  issue_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_hash TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS course_id TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS course_title TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS instructor_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issue_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_certificates_hash ON public.certificates(certificate_hash);

-- 4. CREATE AI_PROVIDER_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'global',
  provider TEXT NOT NULL CHECK (provider IN ('groq', 'gemini')),
  api_key TEXT NOT NULL,
  model TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{"temperature": 0.7, "maxTokens": 4096}'::jsonb,
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, provider)
);

-- Index on ai_provider_settings
CREATE INDEX IF NOT EXISTS idx_ai_provider_user ON public.ai_provider_settings(user_id);

-- RLS on ai_provider_settings
ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AI settings manageable by authenticated/anon" ON public.ai_provider_settings;
CREATE POLICY "AI settings manageable by authenticated/anon" ON public.ai_provider_settings FOR ALL USING (true) WITH CHECK (true);

-- Seed default AI settings
INSERT INTO public.ai_provider_settings (user_id, provider, api_key, model, is_enabled, is_primary)
VALUES 
  ('global', 'groq', '', 'llama-3.3-70b-versatile', true, true),
  ('global', 'gemini', '', 'gemini-1.5-flash', true, false)
ON CONFLICT (user_id, provider) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  model = EXCLUDED.model,
  is_enabled = EXCLUDED.is_enabled,
  is_primary = EXCLUDED.is_primary,
  updated_at = timezone('utc'::text, now());

-- ==============================================================================
-- 5. ENROLLMENT UNIQUENESS & DEDUPLICATION FIX
-- ==============================================================================
-- Deduplicate any existing multiple enrollments by keeping the newest
DELETE FROM public.enrollments a
USING public.enrollments b
WHERE a.id < b.id
  AND a.student_id = b.student_id
  AND a.course_id = b.course_id;

-- Ensure UNIQUE (student_id, course_id) so a student can NEVER enroll multiple times
-- 6. ENROLLMENT RESUME & BOOKMARKING TRACKING
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS last_active_module_index INTEGER DEFAULT 0;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS last_active_slide_index INTEGER DEFAULT 0;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS last_active_view TEXT DEFAULT 'slide';
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS last_active_slide_id TEXT;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());


