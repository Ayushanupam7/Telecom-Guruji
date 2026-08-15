import { Course, Module, Lesson, QuizAttempt, Quiz, Certificate, SupportedLanguage } from './models';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } | null;
  timestamp: string;
}

export interface CourseCatalogQuery {
  category?: string;
  level?: string;
  language?: SupportedLanguage;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CourseCatalogResult {
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
}

export interface QuizSubmissionPayload {
  attemptId: string;
  answers: Array<{
    questionId: string;
    selectedOptionIds: string[];
  }>;
}

export interface QuizSubmissionResult {
  attemptId: string;
  scorePercent: number;
  isPassed: boolean;
  correctAnswersCount: number;
  totalQuestions: number;
  nextModuleUnlocked: boolean;
  explanations?: Array<{
    questionId: string;
    isCorrect: boolean;
    explanation?: string | null;
  }>;
}

export interface CertificateVerificationResult {
  isValid: boolean;
  certificateNumber: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  issueDate: string;
  verificationUrl: string;
}
