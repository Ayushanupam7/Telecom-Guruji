-- ==============================================================================
-- SIGNALHUB MIGRATION: ADD IMAGE & VIDEO COURSE THUMBNAILS TO SUPABASE
-- Migration File: 20260814020000_add_course_thumbnails.sql
-- Description: Adds thumbnail_url and thumbnail_type columns to public.courses,
--              enabling image and video course thumbnails across Student & Instructor UI.
-- ==============================================================================

-- 1. Ensure thumbnail_url and thumbnail_type columns exist safely on courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_type TEXT DEFAULT 'image';

-- 2. Populate missing thumbnail_url values with curated high-quality presets
UPDATE public.courses
SET thumbnail_url = CASE 
    WHEN LOWER(category) LIKE '%computer science%' THEN 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'
    WHEN LOWER(category) LIKE '%full-stack%' THEN 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'
    WHEN LOWER(category) LIKE '%ai%' OR LOWER(category) LIKE '%data%' THEN 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80'
    WHEN LOWER(category) LIKE '%system%' THEN 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'
    ELSE 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
END,
thumbnail_type = 'image'
WHERE thumbnail_url IS NULL OR thumbnail_url = '';

-- 3. Grant table permissions
GRANT ALL ON public.courses TO service_role, postgres, authenticated, anon;
