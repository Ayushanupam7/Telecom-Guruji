-- ==============================================================================
-- TELECOM GURUJI: RATINGS & REVIEWS SYSTEM
-- Migration: 20260819_ratings_reviews.sql
-- ==============================================================================

-- 1. Create course_reviews table
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

-- 2. Ensure columns exist (idempotent)
ALTER TABLE public.course_reviews ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.course_reviews ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.course_reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT false;
ALTER TABLE public.course_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. One review per student per course (upsert-safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_course_review'
  ) THEN
    ALTER TABLE public.course_reviews
    ADD CONSTRAINT unique_student_course_review UNIQUE (student_id, course_id);
  END IF;
END $$;

-- 4. Indexes for fast aggregation by course
CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_student_id ON public.course_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.course_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.course_reviews(created_at DESC);

-- 5. Row Level Security
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read all reviews
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.course_reviews;
CREATE POLICY "Reviews are publicly readable"
  ON public.course_reviews
  FOR SELECT
  USING (true);

-- Anyone can insert/update reviews (student auth handled at app layer)
DROP POLICY IF EXISTS "Students can manage own reviews" ON public.course_reviews;
CREATE POLICY "Students can manage own reviews"
  ON public.course_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);
