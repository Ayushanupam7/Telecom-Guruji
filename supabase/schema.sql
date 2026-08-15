-- ==============================================================================
-- STEP 1: ADD MISSING COLUMNS TO EXISTING TABLES (RUN FIRST)
-- ==============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'light';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_type TEXT DEFAULT 'image';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS modules_count INTEGER DEFAULT 4;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS lessons_count INTEGER DEFAULT 12;

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'upi_qr';
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utr_number TEXT;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS transaction_ref TEXT;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS student_name TEXT DEFAULT 'Student Learner';
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS student_email TEXT DEFAULT 'student@signalhub.app';

-- ==============================================================================
-- STEP 2: CREATE TABLES & RLS POLICIES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  age INTEGER DEFAULT 21,
  preferred_language TEXT DEFAULT 'en',
  avatar_url TEXT,
  theme_preference TEXT DEFAULT 'light',
  password_hash TEXT,
  last_login_at TIMESTAMPTZ,
  last_logout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  trainer_name TEXT DEFAULT 'Dr. Ayush Sharma, Lead Specialist',
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  description TEXT,
  category TEXT DEFAULT 'Computer Science',
  level TEXT DEFAULT 'intermediate' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  default_language TEXT DEFAULT 'en',
  course_type TEXT DEFAULT 'paid' CHECK (course_type IN ('free', 'paid')),
  price NUMERIC(10, 2) DEFAULT 49.00,
  currency TEXT DEFAULT 'INR',
  is_published BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  thumbnail_type TEXT DEFAULT 'image' CHECK (thumbnail_type IN ('image', 'video')),
  modules_count INTEGER DEFAULT 4,
  lessons_count INTEGER DEFAULT 12,
  content_overview JSONB DEFAULT '{}'::jsonb,
  attention_check JSONB DEFAULT '{"enabled": true, "triggerIntervalSlides": 2, "timeoutSeconds": 30}'::jsonb,
  final_assessment JSONB DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.modules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 1,
  is_free_preview BOOLEAN DEFAULT false,
  slides_data JSONB DEFAULT '[]'::jsonb,
  quiz_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT DEFAULT 'video' CHECK (content_type IN ('video', 'article', 'interactive', 'slides')),
  content_url TEXT,
  duration_seconds INTEGER DEFAULT 300,
  sequence_order INTEGER NOT NULL DEFAULT 1,
  is_free_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('free', 'paid', 'pending', 'refunded')),
  amount_paid NUMERIC(10, 2) DEFAULT 0.00,
  payment_method TEXT DEFAULT 'upi_qr',
  utr_number TEXT,
  transaction_ref TEXT,
  student_name TEXT DEFAULT 'Student Learner',
  student_email TEXT DEFAULT 'student@signalhub.app',
  enrolled_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.progress (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT,
  is_completed BOOLEAN DEFAULT false,
  video_watch_percent INTEGER DEFAULT 0 CHECK (video_watch_percent >= 0 AND video_watch_percent <= 100),
  last_position_seconds INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id, course_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  score_percent INTEGER NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
  is_passed BOOLEAN DEFAULT false,
  answers_json JSONB DEFAULT '{}'::jsonb,
  attempted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_student_course ON public.progress(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_id);

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Profiles updateable by owner" ON public.profiles;
CREATE POLICY "Profiles updateable by owner" ON public.profiles FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Profiles insertable by authenticated/anon" ON public.profiles;
CREATE POLICY "Profiles insertable by authenticated/anon" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON public.courses;
CREATE POLICY "Public courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Courses insertable/updateable" ON public.courses;
CREATE POLICY "Courses insertable/updateable" ON public.courses FOR ALL USING (true);

DROP POLICY IF EXISTS "Modules viewable by everyone" ON public.modules;
CREATE POLICY "Modules viewable by everyone" ON public.modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Modules manageable" ON public.modules;
CREATE POLICY "Modules manageable" ON public.modules FOR ALL USING (true);

DROP POLICY IF EXISTS "Lessons viewable by everyone" ON public.lessons;
CREATE POLICY "Lessons viewable by everyone" ON public.lessons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Lessons manageable" ON public.lessons;
CREATE POLICY "Lessons manageable" ON public.lessons FOR ALL USING (true);

DROP POLICY IF EXISTS "Enrollments viewable by all" ON public.enrollments;
CREATE POLICY "Enrollments viewable by all" ON public.enrollments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enrollments insertable/updateable" ON public.enrollments;
CREATE POLICY "Enrollments insertable/updateable" ON public.enrollments FOR ALL USING (true);

DROP POLICY IF EXISTS "Progress viewable by all" ON public.progress;
CREATE POLICY "Progress viewable by all" ON public.progress FOR SELECT USING (true);
DROP POLICY IF EXISTS "Progress manageable" ON public.progress;
CREATE POLICY "Progress manageable" ON public.progress FOR ALL USING (true);

DROP POLICY IF EXISTS "Quiz attempts viewable by all" ON public.quiz_attempts;
CREATE POLICY "Quiz attempts viewable by all" ON public.quiz_attempts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Quiz attempts manageable" ON public.quiz_attempts;
CREATE POLICY "Quiz attempts manageable" ON public.quiz_attempts FOR ALL USING (true);

-- ==============================================================================
-- STEP 3: SEED DATA
-- ==============================================================================
INSERT INTO public.profiles (id, email, username, full_name, role, theme_preference)
SELECT 'a1111111-1111-1111-1111-111111111111'::uuid, 'instructor@signalhub.app', 'instructor', 'Dr. Ayush Sharma', 'instructor', 'dark'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'instructor@signalhub.app');

