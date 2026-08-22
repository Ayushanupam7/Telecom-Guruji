import { NextRequest, NextResponse } from 'next/server';
import { executeAIWithFallback } from '@/lib/ai/aiService';
import { GurujiSlideContext } from '@signalhub/types';

export const dynamic = 'force-dynamic';

interface GurujiRequestBody {
  action: 'explain_slide' | 'scan_course' | 'ask_question';
  language?: string;
  isFirstTime?: boolean;
  slideContext?: GurujiSlideContext;
  courseData?: any;
  question?: string;
  conversationHistory?: Array<{ role: 'student' | 'guruji'; content: string }>;
  contextMode?: 'slide' | 'module' | 'course';
  courseKnowledge?: any;
}

const GURUJI_SYSTEM_PROMPT = `
You are GURUJI (गुरुजी), the flagship AI Teacher, Academic Mentor, and Telecom & Computer Science Architect for Telecom Guruji (an elite EdTech and LMS platform).

Your Persona & Tone:
- Friendly, encouraging, patient, authoritative yet deeply accessible.
- An experienced Indian engineering professor & industry veteran.
- You never just dryly recite slide text; you TEACH and demystify the concepts using vivid analogies, practical industry relevance, and memorable takeaways.
- When language is Hinglish, write in natural Romanized Hindi-English (Latin script) as spoken in top Indian tech classrooms (e.g. "Namaste! Main hoon Guruji. Aaj hum is slide ke core concept ko deeply aur simple language mein samjhenge...").
- When language is Hindi, write in polite, standard Devanagari Hindi (e.g. "नमस्ते! मैं आपका गुरुजी हूँ...").
- When language is English, write in warm, clear, professional global English.
`;

