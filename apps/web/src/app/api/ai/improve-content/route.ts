import { NextRequest, NextResponse } from 'next/server';
import { executeAIWithFallback } from '@/lib/ai/aiService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, content, instruction, targetLanguage } = body as {
      action: 'improve' | 'simplify' | 'expand' | 'summarize' | 'translate' | 'generate_example' | 'custom';
      content: string;
      instruction?: string;
      targetLanguage?: string;
    };

    if (!content) {
      return NextResponse.json({ success: false, error: 'No content provided' }, { status: 400 });
    }

    let systemPrompt = 'You are an expert Telecom educator and technical copywriter for "Telecom Guruji".';
    let prompt = '';

    switch (action) {
      case 'improve':
        prompt = `Please rewrite and improve the following educational content to make it clearer, more engaging, and technically precise:\n\n"${content}"`;
        break;
      case 'simplify':
        prompt = `Please simplify the following technical content so that beginners can easily understand it without losing accuracy:\n\n"${content}"`;
        break;
      case 'expand':
        prompt = `Please expand the following content with additional technical depth, real-world telecommunication examples, and key bullet points:\n\n"${content}"`;
        break;
      case 'summarize':
        prompt = `Please provide a concise 2-3 bullet point summary of the following content:\n\n"${content}"`;
        break;
      case 'translate':
        prompt = `Please translate the following educational content to ${targetLanguage || 'Hindi'} while preserving technical acronyms (like 5G, LTE, QAM, DSP, MIMO):\n\n"${content}"`;
        break;
      case 'generate_example':
        prompt = `Provide a real-world telecommunications engineering example, formula, or case study illustrating this concept:\n\n"${content}"`;
        break;
      default:
        prompt = `Instruction: ${instruction || 'Refine this content'}\n\nContent:\n"${content}"`;
        break;
    }

    const aiResult = await executeAIWithFallback(prompt, systemPrompt, { asJSON: false });

    return NextResponse.json({
      success: true,
      result: aiResult.data,
      providerUsed: aiResult.providerUsed,
      fallbackUsed: aiResult.fallbackUsed,
      model: aiResult.model,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