INSERT INTO public.profiles (id, email, username, full_name, role, theme_preference)
SELECT 'e1111111-1111-1111-1111-111111111111'::uuid, 'student@signalhub.app', 'student', 'Student Learner', 'student', 'light'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'student@signalhub.app');

INSERT INTO public.profiles (id, email, username, full_name, role, theme_preference)
SELECT 'd1111111-1111-1111-1111-111111111111'::uuid, 'dev@signalhub.app', 'dev', 'Developer Admin', 'admin', 'dark'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'dev@signalhub.app');

INSERT INTO public.courses (id, slug, title, trainer_name, summary, description, category, level, price, currency, is_published, thumbnail_url, thumbnail_type)
SELECT
  'd1111111-1111-1111-1111-111111111111',
  'signal-processing-digital-communications',
  'Signal Processing & Digital Communications',
  'Dr. Ayush Sharma',
  'Master Fourier Analysis, Discrete Signal Processing (DSP) Filters, and Digital Modulation Protocols.',
  'Comprehensive verified curriculum covering continuous & discrete signal transform analysis, FIR/IIR digital filter design, QPSK/QAM digital modulation, and spectral density evaluation.',
  'Computer Science',
  'intermediate',
  49.00,
  'INR',
  true,
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'image'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE id = 'd1111111-1111-1111-1111-111111111111');

INSERT INTO public.courses (id, slug, title, trainer_name, summary, description, category, level, price, currency, is_published, thumbnail_url, thumbnail_type)
SELECT
  'c3333333-3333-3333-3333-333333333333',
  'distributed-systems-masterclass',
  'Distributed Systems & Cloud Architecture',
  'Prof. Rajesh K. Nair',
  'Master high-performance distributed protocols, microservice resiliency patterns, and production cloud infrastructure.',
  'Comprehensive 5-module training program featuring interactive slide decks, module quizzes, final assessment, and active engagement checks.',
  'Systems',
  'advanced',
  49.00,
  'INR',
  true,
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  'image'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE id = 'c3333333-3333-3333-3333-333333333333');

INSERT INTO public.courses (id, slug, title, trainer_name, summary, description, category, level, price, currency, is_published, thumbnail_url, thumbnail_type)
SELECT
  'c2222222-2222-2222-2222-222222222222',
  'fullstack-web-architecture',
  'Modern Full-Stack Web Architecture',
  'Prof. Vikramaditya V.',
  'Build production-grade Next.js, React, Node.js, and Supabase cloud applications.',
  'Learn server-side rendering, real-time database synchronization, authentication flows, and state management.',
  'Full-Stack Dev',
  'intermediate',
  79.00,
  'INR',
  true,
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  'image'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE id = 'c2222222-2222-2222-2222-222222222222');

INSERT INTO public.courses (id, slug, title, trainer_name, summary, description, category, level, price, currency, is_published, thumbnail_url, thumbnail_type)
SELECT
  'c4444444-4444-4444-4444-444444444444',
  'ai-deep-learning-systems',
  'AI & Deep Learning Systems Engineering',
  'Dr. Ananya Roy',
  'Train neural networks, PyTorch model deployment, and generative AI pipeline orchestration.',
  'Master deep learning mathematics, transformer architectures, GPU acceleration, and vector database embeddings.',
  'AI & Data Science',
  'advanced',
  99.00,
  'INR',
  true,
  'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
  'image'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE id = 'c4444444-4444-4444-4444-444444444444');
