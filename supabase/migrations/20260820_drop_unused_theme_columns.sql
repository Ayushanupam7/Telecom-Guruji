-- ==============================================================================
-- MIGRATION: 20260820_drop_unused_theme_columns.sql
-- DESCRIPTION: Safely drop unused theme_preference column and indexes from public.profiles
--              and public.user_quick_tools (theme is now saved exclusively in localStorage).
-- ==============================================================================

-- 1. Drop index on theme_preference if exists
DROP INDEX IF EXISTS public.idx_profiles_theme_preference;
DROP INDEX IF EXISTS public.idx_user_quick_tools_theme;

-- 2. Drop unused theme_preference column from public.profiles
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS theme_preference;

-- 3. Drop unused theme_preference column from public.user_quick_tools (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'user_quick_tools'
  ) THEN
    ALTER TABLE public.user_quick_tools 
    DROP COLUMN IF EXISTS theme_preference;
    RAISE NOTICE 'Dropped theme_preference from user_quick_tools';
  END IF;
END $$;

-- 4. Verify updated columns on profiles table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
