import { NextRequest, NextResponse } from 'next/server';
import { getEffectiveAISettings } from '@/lib/ai/aiService';
import { supabaseAdmin } from '@/lib/supabase';
import { AIProviderType } from '@signalhub/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId') || 'global';
    const settings = await getEffectiveAISettings(userId);

    // Return masked settings to frontend for security
    return NextResponse.json({
      success: true,
      data: {
        groq: {
          provider: settings.groqConfig.provider,
          maskedKey: settings.groqConfig.masked_key,
          model: settings.groqConfig.model,
          isEnabled: settings.groqConfig.is_enabled,
          isPrimary: settings.groqConfig.is_primary,
          status: settings.groqConfig.status,
        },
        gemini: {
          provider: settings.geminiConfig.provider,
          maskedKey: settings.geminiConfig.masked_key,
          model: settings.geminiConfig.model,
          isEnabled: settings.geminiConfig.is_enabled,
          isPrimary: settings.geminiConfig.is_primary,
          status: settings.geminiConfig.status,
        },
        strategy: settings.strategy,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = 'global', groq, gemini, strategy } = body;

    // 1. Save or update Groq settings
    if (groq) {
      const updateData: any = {
        user_id: userId,
        provider: 'groq',
        model: groq.model && groq.model !== 'llama-3.3-70b-versatile' ? groq.model : 'openai/gpt-oss-120b',
        is_enabled: groq.isEnabled ?? true,
        is_primary: strategy?.primaryProvider === 'groq',
        updated_at: new Date().toISOString(),
      };
      if (groq.apiKey && groq.apiKey.trim() && !groq.apiKey.includes('••••')) {
        updateData.api_key = groq.apiKey.trim();
      }

      await supabaseAdmin
        .from('ai_provider_settings')
        .upsert(updateData, { onConflict: 'user_id,provider' });
    }

    // 2. Save or update Gemini settings
    if (gemini) {
      const updateData: any = {
        user_id: userId,
        provider: 'gemini',
        model: gemini.model || 'gemini-1.5-flash',
        is_enabled: gemini.isEnabled ?? true,
        is_primary: strategy?.primaryProvider === 'gemini',
        updated_at: new Date().toISOString(),
      };
      if (gemini.apiKey && gemini.apiKey.trim() && !gemini.apiKey.includes('••••')) {
        updateData.api_key = gemini.apiKey.trim();
      }

      await supabaseAdmin
        .from('ai_provider_settings')
        .upsert(updateData, { onConflict: 'user_id,provider' });
    }

    const updated = await getEffectiveAISettings(userId);

    return NextResponse.json({
      success: true,
      message: 'AI Provider settings saved successfully!',
      data: {
        groq: {
          provider: updated.groqConfig.provider,
          maskedKey: updated.groqConfig.masked_key,
          model: updated.groqConfig.model,
          isEnabled: updated.groqConfig.is_enabled,
          isPrimary: updated.groqConfig.is_primary,
          status: updated.groqConfig.status,
        },
        gemini: {
          provider: updated.geminiConfig.provider,
          maskedKey: updated.geminiConfig.masked_key,
          model: updated.geminiConfig.model,
          isEnabled: updated.geminiConfig.is_enabled,
          isPrimary: updated.geminiConfig.is_primary,
          status: updated.geminiConfig.status,
        },
        strategy: updated.strategy,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
