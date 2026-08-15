export type UserRole = 'student' | 'instructor' | 'admin';
export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'bn' | 'ta' | 'te' | 'gu' | 'kn' | 'ml' | 'pa' | 'or' | 'as' | 'ur';

export type CourseType = 'free' | 'one_time_purchase' | 'subscription' | 'paid';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';

export type ContentBlockType = 
  | 'TEXT'
  | 'VIDEO'
  | 'YOUTUBE'
  | 'PDF'
  | 'IMAGE'
  | 'QUIZ'
  | 'EMBED'
  | 'CODE';

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuizType = 'module_quiz' | 'surprise_quiz';
export type EnrollmentStatus = 'active' | 'completed' | 'revoked';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  preferred_language: SupportedLanguage;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttentionCheckConfig {
  enabled: boolean;
  triggerIntervalSlides: number; // e.g. after every 1 or 2 slides
  timeoutSeconds: number; // e.g. 30 seconds
}

export interface CourseSlide {
  id: string;
  slide_number: number;
  title: string;
  content_type: 'text' | 'video' | 'code' | 'image';
  body_markdown?: string;
  media_url?: string;
  code_snippet?: string;
}

export interface FinalAssessment {
  id: string;
  title: string;
  description: string;
  passing_score_percent: number;
  questions: Question[];
}

export interface Course {
  id: string;
  instructor_id: string;
  trainer_name?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  thumbnail_url?: string | null;
  category: string;
  level: CourseLevel;
  default_language: SupportedLanguage;
  course_type: CourseType;
  price: number;
  currency: string;
  is_published: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  // Module-type course additions
  content_overview?: {
    syllabus_summary?: string;
    prerequisites?: string;
    target_audience?: string;
    learning_outcomes?: string[];
  };
  final_assessment?: FinalAssessment;
  attention_check?: AttentionCheckConfig;
  // Joined fields
  instructor?: Profile;
  modules?: Module[];
}

export interface CourseTranslation {
  id: string;
  course_id: string;
  language: SupportedLanguage;
  title: string;
  summary: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  sequence_order: number;
  is_free_preview: boolean;
  slides?: CourseSlide[];
  quiz?: Quiz;
  unlock_requirement?: {
    type: 'sequential' | 'free';
    prerequisite_module_id?: string;
  } | null;
  created_at: string;
  updated_at: string;
  // Joined
  lessons?: Lesson[];
  quizzes?: Quiz[];
}

export interface ModuleTranslation {
  id: string;
  module_id: string;
  language: SupportedLanguage;
  title: string;
  description?: string | null;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  sequence_order: number;
  is_free_preview: boolean;
  is_optional: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  content_blocks?: LessonContentBlock[];
}

export interface LessonTranslation {
  id: string;
  lesson_id: string;
  language: SupportedLanguage;
  title: string;
  description?: string | null;
}

export interface TextBlockPayload {
  markdown: string;
}

export interface VideoBlockPayload {
  video_url: string;
  duration_seconds: number;
  required_watch_percent: number;
}

export interface YoutubeBlockPayload {
  youtube_url: string;
  video_id: string;
  duration_seconds?: number;
  required_watch_percent: number;
}

export interface PdfBlockPayload {
  pdf_url: string;
  file_name: string;
}

export interface ImageBlockPayload {
  image_url: string;
  caption?: string;
}

export interface QuizBlockPayload {
  question_id: string;
}

export interface CodeBlockPayload {
  code: string;
  language: string;
}

export type ContentBlockPayload = 
  | TextBlockPayload 
  | VideoBlockPayload 
  | YoutubeBlockPayload 
  | PdfBlockPayload 
  | ImageBlockPayload 
  | QuizBlockPayload 
  | CodeBlockPayload 
  | Record<string, unknown>;

export interface LessonContentBlock {
  id: string;
  lesson_id: string;
  block_type: ContentBlockType;
  sequence_order: number;
  content_payload: ContentBlockPayload;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at?: string | null;
  updated_at: string;
  course?: Course;
}

export interface Progress {
  id: string;
  student_id: string;
  course_id: string;
  lesson_id: string;
  content_block_id?: string | null;
  is_completed: boolean;
  video_watch_percent: number;
  last_position_seconds: number;
  completed_at?: string | null;
  updated_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct?: boolean; // Note: stripped out for student payloads
  sequence_order: number;
}

export interface Question {
  id: string;
  bank_id: string;
  module_id?: string | null;
  lesson_id?: string | null;
  question_text: string;
  question_type: QuestionType;
  difficulty: QuestionDifficulty;
  topic?: string | null;
  explanation?: string | null;
  default_language: SupportedLanguage;
  options?: QuestionOption[];
}

export interface Quiz {
  id: string;
  module_id: string;
  title: string;
  quiz_type: QuizType;
  passing_score_percent: number;
  total_questions_to_select: number;
  time_limit_minutes?: number | null;
  max_attempts: number;
  is_randomized: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score_percent: number;
  is_passed: boolean;
  started_at: string;
  completed_at?: string | null;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_ids: string[];
  is_correct: boolean;
  points_earned: number;
}

export interface Certificate {
  id: string;
  student_id: string;
  course_id: string;
  certificate_number: string;
  verification_hash: string;
  issue_date: string;
  pdf_storage_path?: string | null;
  metadata?: Record<string, unknown>;
  student_name?: string;
  course_title?: string;
  instructor_name?: string;
}
