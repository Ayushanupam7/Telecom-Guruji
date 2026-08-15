-- ==============================================================================
-- SIGNALHUB SUPABASE DATABASE MIGRATION SCRIPT
-- Copy & Paste this entire script into your Supabase SQL Editor and click "RUN"
-- ==============================================================================

-- 1. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    instructor_id TEXT NOT NULL DEFAULT 'inst-101',
    trainer_name TEXT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    summary TEXT,
    description TEXT,
    category TEXT DEFAULT 'Computer Science',
    level TEXT DEFAULT 'intermediate',
    course_type TEXT DEFAULT 'free',
    price NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    is_published BOOLEAN DEFAULT false, -- Defaults to DRAFT mode until instructor verifies & publishes
    published_at TIMESTAMPTZ,
    content_overview JSONB,
    attention_check JSONB,
    final_assessment JSONB,
    modules_count INT DEFAULT 0,
    lessons_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if table was previously created
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS trainer_name TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS content_overview JSONB;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS attention_check JSONB;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS final_assessment JSONB;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 2. MODULES TABLE (With Slide Decks & Quizzes)
CREATE TABLE IF NOT EXISTS public.modules (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sequence_order INT DEFAULT 1,
    is_free_preview BOOLEAN DEFAULT false,
    slides_data JSONB, -- Stores Slide 1, Slide 2, Slide 3...
    quiz_data JSONB,   -- Stores Module Quiz questions & pass threshold
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS slides_data JSONB;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS quiz_data JSONB;

-- 3. ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    payment_status TEXT DEFAULT 'unpaid',
    amount_paid NUMERIC DEFAULT 0,
    student_name TEXT,
    student_email TEXT,
    enrolled_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROGRESS TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    video_watch_percent NUMERIC DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES & PERMISSIONS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- Allow Public & Authenticated Read Access to Courses & Modules
DROP POLICY IF EXISTS "Public Read Access Courses" ON public.courses;
CREATE POLICY "Public Read Access Courses" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access Modules" ON public.modules;
CREATE POLICY "Public Read Access Modules" ON public.modules FOR SELECT USING (true);

-- Allow Full Access to Service Role / Admin & Instructors
DROP POLICY IF EXISTS "Instructor Insert Courses" ON public.courses;
CREATE POLICY "Instructor Insert Courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Instructor Insert Modules" ON public.modules;
CREATE POLICY "Instructor Insert Modules" ON public.modules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Student Enrollments" ON public.enrollments;
CREATE POLICY "Student Enrollments" ON public.enrollments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Student Progress" ON public.progress;
CREATE POLICY "Student Progress" ON public.progress FOR ALL USING (true) WITH CHECK (true);

-- Grant privileges to anon, authenticated, and service_role
GRANT ALL ON TABLE public.courses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.modules TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.enrollments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.progress TO anon, authenticated, service_role;
