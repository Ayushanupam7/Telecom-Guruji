-- ==============================================================================
-- TELECOM GURUJI: QUICK TOOLS DRAWER SUPABASE SYNCHRONIZATION MIGRATION
-- Supports: App Language, Light/Dark Theme, Multi-Notebooks & Pages, AI Glossary Bookmarks
-- ==============================================================================

-- 0. ENABLE REQUIRED EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. EXTEND PROFILES TABLE (PRIMARY STORAGE FOR QUICK TOOLS DRAWER)
-- ==============================================================================

-- Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  age INTEGER DEFAULT 21,
  preferred_language TEXT DEFAULT 'en',
  theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark')),
  avatar_url TEXT,
  search_history JSONB DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMPTZ,
  last_logout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all Quick Tools columns exist on profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'light';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS search_history JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- GIN Index for fast JSONB querying inside student search_history (Notebooks & Glossary)
CREATE INDEX IF NOT EXISTS idx_profiles_search_history_gin ON public.profiles USING GIN (search_history);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON public.profiles(preferred_language);
CREATE INDEX IF NOT EXISTS idx_profiles_theme_preference ON public.profiles(theme_preference);

-- ==============================================================================
-- 2. DEDICATED USER QUICK TOOLS TABLE (OPTIONAL RELATIONAL SCHEMA)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_quick_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'en',
  theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark')),
  scratchpad_notes TEXT DEFAULT '',
  notebooks JSONB DEFAULT '[
    {
      "id": "nb-default-1",
      "name": "My Telecom Study Notes",
      "color": "sky",
      "pages": [
        {
          "id": "pg-default-1",
          "title": "General Scratchpad",
          "content": "",
          "createdAt": "2026-08-18T00:00:00.000Z",
          "updatedAt": "2026-08-18T00:00:00.000Z"
        }
      ],
      "activePageId": "pg-default-1",
      "createdAt": "2026-08-18T00:00:00.000Z",
      "updatedAt": "2026-08-18T00:00:00.000Z"
    }
  ]'::jsonb,
  saved_glossary JSONB DEFAULT '[]'::jsonb,
  glossary_history JSONB DEFAULT '[]'::jsonb,
  last_synced_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_user_quick_tools_user_id UNIQUE (user_id)
);

-- Indexes on user_quick_tools
CREATE INDEX IF NOT EXISTS idx_user_quick_tools_user_id ON public.user_quick_tools(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quick_tools_notebooks_gin ON public.user_quick_tools USING GIN (notebooks);
CREATE INDEX IF NOT EXISTS idx_user_quick_tools_glossary_gin ON public.user_quick_tools USING GIN (saved_glossary);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quick_tools ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile quick tools" ON public.profiles;
CREATE POLICY "Users can update their own profile quick tools" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- User Quick Tools Policies
DROP POLICY IF EXISTS "Users can view their own quick tools settings" ON public.user_quick_tools;
CREATE POLICY "Users can view their own quick tools settings" 
  ON public.user_quick_tools FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quick tools settings" ON public.user_quick_tools;
CREATE POLICY "Users can insert their own quick tools settings" 
  ON public.user_quick_tools FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quick tools settings" ON public.user_quick_tools;
CREATE POLICY "Users can update their own quick tools settings" 
  ON public.user_quick_tools FOR UPDATE 
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. AUTOMATIC TIMESTAMP TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.set_quick_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_quick_tools_updated_at ON public.user_quick_tools;
CREATE TRIGGER trigger_user_quick_tools_updated_at
  BEFORE UPDATE ON public.user_quick_tools
  FOR EACH ROW
  EXECUTE FUNCTION public.set_quick_tools_updated_at();

-- ==============================================================================
-- 5. VERIFICATION QUERY (TEST FETCH)
-- ==============================================================================
-- SELECT id, email, preferred_language, theme_preference, search_history->'notebooks' AS notebooks, search_history->'saved_glossary' AS saved_glossary FROM public.profiles LIMIT 5;
