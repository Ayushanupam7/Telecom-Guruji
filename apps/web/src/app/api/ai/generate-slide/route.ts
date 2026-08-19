import { NextRequest, NextResponse } from 'next/server';
import { executeAIWithFallback } from '@/lib/ai/aiService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseTitle, moduleTitle, slideTitle, prompt: userPrompt } = body;

    const systemPrompt = `You are an EdTech instructional designer for "Telecom Guruji".
Given a slide topic and course context, generate rich slide content blocks in strict JSON format.

JSON Schema:
{
  "slideTitle": "String",
  "notes": "Instructor presentation notes and speaking points",
  "blocks": [
    {
      "id": "b-1",
      "type": "heading",
      "content": { "text": "Heading text", "level": 2 }
    },
    {
      "id": "b-2",
      "type": "paragraph",
      "content": { "text": "Detailed explanation..." }
    },
    {
      "id": "b-3",
      "type": "bullet_list",
      "content": { "items": ["Item 1", "Item 2", "Item 3"] }
    },
    {
      "id": "b-4",
      "type": "code",
      "content": { "code": "// example snippet or AT commands / CLI configuration", "language": "bash" }
    },
    {
      "id": "b-5",
      "type": "quote",
      "content": { "text": "Key takeaway formula or rule", "author": "3GPP Specification" }
    }
  ]
}

Supported block types: heading, paragraph, bullet_list, table, image, code, quote, chart, divider.
Return ONLY valid JSON.`;

    const prompt = `Course: ${courseTitle || 'Telecom Engineering'}
Module: ${moduleTitle || 'Core Concepts'}
Slide Title: ${slideTitle || 'Introduction'}
Instructor Request: ${userPrompt || 'Generate professional slide content with diagrams/lists/examples.'}`;

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
