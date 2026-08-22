export type UserRole = 'student' | 'instructor' | 'admin';
export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'bn' | 'ta' | 'te' | 'gu' | 'kn' | 'ml' | 'pa' | 'or' | 'as' | 'ur';

export type CourseType = 'free' | 'one_time_purchase' | 'subscription' | 'paid';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
export type CourseStatus = 'draft' | 'ready_for_review' | 'published' | 'unpublished';
export type CourseCreationMethod = 'manual' | 'manual_ai' | 'ai_generated' | 'ppt' | 'video';

export type CourseTheme = 'telecom_classic' | 'modern' | 'minimal' | 'professional';
export type TypographyFamily = 'roboto' | 'inter' | 'outfit' | 'system';
export type CardStyle = 'bordered' | 'glass' | 'elevated' | 'flat';
export type SlideLayout = 'standard' | 'wide' | 'split';
export type CertificateDesign = 'classic' | 'modern' | 'professional';

export interface CourseTemplateConfig {
  theme: CourseTheme;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  typography: TypographyFamily;
  cardStyle: CardStyle;
  slideLayout: SlideLayout;
  certificateDesign: CertificateDesign;
}

export interface CertificateConfig {
  template: CertificateDesign;
  title: string;
  logoUrl?: string;
  signatureName: string;
  signatureTitle?: string;
  signatureUrl?: string;
  accentColor: string;
  backgroundPattern?: string;
}

export type RichBlockType =
  | 'heading'
  | 'paragraph'
  | 'bullet_list'
  | 'image'
  | 'table'
  | 'video'
  | 'audio'
  | 'chart'
  | 'graphic'
  | 'quote'
  | 'code'
  | 'file'
  | 'divider';

export interface RichBlock {
  id: string;
  type: RichBlockType;
  content: {
    text?: string;
    level?: 1 | 2 | 3;
    items?: string[];
    url?: string;
    caption?: string;
    alt?: string;
    headers?: string[];
    rows?: string[][];
    language?: string;
    code?: string;
    author?: string;
    chartType?: 'bar' | 'line' | 'pie';
    chartData?: Array<{ label: string; value: number }>;
    fileName?: string;
    fileSize?: string;
    durationSeconds?: number;
    videoProvider?: 'direct' | 'youtube' | 'vimeo';
    graphicType?: 'telecom_stack' | 'signal_flow' | 'network_topo' | 'placeholder';
    [key: string]: unknown;
  };
  styles?: Record<string, string>;
}

export interface CourseSlide {
  id: string;
  slide_number: number;
  title: string;
  content_type: 'block_based' | 'text' | 'video' | 'code' | 'image';
  body_markdown?: string;
  media_url?: string;
  code_snippet?: string;
  blocks?: RichBlock[];
  notes?: string;
  duration_seconds?: number;
  translations?: Record<string, {
    title?: string;
    body_markdown?: string;
    notes?: string;
  }>;
}

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';
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
  triggerIntervalSlides: number;
  timeoutSeconds: number;
}

export interface FinalAssessment {
  id: string;
  title: string;
  description: string;
  passing_score_percent: number;
  time_limit_minutes?: number;
  max_attempts?: number;
  questions: Question[];
  translations?: Record<string, {
    title?: string;
    description?: string;
  }>;
}

export interface Course {
  id: string;
  instructor_id: string;
  trainer_name?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  detailed_description?: string;
  thumbnail_url?: string | null;
  thumbnail_type?: 'image' | 'video';
  course_background?: string | null;
  category: string;
  level: CourseLevel;
  default_language: SupportedLanguage;
  course_type: CourseType;
  price: number;
  currency: string;
  is_published: boolean;
  status?: CourseStatus;
  creation_method?: CourseCreationMethod;
  course_duration?: number | string;
  tags?: string[];
  template_config?: CourseTemplateConfig;
  certificate_config?: CertificateConfig;
  modules_count?: number;
  lessons_count?: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  // Content Overview
  content_overview?: {
    syllabus_summary?: string;
    prerequisites?: string;
    target_audience?: string;
    learning_outcomes?: string[];
  };
  final_assessment?: FinalAssessment;
  attention_check?: AttentionCheckConfig;
  guruji_config?: GurujiConfig;
  translations?: Record<string, {
    title?: string;
    summary?: string;
    description?: string;
  }>;
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
  duration_minutes?: number;
  learning_outcomes?: string[];
  has_quiz?: boolean;
  slides?: CourseSlide[];
  slides_data?: CourseSlide[];
  quiz?: Quiz;
  quiz_data?: Quiz;
  translations?: Record<string, {
    title?: string;
    description?: string;
  }>;
  unlock_requirement?: {
    type: 'sequential' | 'free';
    prerequisite_module_id?: string;
  } | null;
  created_at: string;
  updated_at?: string;
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
  duration_seconds?: number;
  content_type?: 'video' | 'article' | 'interactive' | 'slides';
  content_url?: string;
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

export type ContentBlockType = 
  | 'TEXT'
  | 'VIDEO'
  | 'YOUTUBE'
  | 'PDF'
  | 'IMAGE'
  | 'QUIZ'
  | 'EMBED'
  | 'CODE';

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
  payment_status?: 'free' | 'paid' | 'pending' | 'refunded';
  amount_paid?: number;
  payment_method?: string;
  utr_number?: string;
  transaction_ref?: string;
  student_name?: string;
  student_email?: string;
  enrolled_at: string;
  completed_at?: string | null;
  updated_at?: string;
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
  question_id?: string;
  option_text: string;
  is_correct?: boolean;
  sequence_order: number;
}

