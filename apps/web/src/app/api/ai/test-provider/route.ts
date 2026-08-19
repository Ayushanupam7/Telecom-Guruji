import { NextRequest, NextResponse } from 'next/server';
import { testProviderConnection } from '@/lib/ai/aiService';
import { AIProviderType } from '@signalhub/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiKey, model } = body as {
      provider: AIProviderType;
      apiKey?: string;
      model?: string;
    };

    if (!provider || (provider !== 'groq' && provider !== 'gemini')) {
      return NextResponse.json({ success: false, message: 'Invalid provider specified' }, { status: 400 });
    }

    const result = await testProviderConnection(provider, apiKey, model);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Internal connection testing error' },
      { status: 500 }
    );
  }
}
