# SignalHub — Database Architecture & Schema Specification

**Engine:** PostgreSQL 15+ (via Supabase)  
**Security model:** Row Level Security (RLS) enabled on ALL tables  
**Primary Key strategy:** `UUIDv4` generated via `gen_random_uuid()`  
**Timestamp standard:** `TIMESTAMPTZ` in UTC  

---

## 1. Entity Relationship Overview

```
                      +-------------------+
                      |     profiles      |
                      +-------------------+
                                |
             +------------------+------------------+
             | 1:N                                 | 1:N
   +-------------------+                 +-------------------+
   |      courses      |                 |    enrollments    |
   +-------------------+                 +-------------------+
             | 1:N                                 |
   +-------------------+                           | 1:N
   |      modules      |                 +-------------------+
   +-------------------+                 |     progress      |
             | 1:N                       +-------------------+
   +-------------------+
   |      lessons      |
   +-------------------+
             | 1:N
   +-----------------------+
   | lesson_content_blocks |
   +-----------------------+
```

---

## 2. Core Tables Schema Definition

### 2.1 Profiles & Role Management (`profiles`)
Extends `auth.users`. Contains user attributes, primary role, and language preference.

```sql
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');

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

CREATE INDEX idx_profiles_role ON profiles(role);
```

---

### 2.2 Course Management Tables

#### `courses`
```sql
CREATE TYPE course_type AS ENUM ('free', 'one_time_purchase', 'subscription');
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all_levels');

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

CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_published_category ON courses(is_published, category);
CREATE INDEX idx_courses_slug ON courses(slug);
```

#### `course_translations`
```sql
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
```

---

### 2.3 Modules & Lessons Architecture

#### `modules`
```sql
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

CREATE INDEX idx_modules_course_order ON modules(course_id, sequence_order);
```

#### `module_translations`
```sql
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
```

#### `lessons`
```sql
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

CREATE INDEX idx_lessons_module_order ON lessons(module_id, sequence_order);
```

#### `lesson_translations`
```sql
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
```

#### `lesson_content_blocks`
```sql
CREATE TYPE content_block_type AS ENUM (
    'TEXT', 'VIDEO', 'YOUTUBE', 'PDF', 'IMAGE', 'QUIZ', 'EMBED', 'CODE'
);

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

CREATE INDEX idx_content_blocks_lesson ON lesson_content_blocks(lesson_id, sequence_order);
```

---

### 2.4 Enrollments & Progress Engine

#### `enrollments`
```sql
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'revoked');

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

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
```

#### `progress`
```sql
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

CREATE INDEX idx_progress_student_course ON progress(student_id, course_id);
```

---

### 2.5 Question Banks, Quizzes & Assessment Engine

#### `question_banks`
```sql
CREATE TABLE question_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `questions` & `question_options`
```sql
CREATE TYPE question_type AS ENUM ('single_choice', 'multiple_choice', 'true_false');
CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'hard');

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

CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    sequence_order INT NOT NULL,
    UNIQUE(question_id, sequence_order)
);
```

> ⚠️ **SECURITY CRITICAL RULE**: `is_correct` field in `question_options` is NEVER readable by student roles via public select queries. Student answers are evaluated strictly on the backend / via secure RPC functions.

#### `quizzes` & `quiz_attempts`
```sql
CREATE TYPE quiz_type AS ENUM ('module_quiz', 'surprise_quiz');

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

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score_percent INT NOT NULL DEFAULT 0,
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    selected_option_ids UUID[] NOT NULL DEFAULT '{}',
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    points_earned NUMERIC(5, 2) NOT NULL DEFAULT 0.00
);
```

#### `final_assessments`
```sql
CREATE TABLE final_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE UNIQUE,
    title TEXT NOT NULL,
    passing_score_percent INT NOT NULL DEFAULT 80,
    total_questions INT NOT NULL DEFAULT 30,
    time_limit_minutes INT DEFAULT 60,
    max_attempts INT NOT NULL DEFAULT 2,
    module_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.6 Certificate System

```sql
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

CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_hash ON certificates(verification_hash);
```

---

### 2.7 AI Pipeline & Document Storage Tables

```sql
CREATE TABLE source_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_type VARCHAR(10) NOT NULL, -- pdf, pptx, docx
    file_size_bytes BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'uploaded', -- uploaded, parsing, chunked, generated, failed
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE source_asset_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_asset_id UUID NOT NULL REFERENCES source_assets(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    extracted_text TEXT NOT NULL,
    extracted_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lesson_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    source_asset_id UUID NOT NULL REFERENCES source_assets(id) ON DELETE CASCADE,
    page_number INT,
    slide_number INT,
    excerpt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Row Level Security Policies (RLS Summary)

Row Level Security is enabled on **every** table.

### Example Key Policies:

```sql
-- ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Public profiles are readable by authenticated users" 
ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- COURSES
CREATE POLICY "Published courses are viewable by anyone" 
ON courses FOR SELECT USING (is_published = true);

CREATE POLICY "Instructors can view their own draft courses" 
ON courses FOR SELECT TO authenticated USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can insert/update their own courses" 
ON courses FOR ALL TO authenticated 
USING (instructor_id = auth.uid() AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('instructor', 'admin')
));

-- ENROLLMENTS
CREATE POLICY "Students can view their own enrollments" 
ON enrollments FOR SELECT TO authenticated USING (student_id = auth.uid());

-- PROGRESS
CREATE POLICY "Students can view and manage their own progress" 
ON progress FOR ALL TO authenticated USING (student_id = auth.uid());
```
