# SignalHub — Technical Architecture & Product Specification

**Version:** 1.0.0  
**Status:** Architecture Draft  
**Author:** Lead Software Architect & Engineering Team  
**Last Updated:** August 2026  

---

## 1. Executive Summary & Vision

**SignalHub** is a production-grade, AI-powered EdTech platform designed for both web and mobile clients. It bridges the gap between raw educational content and verifiable student learning through a structured, multi-modal learning engine.

### Core Brand Concept
*Network + Knowledge + Technology + Learning.*  
SignalHub connects instructors, course materials, multimodal AI processing, and students through a secure, structured, and resilient learning network.

### The Problem SignalHub Solves
Traditional course platforms allow passive "click-next" progression without checking comprehension. Students can skim or jump straight to the end of a video, click "Next Lesson", and instantly obtain a certificate without engaging with the material.

**SignalHub's Solution:**  
SignalHub enforces **verified learning progression**. A lesson cannot be marked complete unless configured engagement rules (e.g., watching 90% of a video, completing mandatory content blocks, passing surprise quizzes) are satisfied on the server. Certificates are issued strictly through server-side eligibility validation.

---

## 2. Platform Architecture & Monorepo Structure

SignalHub is built as a unified monorepo supporting both Next.js (Web) and Expo / React Native (Mobile), sharing backend APIs, Supabase PostgreSQL database, schema types, validation rules, and business logic.

```
signalhub/
├── apps/
│   ├── web/                    # Next.js 14+ (App Router), React, Tailwind CSS
│   └── mobile/                 # React Native, Expo, Expo Router
├── packages/
│   ├── types/                  # Shared TypeScript database & API interfaces
│   ├── validation/             # Shared Zod validation schemas
│   └── shared/                 # Shared business logic, constants, i18n helpers
├── supabase/
│   ├── migrations/             # PostgreSQL database migrations & RLS policies
│   ├── functions/              # Supabase Edge Functions (Webhooks, Certificate PDF gen)
│   └── seed/                   # Seed data for development & testing
├── docs/
│   ├── PROJECT_SPEC.md         # This specification document
│   ├── DATABASE.md             # Complete database ERD, table schemas & RLS policies
│   ├── API.md                  # Server action, Edge function & RPC API contracts
│   ├── AI_PIPELINE.md          # Document parsing, AI course & quiz generation pipeline
│   └── SECURITY.md             # Threat model, RLS security matrix & anti-cheat policies
├── .env.example
├── package.json
└── README.md
```

---

## 3. User Roles & RBAC Matrix

Authorization is enforced at the database level using **Supabase Row Level Security (RLS)** and verified in backend API routes. Frontend role checks are exclusively for UI rendering decisions.

| Feature / Action | Student | Instructor | Admin | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :--- |
| Browse / Search Courses | ✅ | ✅ | ✅ | Public RLS read policy on published courses |
| Free Lesson Preview | ✅ | ✅ | ✅ | RLS check (`is_free_preview = true`) |
| Enroll in Free Course | ✅ | ❌ | ✅ | Server RPC insert into `enrollments` |
| Purchase / Subscribe Course | ✅ | ❌ | ✅ | Server-side Webhook verification |
| Complete Lessons & Quizzes | ✅ | ❌ | ❌ | Server RPC validation against attempt limits |
| Download / Verify Certificate | ✅ | ✅ | ✅ | Public read verification endpoint |
| Create / Edit Courses & Modules | ❌ | ✅ (Owner) | ✅ | RLS check (`instructor_id = auth.uid()`) |
| Upload Course Documents (AI) | ❌ | ✅ | ✅ | RLS check on `source_assets` storage & DB |
| Review / Edit AI Generations | ❌ | ✅ (Owner) | ✅ | RLS check (`instructor_id = auth.uid()`) |
| Publish / Unpublish Course | ❌ | ✅ (Owner) | ✅ | Server validation function |
| Suspend User / Course | ❌ | ❌ | ✅ | RLS admin role check (`profiles.role = 'admin'`) |
| View Platform Analytics | ❌ | ❌ | ✅ | Service role / Admin RLS policy |

---

## 4. Course Hierarchy & Content Model

Courses are strictly hierarchical but content within lessons is flexible and block-based.