export interface Question {
  id: string;
  bank_id?: string;
  module_id?: string | null;
  lesson_id?: string | null;
  question_text: string;
  question_type: QuestionType;
  difficulty: QuestionDifficulty;
  topic?: string | null;
  explanation?: string | null;
  marks?: number;
  default_language?: SupportedLanguage;
  options?: QuestionOption[];
}

export interface Quiz {
  id: string;
  module_id?: string;
  title: string;
  description?: string;
  quiz_type?: QuizType;
  passing_score_percent: number;
  total_questions_to_select?: number;
  time_limit_minutes?: number | null;
  max_attempts?: number;
  is_randomized?: boolean;
  questions?: Question[];
  created_at?: string;
  updated_at?: string;
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

// AI Settings & Strategy
export type AIProviderType = 'groq' | 'gemini';

export interface AIProviderConfig {
  id?: string;
  user_id?: string;
  provider: AIProviderType;
  api_key?: string;
  masked_key?: string;
  model: string;
  is_enabled: boolean;
  is_primary: boolean;
  usage?: string;
  status?: 'connected' | 'not_configured' | 'error';
  last_tested_at?: string;
}

export interface AIStrategyConfig {
  primaryProvider: AIProviderType;
  fallbackProvider: AIProviderType;
  groqModel: string;
  geminiModel: string;
  temperature: number;
  maxTokens: number;
}

// Guruji AI Learning Assistant & Avatar Overlay Types
export interface GurujiConfig {
  enabled: boolean;
  allow_slide_explanation?: boolean;
  allow_full_scan?: boolean;
  allow_ask_questions?: boolean;
  allow_voice?: boolean;
  allow_mic?: boolean;
  default_language?: 'en' | 'hi' | 'hinglish';
  auto_speak?: boolean;
}

export type GurujiAvatarState =
  | 'idle'
  | 'walking'
  | 'arriving'
  | 'thinking'
  | 'listening'
  | 'speaking'
  | 'paused'
  | 'exiting'
  | 'error';

export type GurujiViseme = 'rest' | 'A' | 'E' | 'I' | 'O' | 'U' | 'consonant';

export type GurujiGesture =
  | 'none'
  | 'point_slide'
  | 'pocket_point'
  | 'open_hand'
  | 'open_both_hands'
  | 'one_up_one_down'
  | 'both_hands_up'
  | 'folded_arms'
  | 'join_hands'
  | 'nod'
  | 'emphasis';

export type GurujiVoiceLanguage =
  | 'en'
  | 'hi'
  | 'hinglish'
  | 'ta'
  | 'te'
  | 'kn'
  | 'ml'
  | 'bn'
  | 'mr'
  | 'gu'
  | (string & {});

export interface GurujiVoiceSettings {
  language: GurujiVoiceLanguage;
  voiceId: string;
  speed: number;
  volume: number;
  autoSpeak: boolean;
  simplifiedAnimations?: boolean;
}

export type GurujiContextMode = 'slide' | 'module' | 'course';

export interface GurujiMessage {
  id: string;
  role: 'student' | 'guruji' | 'system';
  content: string;
  timestamp: string;
  contextMode?: GurujiContextMode;
  slideId?: string;
  slideTitle?: string;
}

export interface GurujiScanProgress {
  stage: 'structure' | 'modules' | 'lessons' | 'concepts' | 'knowledge' | 'complete';
  percent: number;
  message: string;
  completedStages: string[];
}

export interface GurujiSlideContext {
  courseId: string;
  courseTitle: string;
  courseSummary?: string;
  moduleId: string;
  moduleTitle: string;
  lessonId?: string;
  slideId: string;
  slideNumber: number;
  slideTitle: string;
  contentType: string;
  bodyMarkdown?: string;
  codeSnippet?: string;
  blocksText?: string;
  imageUrls?: string[];
  tablesSummary?: string;
  notes?: string;
  prevSlideTitle?: string;
  nextSlideTitle?: string;
}