export async function POST(req: NextRequest) {
  try {
    const body: GurujiRequestBody = await req.json();
    const {
      action = 'explain_slide',
      language = 'en',
      isFirstTime = true,
      slideContext,
      courseData,
      question,
      conversationHistory = [],
      contextMode = 'slide',
      courseKnowledge,
    } = body;

    // 1. ACTION: EXPLAIN CURRENT SLIDE
    if (action === 'explain_slide') {
      if (!slideContext) {
        return NextResponse.json({ success: false, error: 'Slide context is required' }, { status: 400 });
      }

      const langInstruction =
        language === 'hinglish'
          ? 'Deliver the explanation in friendly, professional HINGLISH (Latin alphabet). Use natural conversational Hindi-English blend.'
          : language === 'hi'
          ? 'Deliver the explanation in clear, polite HINDI (Devanagari script).'
          : language === 'ta'
          ? 'Deliver the explanation in clear, engaging TAMIL (தமிழ் script).'
          : language === 'te'
          ? 'Deliver the explanation in clear, engaging TELUGU (తెలుగు script).'
          : language === 'kn'
          ? 'Deliver the explanation in clear, engaging KANNADA (ಕನ್ನಡ script).'
          : language === 'ml'
          ? 'Deliver the explanation in clear, engaging MALAYALAM (മലയാളം script).'
          : language === 'bn'
          ? 'Deliver the explanation in clear, engaging BENGALI (বাংলা script).'
          : language === 'mr'
          ? 'Deliver the explanation in clear, engaging MARATHI (मराठी script).'
          : language === 'gu'
          ? 'Deliver the explanation in clear, engaging GUJARATI (ગુજરાતી script).'
          : 'Deliver the explanation in clear, natural, engaging ENGLISH.';

      const introInstruction = isFirstTime
        ? language === 'hinglish'
          ? 'Start with a brief warm opening like: "Namaste! Main hoon Guruji. Chaliye is slide ko simple aur interesting tarike se samajhte hain."'
          : language === 'hi'
          ? 'Start with a brief warm opening like: "नमस्ते! मैं गुरुजी हूँ। चलिए इस स्लाइड को आसानी से समझते हैं।"'
          : language === 'ta'
          ? 'Start with a brief warm opening like: "வணக்கம்! நான் குருஜி. இந்த ஸ்லைடை எளிதாகப் புரிந்து கொள்வோம்."'
          : language === 'te'
          ? 'Start with a brief warm opening like: "నమస్కారం! నేను గురూజీ. ఈ స్లైడ్ గురించి సులభంగా తెలుసుకుందాం."'
          : language === 'kn'
          ? 'Start with a brief warm opening like: "ನಮಸ್ಕಾರ! ನಾನು ಗುರೂಜಿ. ಈ ಸ್ಲೈಡ್ ಅನ್ನು ಸುಲಭವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ."'
          : language === 'ml'
          ? 'Start with a brief warm opening like: "നമസ്കാരം! ഞാൻ ഗുരുജി. നമുക്ക് ഈ സ്ലൈഡ് എളുപ്പത്തിൽ പഠിക്കാം."'
          : language === 'bn'
          ? 'Start with a brief warm opening like: "নমস্কার! আমি গুরুজি। আসুন এই স্লাইডটি সহজে বুঝে নিই।"'
          : language === 'mr'
          ? 'Start with a brief warm opening like: "नमस्ते! मी गुरुजी. चला ही स्लाईड सोप्या भाषेत समजून घेऊया."'
          : language === 'gu'
          ? 'Start with a brief warm opening like: "નમસ્તે! હું ગુરુજી છું. ચાલો આ સ્લાઇડને સરળતાથી સમજીએ."'
          : 'Start with a brief warm opening like: "Namaste! I\'m Guruji. Let me explain this slide for you."'
        : 'Do NOT re-introduce yourself. Start directly explaining the slide concepts smoothly.';

      const prompt = `
Explain this course slide to a student who is learning:

[COURSE CONTEXT]
Course Title: ${slideContext.courseTitle}
Module: ${slideContext.moduleTitle}
Slide Number: ${slideContext.slideNumber}
Slide Title: ${slideContext.slideTitle}
Content Type: ${slideContext.contentType}

[SLIDE CONTENT]
${slideContext.bodyMarkdown || ''}
${slideContext.blocksText ? `Blocks: ${slideContext.blocksText}` : ''}
${slideContext.codeSnippet ? `Code Snippet:\n${slideContext.codeSnippet}` : ''}
${slideContext.tablesSummary ? `Data Table: ${slideContext.tablesSummary}` : ''}
${slideContext.notes ? `Instructor Notes: ${slideContext.notes}` : ''}

[LANGUAGE & STYLE INSTRUCTIONS]
${langInstruction}
${introInstruction}

Teach this concept step by step:
1. Explain WHAT this concept is and WHY it matters.
2. Provide a practical, real-world scenario or analogy.
3. Highlight 1 key exam / interview takeaway.

Return a JSON object strictly conforming to this schema:
{
  "speechText": "The complete conversational speech script that Guruji will speak out loud with natural phrasing. Keep it between 80 to 180 words, engaging and punchy.",
  "bulletPoints": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3"
  ],
  "practicalExample": "Short 1-2 sentence real-world telecom/cloud example",
  "examTip": "Short practical tip for interviews or exams"
}
`;

      const aiResponse = await executeAIWithFallback<any>(prompt, GURUJI_SYSTEM_PROMPT, { asJSON: true });

      if (aiResponse.success && aiResponse.data) {
        return NextResponse.json({
          success: true,
          data: aiResponse.data,
          providerUsed: aiResponse.providerUsed,
          model: aiResponse.model,
          fallbackUsed: aiResponse.fallbackUsed,
        });
      } else {
        // Fallback structured response if AI returns raw text
        return NextResponse.json({
          success: true,
          data: {
            speechText:
              typeof aiResponse.data === 'string'
                ? aiResponse.data
                : `Namaste! In this slide on ${slideContext.slideTitle}, we focus on fundamental principles of ${slideContext.courseTitle}. Notice how each layer communicates efficiently to ensure maximum reliability and performance.`,
            bulletPoints: [
              `Core topic: ${slideContext.slideTitle}`,
              `Module: ${slideContext.moduleTitle}`,
              `Ensure you understand the architectural trade-offs.`,
            ],
            practicalExample: `Standard production deployment in modern high-availability networks.`,
            examTip: `Remember the key definitions and state transitions for assessments.`,
          },
          providerUsed: aiResponse.providerUsed,
          model: aiResponse.model,
          fallbackUsed: aiResponse.fallbackUsed,
        });
      }
    }

    // 2. ACTION: SCAN FULL COURSE
    if (action === 'scan_course') {
      if (!courseData) {
        return NextResponse.json({ success: false, error: 'Course data is required for full course scan' }, { status: 400 });
      }

      const modulesSummary = (courseData.modules || [])
        .map(
          (m: any, idx: number) =>
            `Module ${idx + 1}: ${m.title} (${(m.slides || m.slides_data || []).length} slides, Quiz: ${m.has_quiz ? 'Yes' : 'No'})`
        )
        .join('\n');

      const prompt = `
Analyze and index this entire course structure for student learning:

Course Title: ${courseData.title}
Summary: ${courseData.summary || courseData.description}
Category: ${courseData.category}
Level: ${courseData.level}

Modules Breakdown:
${modulesSummary}

Language: ${language}

Generate a comprehensive knowledge index of this course. Return a JSON object strictly conforming to this schema:
{
  "courseExecutiveSummary": "Compelling 2-3 sentence overview of what the student will achieve by finishing this course.",
  "moduleHighlights": [
    {
      "moduleIndex": 1,
      "title": "Module Title",
      "coreConcept": "Core takeaway of this module in 1 sentence"
    }
  ],
  "keyArchitecturalTopics": [
    "Topic 1",
    "Topic 2",
    "Topic 3",
    "Topic 4",
    "Topic 5"
  ],
  "recommendedStudyPace": "e.g. 2 modules per week with practical exercises",
  "suggestedQuestions": [
    "What is the most important concept in Module 1?",
    "How does this course prepare me for telecom architecture interviews?",
    "Can you summarize all protocols covered in this masterclass?"
  ]
}
`;

      const aiResponse = await executeAIWithFallback<any>(prompt, GURUJI_SYSTEM_PROMPT, { asJSON: true });

      return NextResponse.json({
        success: true,
        data: aiResponse.data,
        providerUsed: aiResponse.providerUsed,
        model: aiResponse.model,
        fallbackUsed: aiResponse.fallbackUsed,
      });
    }

    // 3. ACTION: ASK GURUJI (Q&A)
    if (action === 'ask_question') {
      if (!question || !question.trim()) {
        return NextResponse.json({ success: false, error: 'Question is required' }, { status: 400 });
      }

      const langInstruction =
        language === 'hinglish'
          ? 'Answer in warm, clear HINGLISH (Latin script Romanized Hindi-English).'
          : language === 'hi'
          ? 'Answer in polite, standard HINDI (Devanagari script).'
          : language === 'ta'
          ? 'Answer in clear, engaging TAMIL (தமிழ் script).'
          : language === 'te'
          ? 'Answer in clear, engaging TELUGU (తెలుగు script).'
          : language === 'kn'
          ? 'Answer in clear, engaging KANNADA (ಕನ್ನಡ script).'
          : language === 'ml'
          ? 'Answer in clear, engaging MALAYALAM (മലയാളം script).'
          : language === 'bn'
          ? 'Answer in clear, engaging BENGALI (বাংলা script).'
          : language === 'mr'
          ? 'Answer in clear, engaging MARATHI (मराठी script).'
          : language === 'gu'
          ? 'Answer in clear, engaging GUJARATI (ગુજરાતી script).'
          : 'Answer in clear, engaging, conversational ENGLISH.';

      const conversationContext = conversationHistory
        .slice(-4)
        .map((msg) => `${msg.role === 'student' ? 'Student' : 'Guruji'}: ${msg.content}`)
        .join('\n');

      const slideContextBlock = slideContext
        ? `
Current Slide Context:
- Course: ${slideContext.courseTitle}
- Module: ${slideContext.moduleTitle}
- Slide ${slideContext.slideNumber}: ${slideContext.slideTitle}
- Text/Content: ${slideContext.bodyMarkdown || slideContext.blocksText || ''}
${slideContext.codeSnippet ? `- Code: ${slideContext.codeSnippet}` : ''}
`
        : '';

      const courseKnowledgeBlock = courseKnowledge
        ? `Course Knowledge Summary: ${JSON.stringify(courseKnowledge).slice(0, 1500)}`
        : '';

      const prompt = `
Student asked a question while studying in Telecom Guruji.

Context Mode: ${contextMode}
${slideContextBlock}
${courseKnowledgeBlock}

Recent Conversation:
${conversationContext}

Student's Question: "${question}"

Language Instruction:
${langInstruction}

Answer rules:
- Speak as Guruji directly to the student.
- Keep the answer concise (2-4 short paragraphs, 70-160 words max).
- If the question is about the current slide or diagram, reference it specifically.
- Provide a helpful example where appropriate.
- Return JSON strictly:
{
  "answerText": "Your full response formatted for TTS and reading.",
  "keyTakeaway": "1 short summary takeaway sentence",
  "followUpSuggestions": [
    "Follow-up question 1",
    "Follow-up question 2"
  ]
}
`;

      const aiResponse = await executeAIWithFallback<any>(prompt, GURUJI_SYSTEM_PROMPT, { asJSON: true });

      return NextResponse.json({
        success: true,
        data: aiResponse.data,
        providerUsed: aiResponse.providerUsed,
        model: aiResponse.model,
        fallbackUsed: aiResponse.fallbackUsed,
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('Error in Guruji AI API route:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal server error while processing Guruji request',
      },
      { status: 500 }
    );
  }
}
