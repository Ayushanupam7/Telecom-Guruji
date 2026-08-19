import { NextRequest, NextResponse } from 'next/server';
import { executeAIWithFallback } from '@/lib/ai/aiService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileContent, fileType } = body as {
      fileName: string;
      fileContent: string;
      fileType?: string;
    };

    if (!fileContent && !fileName) {
      return NextResponse.json({ success: false, error: 'No file content provided' }, { status: 400 });
    }

    const systemPrompt = `You are a Document Analysis & Curriculum Extractor for "Telecom Guruji".
Analyze the raw text extracted from an educational document (${fileName || 'document'}) and extract a structured course overview with modules and slides.

JSON Schema:
{
  "suggestedTitle": "Course Title derived from document",
  "summary": "2-3 sentence overview",
  "category": "Telecommunications",
  "level": "beginner | intermediate | advanced",
  "estimatedDurationMinutes": 60,
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"],
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "slides": [
        {
          "title": "Slide Title",
          "content": "Key slide content bullets and summary",
          "blocks": [
            {
              "type": "heading",
              "content": { "text": "Slide Heading", "level": 2 }
            },
            {
              "type": "paragraph",
              "content": { "text": "Explanation derived from source text..." }
            },
            {
              "type": "bullet_list",
              "content": { "items": ["Extracted Point 1", "Extracted Point 2"] }
            }
          ]
        }
      ],
      "sampleQuizQuestion": {
        "question": "Question testing document concept",
        "options": ["Option A (Correct)", "Option B", "Option C"],
        "correctAnswer": 0,
        "explanation": "Why Option A is correct"
      }
    }
  ]
}

Return ONLY valid JSON.`;

    const prompt = `Document Name: ${fileName}
FileType: ${fileType || 'Text'}
Extracted Document Text Content:
${fileContent.slice(0, 10000)}

Please extract and structure this material into a cohesive multi-module course curriculum.`;

    const aiResult = await executeAIWithFallback(prompt, systemPrompt, { asJSON: true });

    return NextResponse.json({
      success: true,
      data: aiResult.data,
      providerUsed: aiResult.providerUsed,
      fallbackUsed: aiResult.fallbackUsed,
      model: aiResult.model,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
