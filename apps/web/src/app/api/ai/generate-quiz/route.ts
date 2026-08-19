import { NextRequest, NextResponse } from 'next/server';
import { executeAIWithFallback } from '@/lib/ai/aiService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseTitle, moduleTitle, count = 3, difficulty = 'medium', slideContext = '' } = body;

    const systemPrompt = `You are a Telecom Examination Specialist for "Telecom Guruji".
Generate high-quality multiple choice assessment questions with explanations.

JSON Schema:
{
  "title": "String (Quiz Title)",
  "passing_score_percent": 80,
  "questions": [
    {
      "id": "q-1",
      "question_text": "Clear engineering question?",
      "question_type": "single_choice",
      "difficulty": "easy | medium | hard",
      "explanation": "Clear explanation of why the correct option is right.",
      "options": [
        { "id": "opt-1", "option_text": "Correct Option", "is_correct": true, "sequence_order": 1 },
        { "id": "opt-2", "option_text": "Distractor 1", "is_correct": false, "sequence_order": 2 },
        { "id": "opt-3", "option_text": "Distractor 2", "is_correct": false, "sequence_order": 3 },
        { "id": "opt-4", "option_text": "Distractor 3", "is_correct": false, "sequence_order": 4 }
      ]
    }
  ]
}

Return ONLY valid JSON.`;

    const prompt = `Generate ${count} ${difficulty}-level questions for:
Course: ${courseTitle || 'Telecom Engineering'}
Module: ${moduleTitle || 'General Assessment'}
Context/Slide Notes: ${slideContext || 'Cover core concepts and practical real-world scenarios.'}`;

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
