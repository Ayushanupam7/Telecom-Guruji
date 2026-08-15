# SignalHub — Production Security & Threat Model Specification

**Security Standard:** Enterprise EdTech Zero-Trust  
**Data Isolation:** PostgreSQL Row Level Security (RLS) + JWT Claims  

---

## 1. Security Architecture & Threat Matrix

SignalHub operates under a zero-trust model: **The frontend client is untrusted.** All access control, progress calculations, quiz scoring, and payment grants occur exclusively in authenticated server-side contexts.

| Threat Scenario | Vulnerability / Impact | Defense Mechanism |
| :--- | :--- | :--- |
| **Quiz Answer Inspection** | Student inspects client DOM/Network payload to read correct answers. | **Backend Scoring Only**: Correct option flags (`is_correct`) are stripped before returning question payloads. Answers are evaluated via server RPC `submit_quiz_attempt`. |
| **Progress Bypass** | Student sends `completed = true` request via API tool to bypass video/lesson. | **Heartbeat & Threshold Validation**: Server verifies cumulative watched percentage against content block duration before marking `progress.is_completed = true`. |
| **Unauthorized Paid Content Access** | Student accesses direct video or PDF storage URLs for paid courses. | **Private Storage Buckets & Signed URLs**: Course media buckets are private. Signed URLs (15-min TTL) are generated only after checking active enrollment in RLS / server session. |
| **Fake Payment Enrollment** | Attacker calls `/api/enroll` claiming successful checkout. | **Server-side Webhook Verification**: Enrollments for paid courses require verified webhook signature (e.g. Stripe / Razorpay secret signature check). |
| **Role Spoofing** | Student alters localStorage to claim `instructor` or `admin` role. | **Database RLS & JWT Role Claims**: RLS policies evaluate `auth.jwt() -> 'user_metadata' -> 'role'` and enforce DB-level constraints. |
| **Certificate Forgery** | Student fabricates a certificate image or alters name. | **Cryptographic Verification Hash**: Certificates store a SHA-256 hash signed with a server secret. Public verification checks database state. |

---

## 2. Row Level Security Policy Matrix

| Table Name | Public (Unauthenticated) | Student | Instructor | Admin |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | ❌ | Read own/public | Read own/public | Full Access |
| `courses` | Read Published | Read Published | Read/Write Owned | Full Access |
| `modules` / `lessons` | Read if Free Preview or Enrolled | Read if Enrolled | Read/Write Owned Course | Full Access |
| `lesson_content_blocks` | Read if Free Preview or Enrolled | Read if Enrolled | Read/Write Owned Course | Full Access |
| `enrollments` | ❌ | Read Own | Read for Owned Courses | Full Access |
| `progress` | ❌ | Read/Write Own | Read for Owned Courses | Full Access |
| `questions` | ❌ | Read Attempt Questions (No answers) | Read/Write Owned | Full Access |
| `quiz_attempts` / `answers` | ❌ | Read/Write Own Attempts | Read for Owned Courses | Full Access |
| `certificates` | Read by Hash (Verification) | Read Own | Read for Owned Courses | Full Access |

---

## 3. Storage Bucket Security Model

Supabase Storage is organized into strict public and private buckets:

```
storage/
├── avatars/               # PUBLIC  (Max 2MB, png/jpg/webp)
├── course-thumbnails/    # PUBLIC  (Max 5MB, png/jpg/webp)
├── course-assets/        # PRIVATE (Documents, PPTX, PDFs for AI parser)
├── course-videos/        # PRIVATE (HLS/MP4 video files for paid courses)
└── certificates/          # PRIVATE (Generated PDF certificates)
```

### Storage Security Policy Example
```sql
-- Private Course Videos Bucket Policy
CREATE POLICY "Access course videos if enrolled"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'course-videos' AND (
        -- User is the instructor
        EXISTS (
            SELECT 1 FROM courses 
            WHERE instructor_id = auth.uid() 
            AND storage.filename(name) LIKE id::text || '/%'
        )
        OR
        -- User is an active enrolled student
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = auth.uid() 
            AND e.status = 'active'
            AND storage.filename(name) LIKE c.id::text || '/%'
        )
    )
);
```

---

## 4. Environment Variables & Secret Separation

Secrets are categorized by accessibility tier:

### Public Environment Variables (`.env.local` / Frontend Client)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

### Confidential Server-Only Environment Variables (Never bundled in client)
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_API_KEY` (Gemini API Key)
- `PAYMENT_PROVIDER_SECRET_KEY`
- `PAYMENT_WEBHOOK_SECRET`
- `CERTIFICATE_SIGNING_SECRET`
