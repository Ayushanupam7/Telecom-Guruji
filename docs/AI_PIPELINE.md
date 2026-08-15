# SignalHub — AI Pipeline & Multimodal Course Builder Specification

**Engine:** Multimodal LLM Engine (Gemini 1.5 Flash / Pro)  
**Input Formats Supported:** PDF, PPT, PPTX, DOC, DOCX  

---

## 1. End-to-End Pipeline Architecture

```
[Uploaded Document] (PDF/PPT/PPTX/DOC/DOCX)
       │
       ▼
[File Validation & Storage] ➔ Saved to `course-assets` bucket
       │
       ▼
[Document Parser Worker]
       ├── PDF: pdf-parse + pdf-image extraction
       ├── PPTX: office-document-stream parser
       └── DOCX: mammoth / docx extractor
       │
       ▼
[Page / Slide Chunking Engine] ➔ Writes `source_asset_pages`
       │
       ▼
[Multimodal LLM Structuring Engine]
       ├── System Prompt (JSON Schema Contract)
       ├── Topic Detection & Hierarchy Extraction
       ├── Module & Lesson Content Generation
       └── Grounded Question Bank Generation
       │
       ▼
[Translation & Localization Pipeline] (en, hi, mr)
       ├── Glossary Rule: Preserve Technical Terms (TCP/IP, React, API, etc.)
       └── Writes `*_translations`
       │
       ▼
[Draft State Insertion] ➔ `courses.is_published = false`
       │
       ▼
[Instructor Human-in-the-Loop Review Dashboard]
       ├── Edit / Reorder Modules
       ├── Modify / Regenerate Lessons
       ├── Grounding Trace Verification (Source Page Link)
       └── Final Instructor Publish Trigger
```

---

## 2. Document Extraction & Source Grounding

Every page or slide is extracted with structural metadata:
- `page_number` / `slide_number`
- `heading_hierarchy`
- `extracted_text`
- `extracted_images` (image storage URL)
- `tables_as_markdown`

### Source Traceability Schema
When an AI lesson or quiz question is created, a reference link is stored in `lesson_sources`:

```json
{
  "source_asset_id": "c1f7a14e-4b2a-4f51-b841-3990886561f9",
  "page_number": 24,
  "slide_number": null,
  "excerpt": "The OSI model consists of seven layers: Physical, Data Link, Network, Transport, Session, Presentation, Application."
}
```

Instructors can click "Verify Source" in the course editor to highlight the exact original PDF page or PPT slide used to construct the lesson or quiz item.

---

## 3. Structured Output Contracts

The LLM is invoked using strict JSON Schema enforcement.

### Course Structuring JSON Schema
```json
{
  "courseTitle": "Computer Networks & Architecture",
  "summary": "Comprehensive guide to networking protocols and TCP/IP stack.",
  "category": "Computer Science",
  "level": "intermediate",
  "modules": [
    {
      "title": "Introduction to Networking",
      "description": "Foundational network concepts and topologies.",
      "sequenceOrder": 1,
      "lessons": [
        {
          "title": "Network Topologies and Standards",
          "sequenceOrder": 1,
          "contentBlocks": [
            {
              "blockType": "TEXT",
              "contentPayload": {
                "markdown": "# Network Topologies\n\nA network topology defines how devices are connected..."
              }
            },
            {
              "blockType": "IMAGE",
              "contentPayload": {
                "url": "https://storage.signalhub.app/assets/source_img_12.png",
                "caption": "Figure 1: Star vs Mesh Topology"
              }
            }
          ]
        }
      ],
      "questionBank": [
        {
          "questionText": "Which topology connects all devices to a central hub?",
          "questionType": "single_choice",
          "difficulty": "easy",
          "topic": "Topologies",
          "explanation": "In a star topology, all devices connect directly to a central device such as a switch or hub.",
          "options": [
            { "text": "Star Topology", "isCorrect": true },
            { "text": "Mesh Topology", "isCorrect": false },
            { "text": "Ring Topology", "isCorrect": false }
          ]
        }
      ]
    }
  ]
}
```

---

## 4. Technical Term Preservation Rules (Multilingual Engine)

When translating generated courses from English (`en`) to Hindi (`hi`), Marathi (`mr`), or future languages, the translation prompt injects a **Technical Term Protection Glossary**.

### Protected Glossary Example Rules:
- Protocols & Tech Stack: `TCP/IP`, `HTTP`, `HTTPS`, `DNS`, `IP Address`, `React`, `Next.js`, `Supabase`, `PostgreSQL`, `API`, `RAM`, `CPU`.
- Syntax & Code: Any inline code or code blocks (```...```) MUST remain untranslated.
- Acronyms: Keep acronyms in standard Latin script or transliterated in parentheses (e.g. "TCP/IP (टीसीपी/आईपी)").

---

## 5. Human-in-the-Loop Review Safety Mandate

AI **NEVER** automatically publishes a course.
1. Draft courses created by AI are saved with `is_published = false`.
2. The instructor receives a notifications banner: `"AI Course Generation Complete. Ready for Review."`
3. The instructor opens the Course Editor UI where they can:
   - Reorder or delete modules.
   - Edit lesson markdown blocks.
   - Adjust passing score thresholds.
   - Modify quiz questions or options.
   - Click **"Publish Course"** to make it accessible to students.
