-- ==============================================================================
-- SIGNALHUB SUPABASE FIX: INCOMPATIBLE TYPE FOREIGN KEY RESOLUTION
-- Migration File: 20260814010000_instructor_dashboard_sync.sql
-- Description: Resolves type mismatch between UUID and TEXT keys across courses,
--              modules, and content_blocks tables in Supabase.
-- ==============================================================================

-- 1. Ensure courses columns exist safely
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_id UUID;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Computer Science';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'all_levels';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS modules_count INTEGER DEFAULT 1;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS lessons_count INTEGER DEFAULT 5;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Drop conflicting constraint if present
ALTER TABLE IF EXISTS public.content_blocks DROP CONSTRAINT IF EXISTS content_blocks_module_id_fkey;

-- 3. Create or Ensure Modules Table with compatible key types
CREATE TABLE IF NOT EXISTS public.modules (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create or Ensure Content Blocks Table matching TEXT module_id
CREATE TABLE IF NOT EXISTS public.content_blocks (
    id TEXT PRIMARY KEY,
    module_id TEXT,
    title TEXT NOT NULL,
    block_type TEXT DEFAULT 'VIDEO',
    video_url TEXT,
    video_duration_seconds INTEGER DEFAULT 300,
    content_payload JSONB DEFAULT '{}'::jsonb,
    order_index INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Public view published courses') THEN
        CREATE POLICY "Public view published courses" ON public.courses FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Manage own courses') THEN
        CREATE POLICY "Manage own courses" ON public.courses FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modules' AND policyname = 'Public view modules') THEN
        CREATE POLICY "Public view modules" ON public.modules FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modules' AND policyname = 'Manage modules') THEN
        CREATE POLICY "Manage modules" ON public.modules FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_blocks' AND policyname = 'Public view content') THEN
        CREATE POLICY "Public view content" ON public.content_blocks FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_blocks' AND policyname = 'Manage content') THEN
        CREATE POLICY "Manage content" ON public.content_blocks FOR ALL USING (true);
    END IF;
END $$;

-- 7. Grant Permissions to service_role, postgres, authenticated, and anon
GRANT ALL ON public.courses TO service_role, postgres, authenticated, anon;
GRANT ALL ON public.modules TO service_role, postgres, authenticated, anon;
GRANT ALL ON public.content_blocks TO service_role, postgres, authenticated, anon;

-- Verification Query:
-- SELECT * FROM public.courses LIMIT 5;