```mermaid
graph TD
    Course[Course] --> Module1[Module 1]
    Course --> Module2[Module 2]
    Course --> ModuleN[Module N...]
    
    Module1 --> Lesson1[Lesson 1]
    Module1 --> Lesson2[Lesson 2]
    Module1 --> SurpriseQuiz[Surprise Quiz (Optional Checkpoint)]
    Module1 --> ModuleQuiz[Module Quiz]
    
    Lesson1 --> Block1[Content Block: Text]
    Lesson1 --> Block2[Content Block: Video / YouTube]
    Lesson1 --> Block3[Content Block: PDF / Image]
    Lesson1 --> Block4[Content Block: Interactive Code / Embed]
    
    ModuleN --> FinalAssessment[Final Assessment]
    FinalAssessment --> Certificate[Verified Certificate]
```

### Flexible Content Blocks (`lesson_content_blocks`)
Instructors can build custom lesson layouts by stacking content blocks in arbitrary sequence:
- **`TEXT`**: Rich markdown text with latex math support.
- **`VIDEO`**: Direct upload MP4/WebM hosted on Supabase Storage.
- **`YOUTUBE`**: Embedded YouTube video URL.
- **`PDF`**: Interactive PDF viewer component.
- **`IMAGE`**: High-resolution image asset with caption.
- **`QUIZ`**: In-line single checkpoint question.
- **`EMBED`**: Sandboxed iframe embedding external tools (e.g. CodeSandbox, Figma).
- **`CODE`**: Syntax-highlighted code block with execution runner.

---

## 5. Core Business Rules

### 5.1 Learning Progression & Anti-Bypass Rules
1. **Video Watch Enforcement**: If a video block requires 90% completion, the player reports periodic heartbeat intervals. Server RPC updates `progress.video_watch_percent`. The lesson cannot complete until the threshold is met.
2. **Sequential Module Unlocking**: If configured by the instructor, Module \(N+1\) remains locked until Module \(N\)'s required lessons and Module Quiz are passed.
3. **Surprise Quiz Randomization**: Surprise quizzes select \(K\) random questions from a pool of \(M\) questions assigned to the module. Questions are selected dynamically per attempt via server RPC; correct answers are never returned to the browser in attempt payloads.
4. **Final Assessment Coverage**: Final assessments distribute questions across all modules according to configured weighting rules (e.g., equal representation across 5 modules).

### 5.2 Certificate Eligibility Criteria
A student becomes eligible for a certificate **only** when all of the following server-side checks pass:
1. `enrollments.status = 'active'`
2. 100% of required non-optional lessons are completed (`progress.is_completed = true`).
3. Required module quizzes are passed (`quiz_attempts.is_passed = true`).
4. Final assessment passed with score \(\ge\) `final_assessments.passing_score_percent`.
Upon eligibility verification, the server generates a cryptographically signed certificate with a unique UUID, hash, and QR code verification link.

---

## 6. Implementation Roadmap

- **Phase 1: Foundation & Infrastructure**: Monorepo configuration, Supabase setup, migrations, RLS policies, Auth & Profiles.
- **Phase 2: Course Management Engine**: Course/Module/Lesson CRUD, block builder, draft/publish workflow.
- **Phase 3: Student Learning & Progression**: Catalog search, enrollment, video player heartbeat, progress tracking, lesson completion logic.
- **Phase 4: Assessment System**: Question bank management, module quizzes, surprise quiz randomizer, final assessment, attempt scoring RPC.
- **Phase 5: Certificate Engine**: Eligibility checker, PDF rendering Edge function, public QR code verification page.
- **Phase 6: AI Course Builder**: Document parser, chunking, LLM multimodal course & quiz generation pipeline, instructor review UI.
- **Phase 7: Multilingual Infrastructure**: Localization tables (`*_translations`), fallback strategy, technical term preservation.
- **Phase 8: Commerce & Access**: Checkout flow, payment webhooks, subscription & one-time purchase verification.
- **Phase 9: Admin Operations**: User management, course moderation dashboard, system analytics.
- **Phase 10: Mobile App (Expo)**: React Native mobile client for student learning, video playback, and quiz taking.
- **Phase 11: Production Hardening**: Security audit, load testing, performance tuning, CI/CD pipeline setup.
