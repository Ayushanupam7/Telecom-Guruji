import { NextRequest, NextResponse } from 'next/server';
import { executeAIWithFallback } from '@/lib/ai/aiService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic = '5G Mobile Networks Architecture',
      description = '',
      category = 'Telecommunications',
      level = 'intermediate',
      modulesCount = 5,
      language = 'en',
      creationMethod = 'manual_ai',
      uploadedContent = '',
    } = body;

    const systemPrompt = `You are a Senior Telecom Curriculum Architect and EdTech instructional designer for "Telecom Guruji".
Generate a comprehensive, production-quality course structure in strict JSON format.

The JSON structure must match this exact schema:
{
  "title": "String (engaging, professional course title)",
  "summary": "String (2-sentence overview)",
  "detailedDescription": "String (comprehensive multi-paragraph course description)",
  "category": "String",
  "level": "beginner | intermediate | advanced",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "courseDurationMinutes": 90,
  "learningOutcomes": [
    "Outcome 1",
    "Outcome 2",
    "Outcome 3",
    "Outcome 4"
  ],
  "prerequisites": "String describing prerequisites",
  "targetAudience": "String describing target audience",
  "modules": [
    {
      "id": "mod-1",
      "title": "Module 1: Title",
      "description": "Module overview description",
      "sequence_order": 1,
      "duration_minutes": 20,
      "learning_outcomes": ["Module outcome 1", "Module outcome 2"],
      "has_quiz": true,
      "slides": [
        {
          "id": "s1-1",
          "slide_number": 1,
          "title": "Slide 1: Title",
          "content_type": "block_based",
          "notes": "Instructor teaching note",
          "blocks": [
            {
              "id": "b1",
              "type": "heading",
              "content": { "text": "Section Heading", "level": 2 }
            },
            {
              "id": "b2",
              "type": "paragraph",
              "content": { "text": "Clear conceptual explanation..." }
            },
            {
              "id": "b3",
              "type": "bullet_list",
              "content": { "items": ["Key point 1", "Key point 2", "Key point 3"] }
            }
          ]
        }
      ],
      "quiz": {
        "title": "Module 1 Assessment Quiz",
        "passing_score_percent": 80,
        "questions": [
          {
            "id": "q1",
            "question_text": "Clear technical question?",
            "question_type": "single_choice",
            "difficulty": "medium",
            "explanation": "Detailed explanation of why this answer is correct.",
            "options": [
              { "id": "o1", "option_text": "Correct Option", "is_correct": true, "sequence_order": 1 },
              { "id": "o2", "option_text": "Distractor Option 1", "is_correct": false, "sequence_order": 2 },
              { "id": "o3", "option_text": "Distractor Option 2", "is_correct": false, "sequence_order": 3 }
            ]
          }
        ]
      }
    }
  ],
  "finalAssessment": {
    "title": "Final Certification Exam",
    "description": "Comprehensive evaluation covering all course modules.",
    "passing_score_percent": 80,
    "time_limit_minutes": 30,
    "questions": [
      {
        "id": "fq1",
        "question_text": "Comprehensive telecom question?",
        "question_type": "single_choice",
        "difficulty": "medium",
        "explanation": "Why this answer is correct",
        "options": [
          { "id": "fo1", "option_text": "Correct Option", "is_correct": true, "sequence_order": 1 },
          { "id": "fo2", "option_text": "Distractor Option", "is_correct": false, "sequence_order": 2 }
        ]
      }
    ]
  }
}`;

    const prompt = `Please generate a ${modulesCount}-module course on the topic: "${topic}".
Additional instructor notes/description: "${description || 'None'}"
Category: ${category}
Target Level: ${level}
Language: ${language}
Creation Method: ${creationMethod}
${uploadedContent ? `\nSOURCE MATERIAL / EXTRACTED DOCUMENT TEXT:\n${uploadedContent.slice(0, 8000)}\n` : ''}

Generate high-quality telecom engineering content with realistic diagrams/charts/bullet points and 2-3 slides per module plus quizzes. Return ONLY valid JSON.`;

    const aiResult = await executeAIWithFallback(prompt, systemPrompt, { asJSON: true });

    let courseData = aiResult.data as any;

    // Multi-Language Translation Generation for AI generated course
    if (courseData && typeof courseData === 'object' && courseData.title) {
      try {
        const TARGET_LANGS = ['hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'hinglish'] as const;

        const quickTranslate = async (txt: string, l: string) => {
          if (!txt || !txt.trim()) return txt;
          const targetLang = l === 'hinglish' ? 'hi' : l;
          try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
              txt
            )}`;
            const res = await fetch(url, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            });
            if (res.ok) {
              const d = await res.json();
              if (Array.isArray(d) && Array.isArray(d[0])) {
                return d[0].map((item: any) => (item && item[0] ? item[0] : '')).join('');
              }
            }
          } catch (e) {}
          return txt;
        };

        // 1. Course level translations
        const cTranslations: Record<string, any> = courseData.translations || {};
        for (const l of TARGET_LANGS) {
          if (!cTranslations[l]) cTranslations[l] = {};
          cTranslations[l].title = await quickTranslate(courseData.title, l);
          if (courseData.summary) {
            cTranslations[l].summary = await quickTranslate(courseData.summary, l);
          }
        }
        courseData.translations = cTranslations;

        // 2. Module & Slide translations
        if (Array.isArray(courseData.modules)) {
          for (const m of courseData.modules) {
            const mTranslations: Record<string, any> = m.translations || {};
            for (const l of TARGET_LANGS) {
              if (!mTranslations[l]) mTranslations[l] = {};
              mTranslations[l].title = await quickTranslate(m.title, l);
              if (m.description) {
                mTranslations[l].description = await quickTranslate(m.description, l);
              }
            }
            m.translations = mTranslations;

            if (Array.isArray(m.slides)) {
              for (const s of m.slides) {
                const sTranslations: Record<string, any> = s.translations || {};
                for (const l of TARGET_LANGS) {
                  if (!sTranslations[l]) sTranslations[l] = {};
                  sTranslations[l].title = await quickTranslate(s.title, l);
                }
                s.translations = sTranslations;
              }
            }
          }
        }
      } catch (transErr) {
        console.warn('Auto-generating course multi-language bundle notice:', transErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: courseData,
      providerUsed: aiResult.providerUsed,
      fallbackUsed: aiResult.fallbackUsed,
      model: aiResult.model,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
