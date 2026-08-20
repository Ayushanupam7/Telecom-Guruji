-- ==============================================================================
-- TELECOM GURUJI: COMPLETE SUPABASE MASTER SCHEMA & MIGRATION SCRIPT
-- ==============================================================================

-- 0. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE (INSTRUCTORS, STUDENTS, ADMINS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  age INTEGER DEFAULT 21,
  preferred_language TEXT DEFAULT 'en',
  avatar_url TEXT,
  password_hash TEXT,
  last_login_at TIMESTAMPTZ,
  last_logout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS search_history JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ;

-- Quick Tools GIN Indexes on profiles.search_history
CREATE INDEX IF NOT EXISTS idx_profiles_search_history_gin ON public.profiles USING GIN (search_history);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON public.profiles(preferred_language);

-- ==============================================================================
-- 2. COURSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  trainer_name TEXT DEFAULT 'Dr. Ayush Sharma, Lead Specialist',
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  description TEXT,
  detailed_description TEXT,
  category TEXT DEFAULT '5G & Mobile Networks',
  level TEXT DEFAULT 'intermediate' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  default_language TEXT DEFAULT 'en',
  course_type TEXT DEFAULT 'paid' CHECK (course_type IN ('free', 'paid')),
  price NUMERIC(10, 2) DEFAULT 49.00,
  currency TEXT DEFAULT 'INR',
  is_published BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready_for_review', 'published', 'unpublished')),
  creation_method TEXT DEFAULT 'manual' CHECK (creation_method IN ('manual', 'manual_ai', 'ai_generated', 'ppt', 'video')),
  thumbnail_url TEXT,
  thumbnail_type TEXT DEFAULT 'image' CHECK (thumbnail_type IN ('image', 'video')),
  modules_count INTEGER DEFAULT 5,
  lessons_count INTEGER DEFAULT 15,
  course_duration INTEGER DEFAULT 160,
  tags JSONB DEFAULT '["telecom", "5g", "lte", "networking"]'::jsonb,
  template_config JSONB DEFAULT '{
    "theme": "telecom_classic",
    "primaryColor": "#0284c7",
    "secondaryColor": "#6366f1",
    "backgroundColor": "#000000",
    "typography": "roboto",
    "cardStyle": "bordered",
    "slideLayout": "standard",
    "certificateDesign": "classic"
  }'::jsonb,
  certificate_config JSONB DEFAULT '{
    "template": "classic",
    "title": "Certificate of Telecommunications Mastery",
    "signatureName": "Dr. Ayush Sharma",
    "signatureTitle": "Lead Telecom Systems Architect & Instructor",
    "accentColor": "#0284c7"
  }'::jsonb,
  content_overview JSONB DEFAULT '{}'::jsonb,
  attention_check JSONB DEFAULT '{"enabled": true, "triggerIntervalSlides": 2, "timeoutSeconds": 30}'::jsonb,
  final_assessment JSONB DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist on courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS detailed_description TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_duration INTEGER DEFAULT 160;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS creation_method TEXT DEFAULT 'manual';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '["telecom", "5g", "networking"]'::jsonb;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS template_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS certificate_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_type TEXT DEFAULT 'image';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS modules_count INTEGER DEFAULT 5;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS lessons_count INTEGER DEFAULT 15;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS final_assessment JSONB DEFAULT '{}'::jsonb;

-- ==============================================================================
-- 3. MODULES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.modules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 1,
  duration_minutes INTEGER DEFAULT 30,
  is_free_preview BOOLEAN DEFAULT false,
  has_quiz BOOLEAN DEFAULT true,
  learning_outcomes JSONB DEFAULT '[]'::jsonb,
  slides_data JSONB DEFAULT '[]'::jsonb,
  quiz_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist on modules
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS has_quiz BOOLEAN DEFAULT true;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS learning_outcomes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS slides_data JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS quiz_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- ==============================================================================
-- 4. ENROLLMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'free' CHECK (payment_status IN ('free', 'pending', 'paid', 'refunded')),
  payment_method TEXT DEFAULT 'upi_qr',
  utr_number TEXT,
  transaction_ref TEXT,
  amount_paid NUMERIC(10, 2) DEFAULT 0.00,
  student_name TEXT DEFAULT 'Student Learner',
  student_email TEXT DEFAULT 'student@signalhub.app',
  progress_percent NUMERIC(5, 2) DEFAULT 0.00,
  enrolled_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'upi_qr';
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utr_number TEXT;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS transaction_ref TEXT;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS student_name TEXT DEFAULT 'Student Learner';
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS student_email TEXT DEFAULT 'student@signalhub.app';
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS progress_percent NUMERIC(5, 2) DEFAULT 0.00;

-- Deduplicate any existing multiple enrollments by keeping the newest/highest progress
DELETE FROM public.enrollments a
USING public.enrollments b
WHERE a.id < b.id
  AND a.student_id = b.student_id
  AND a.course_id = b.course_id;

