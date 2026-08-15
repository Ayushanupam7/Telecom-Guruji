-- SignalHub Initial Database Migration
-- Version: 1.0.0

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums (Safe Creation)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_type') THEN
        CREATE TYPE course_type AS ENUM ('free', 'one_time_purchase', 'subscription');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_level') THEN
        CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all_levels');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_block_type') THEN
        CREATE TYPE content_block_type AS ENUM ('TEXT', 'VIDEO', 'YOUTUBE', 'PDF', 'IMAGE', 'QUIZ', 'EMBED', 'CODE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
        CREATE TYPE question_type AS ENUM ('single_choice', 'multiple_choice', 'true_false');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_difficulty') THEN
        CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'hard');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quiz_type') THEN
        CREATE TYPE quiz_type AS ENUM ('module_quiz', 'surprise_quiz');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
        CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'revoked');
    END IF;
END $$;

-- 1. Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'student',
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Courses Table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT,
    category TEXT NOT NULL,
    level course_level NOT NULL DEFAULT 'all_levels',
    default_language VARCHAR(10) NOT NULL DEFAULT 'en',
    course_type course_type NOT NULL DEFAULT 'free',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Course Translations Table
CREATE TABLE course_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, language)
);

-- 4. Modules Table
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sequence_order INT NOT NULL,
    is_free_preview BOOLEAN NOT NULL DEFAULT FALSE,
    unlock_requirement JSONB DEFAULT '{"type": "sequential"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, sequence_order)
);

-- 5. Module Translations Table
CREATE TABLE module_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(module_id, language)
);

-- 6. Lessons Table
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sequence_order INT NOT NULL,
    is_free_preview BOOLEAN NOT NULL DEFAULT FALSE,
    is_optional BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(module_id, sequence_order)
);

-- 7. Lesson Translations Table
CREATE TABLE lesson_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(lesson_id, language)
);

-- 8. Lesson Content Blocks Table
CREATE TABLE lesson_content_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    block_type content_block_type NOT NULL,
    sequence_order INT NOT NULL,
    content_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(lesson_id, sequence_order)
);

-- 9. Enrollments Table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status enrollment_status NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- 10. Progress Table
CREATE TABLE progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    content_block_id UUID REFERENCES lesson_content_blocks(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    video_watch_percent INT NOT NULL DEFAULT 0 CHECK (video_watch_percent BETWEEN 0 AND 100),
    last_position_seconds INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, lesson_id, content_block_id)
);

-- 11. Question Banks Table
CREATE TABLE question_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Questions Table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL DEFAULT 'single_choice',
    difficulty question_difficulty NOT NULL DEFAULT 'medium',
    topic TEXT,
    explanation TEXT,
    default_language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Question Options Table
CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    sequence_order INT NOT NULL,
    UNIQUE(question_id, sequence_order)
);

-- 14. Quizzes Table
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    quiz_type quiz_type NOT NULL DEFAULT 'module_quiz',
    passing_score_percent INT NOT NULL DEFAULT 70 CHECK (passing_score_percent BETWEEN 0 AND 100),
    total_questions_to_select INT NOT NULL DEFAULT 10,
    time_limit_minutes INT,
    max_attempts INT NOT NULL DEFAULT 3,
    is_randomized BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Quiz Attempts Table
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score_percent INT NOT NULL DEFAULT 0,
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 16. Quiz Answers Table
CREATE TABLE quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    selected_option_ids UUID[] NOT NULL DEFAULT '{}',
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    points_earned NUMERIC(5, 2) NOT NULL DEFAULT 0.00
);

-- 17. Certificates Table
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    certificate_number TEXT NOT NULL UNIQUE,
    verification_hash TEXT NOT NULL UNIQUE,
    issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pdf_storage_path TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- INDEXES
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_courses_published_category ON courses(is_published, category);
CREATE INDEX idx_modules_course_order ON modules(course_id, sequence_order);
CREATE INDEX idx_lessons_module_order ON lessons(module_id, sequence_order);
CREATE INDEX idx_content_blocks_lesson ON lesson_content_blocks(lesson_id, sequence_order);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_progress_student_course ON progress(student_id, course_id);
CREATE INDEX idx_certificates_hash ON certificates(verification_hash);

-- TRIGGER FUNCTION: New user creation sync to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, preferred_language)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'SignalHub User'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Profiles
CREATE POLICY "Public profiles are readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Courses
CREATE POLICY "Published courses are viewable by anyone" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Instructors can view own courses" ON courses FOR SELECT USING (instructor_id = auth.uid());
CREATE POLICY "Instructors can insert courses" ON courses FOR INSERT WITH CHECK (instructor_id = auth.uid());
CREATE POLICY "Instructors can update own courses" ON courses FOR UPDATE USING (instructor_id = auth.uid());

-- Modules & Lessons
CREATE POLICY "View modules if course viewable" ON modules FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE id = modules.course_id AND (is_published = true OR instructor_id = auth.uid()))
);

CREATE POLICY "View lessons if course viewable" ON lessons FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM modules m 
        JOIN courses c ON m.course_id = c.id 
        WHERE m.id = lessons.module_id AND (c.is_published = true OR c.instructor_id = auth.uid())
    )
);

-- Content Blocks
CREATE POLICY "View content blocks if course viewable" ON lesson_content_blocks FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM lessons l
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE l.id = lesson_content_blocks.lesson_id AND (c.is_published = true OR c.instructor_id = auth.uid())
    )
);

-- Enrollments & Progress
CREATE POLICY "Students can view own enrollments" ON enrollments FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can insert own enrollments" ON enrollments FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can view own progress" ON progress FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can update own progress" ON progress FOR ALL USING (student_id = auth.uid());

-- Quiz Attempts
CREATE POLICY "Students manage own quiz attempts" ON quiz_attempts FOR ALL USING (student_id = auth.uid());

-- Certificates
CREATE POLICY "Certificates public verify by hash" ON certificates FOR SELECT USING (true);
