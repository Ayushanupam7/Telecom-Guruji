# SignalHub — API & Contract Specification

**Protocol:** Supabase SDK (Client/Server) + Next.js Server Actions + Edge Functions  
**Response Format:** Typed Standard JSON Envelope  

---

## 1. Standard API Response Structure

All endpoints return a uniform envelope:

```typescript
export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } | null;
  timestamp: string;
};
```

### Standard Error Codes
- `UNAUTHORIZED` (401): Missing or invalid auth session.
- `FORBIDDEN` (403): RLS violation or insufficient user role.
- `NOT_FOUND` (404): Resource missing or access restricted.
- `PAYMENT_REQUIRED` (402): Premium course locked.
- `PROGRESS_LOCKED` (423): Sequential module locked until prerequisite completion.
- `QUIZ_ATTEMPTS_EXCEEDED` (429): Maximum retry limit hit.
- `INTERNAL_ERROR` (500): Server runtime error.

---

## 2. Authentication & Profile Contracts

### `auth.signUp`
Registers user and automatically creates a `profiles` entry via PostgreSQL trigger.

```typescript
// Input
interface SignUpPayload {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'instructor';
  preferredLanguage?: 'en' | 'hi' | 'mr';
}
```

---

## 3. Student Learning APIs & RPC Functions

### `rpc/get_course_structure`
Retrieves course metadata, translated content according to `x-language` header, modules, lessons, and content block metadata. Checks student's enrollment status to filter locked vs free preview content.

```typescript
// Header
// Accept-Language: hi | en | mr

// Response
interface CourseStructureResponse {
  course: {
    id: string;
    title: string;
    summary: string;
    description: string;
    category: string;
    level: string;
    isEnrolled: boolean;
  };
  modules: Array<{
    id: string;
    title: string;
    sequenceOrder: number;
    isLocked: boolean;
    isFreePreview: boolean;
    lessons: Array<{
      id: string;
      title: string;
      sequenceOrder: number;
      isCompleted: boolean;
      isFreePreview: boolean;
      contentBlocks: Array<{
        id: string;
        blockType: 'TEXT' | 'VIDEO' | 'YOUTUBE' | 'PDF' | 'IMAGE' | 'QUIZ' | 'EMBED' | 'CODE';
        sequenceOrder: number;
        contentPayload: Record<string, unknown>; // Strip secret keys or quiz answers
      }>;
    }>;
    moduleQuiz?: {
      id: string;
      title: string;
      passingScorePercent: number;
      maxAttempts: number;
      userAttemptsCount: number;
      isPassed: boolean;
    };
  }>;
}
```

---

### `rpc/record_video_heartbeat`
Periodically invoked by player every 15 seconds to log watch percentage.

```typescript
interface RecordVideoHeartbeatPayload {
  courseId: string;
  lessonId: string;
  contentBlockId: string;
  currentPositionSeconds: number;
  durationSeconds: number;
  watchedPercentage: number; // calculated on client, verified on server against duration
}

interface RecordVideoHeartbeatResult {
  lessonCompleted: boolean;
  nextLessonUnlocked: boolean;
}
```

---

### `rpc/start_quiz_attempt`
Generates a new quiz attempt. For surprise quizzes, randomly selects $K$ questions from the module's pool. **Does NOT include correct answers in the returned question array.**

```typescript
interface StartQuizAttemptPayload {
  quizId: string;
}

interface StartQuizAttemptResult {
  attemptId: string;
  quizTitle: string;
  timeLimitMinutes?: number;
  questions: Array<{
    questionId: string;
    questionText: string;
    questionType: 'single_choice' | 'multiple_choice' | 'true_false';
    options: Array<{
      optionId: string;
      optionText: string;
      sequenceOrder: number;
    }>;
  }>;
}
```

---

### `rpc/submit_quiz_attempt`
Evaluates quiz submission securely server-side, records attempt score, determines pass/fail status, and unlocks next module if passed.

```typescript
interface SubmitQuizAttemptPayload {
  attemptId: string;
  answers: Array<{
    questionId: string;
    selectedOptionIds: string[];
  }>;
}

interface SubmitQuizAttemptResult {
  attemptId: string;
  scorePercent: number;
  isPassed: boolean;
  correctAnswersCount: number;
  totalQuestions: number;
  nextModuleUnlocked: boolean;
  explanations?: Array<{
    questionId: string;
    isCorrect: boolean;
    explanation: string;
  }>;
}
```

---

## 4. Instructor & AI Builder Contracts

### `api/ai/parse-document`
Edge Function: Accepts document upload, extracts text/images/tables, creates `source_assets` and `source_asset_pages`.

```typescript
interface ParseDocumentResponse {
  sourceAssetId: string;
  fileName: string;
  pageCount: number;
  status: 'parsed';
}
```

---

### `api/ai/generate-course`
Invokes multimodal LLM to transform parsed document into structured draft course.

```typescript
interface GenerateCoursePayload {
  sourceAssetId: string;
  targetLanguages: string[]; // e.g. ['en', 'hi', 'mr']
  moduleCountHint?: number;
  targetAudience?: string;
}

interface GenerateCourseResult {
  draftCourseId: string;
  generatedModulesCount: number;
  generatedLessonsCount: number;
  generatedQuestionsCount: number;
  status: 'draft';
}
```

---

## 5. Certificate Public Verification API

### `GET /api/certificates/verify/:hash`
Public read-only verification endpoint for QR code validation.

```typescript
interface CertificateVerificationResponse {
  isValid: boolean;
  certificateNumber: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  issueDate: string;
  verificationUrl: string;
}
```