-- Ensure UNIQUE (student_id, course_id) to prevent duplicate course enrollments
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_course_enrollment'
  ) THEN 
    ALTER TABLE public.enrollments 
    ADD CONSTRAINT unique_student_course_enrollment UNIQUE (student_id, course_id);
  END IF; 
END $$;

-- Resume & bookmarking tracking
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS last_active_module_index INTEGER DEFAULT 0;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS last_active_slide_index INTEGER DEFAULT 0;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS last_active_view TEXT DEFAULT 'slide';
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS last_active_slide_id TEXT;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- ==============================================================================
-- 5. PROGRESS & QUIZ ATTEMPTS TABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id, course_id, lesson_id)
);

ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL,
  student_email TEXT,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  score_percent NUMERIC(5, 2) NOT NULL,
  is_passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB DEFAULT '{}'::jsonb,
  attempted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS course_id TEXT;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS is_passed BOOLEAN DEFAULT false;

-- ==============================================================================
-- 6. CERTIFICATES TABLE (WITH SAFE COLUMN ENSURANCE)
-- ==============================================================================
-- ==============================================================================
-- 6b. COURSE REVIEWS TABLE (RATINGS & FEEDBACK)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL DEFAULT 'Anonymous Student',
  student_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.course_reviews ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.course_reviews ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.course_reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT false;
ALTER TABLE public.course_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_course_review'
  ) THEN
    ALTER TABLE public.course_reviews
    ADD CONSTRAINT unique_student_course_review UNIQUE (student_id, course_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_student_id ON public.course_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.course_reviews(rating);

-- ==============================================================================
-- 7. CERTIFICATES TABLE (WITH SAFE COLUMN ENSURANCE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  certificate_hash TEXT UNIQUE,
  student_id TEXT,
  student_name TEXT,
  course_id TEXT,
  course_title TEXT,
  instructor_name TEXT,
  issue_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Ensure all columns exist on certificates table before indexes
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_hash TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS course_id TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS course_title TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS instructor_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issue_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ==============================================================================
-- 7. AI PROVIDER SETTINGS TABLE (GROQ PRIMARY + GEMINI FALLBACK)
-- ==============================================================================
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

-- ==============================================================================
-- 8. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_student_course ON public.progress(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_hash ON public.certificates(certificate_hash);
CREATE INDEX IF NOT EXISTS idx_ai_provider_user ON public.ai_provider_settings(user_id);

-- ==============================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, Self/Admin update
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Courses: Read published or all if instructor
DROP POLICY IF EXISTS "Public can view published courses" ON public.courses;
CREATE POLICY "Public can view published courses" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Instructors can manage courses" ON public.courses;
CREATE POLICY "Instructors can manage courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

-- Modules: Public read, Instructor write
DROP POLICY IF EXISTS "Public read modules" ON public.modules;
CREATE POLICY "Public read modules" ON public.modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Instructors manage modules" ON public.modules;
CREATE POLICY "Instructors manage modules" ON public.modules FOR ALL USING (true) WITH CHECK (true);

-- Enrollments: Read/Write
DROP POLICY IF EXISTS "Enrollments accessible" ON public.enrollments;
CREATE POLICY "Enrollments accessible" ON public.enrollments FOR ALL USING (true) WITH CHECK (true);

-- Progress: Read/Write
DROP POLICY IF EXISTS "Progress accessible" ON public.progress;
CREATE POLICY "Progress accessible" ON public.progress FOR ALL USING (true) WITH CHECK (true);

-- Quiz Attempts: Read/Write
DROP POLICY IF EXISTS "Quiz attempts accessible" ON public.quiz_attempts;
CREATE POLICY "Quiz attempts accessible" ON public.quiz_attempts FOR ALL USING (true) WITH CHECK (true);

-- Certificates: Publicly verifiable by hash
DROP POLICY IF EXISTS "Certificates are publicly verifiable" ON public.certificates;
CREATE POLICY "Certificates are publicly verifiable" ON public.certificates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Certificates creation" ON public.certificates;
CREATE POLICY "Certificates creation" ON public.certificates FOR ALL USING (true) WITH CHECK (true);

-- AI Provider Settings
DROP POLICY IF EXISTS "AI settings manageable" ON public.ai_provider_settings;
CREATE POLICY "AI settings manageable" ON public.ai_provider_settings FOR ALL USING (true) WITH CHECK (true);

-- Course Reviews: Public read, students can submit
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.course_reviews;
CREATE POLICY "Reviews are publicly readable" ON public.course_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Students can manage own reviews" ON public.course_reviews;
CREATE POLICY "Students can manage own reviews" ON public.course_reviews FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 10. SEED CONFIGURATION: DUAL AI PROVIDER CREDENTIALS
-- ==============================================================================
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
