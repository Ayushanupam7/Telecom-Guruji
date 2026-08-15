-- ==============================================================================
-- SIGNALHUB SUPABASE MIGRATION: AVATAR URL & STUDENT SESSION TRACKING
-- Migration File: 20260814000000_add_avatar_url_and_student_tracking.sql
-- Description: Ensures public.profiles table has avatar_url, theme_preference,
--              last_login_at, last_logout_at, and search_history columns with full RLS permissions.
-- ==============================================================================

-- 1. Ensure public.profiles table has avatar_url and student tracking columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 21;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) DEFAULT 'light';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS search_history JSONB DEFAULT '[]'::jsonb;

-- 2. Add helpful indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create or Replace RLS Policies to allow reading and updating profiles
DO $$
BEGIN
    -- Public/Authenticated read policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Public profiles read access'
    ) THEN
        CREATE POLICY "Public profiles read access" ON public.profiles
            FOR SELECT USING (true);
    END IF;

    -- Self-update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Self-insert policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile" ON public.profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 5. Grant permissions to service_role and authenticated users
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Verification Query (Run this to verify columns):
-- SELECT id, email, full_name, avatar_url, theme_preference, last_login_at, last_logout_at FROM public.profiles;
