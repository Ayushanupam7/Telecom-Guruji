import { NextRequest, NextResponse } from 'next/server';
import { executeAIWithFallback } from '@/lib/ai/aiService';

export const dynamic = 'force-dynamic';

// In-memory cache for fast translation retrieval
const translationCache = new Map<string, string>();

async function translateSingleText(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim() || targetLang === 'en') {
    return text;
  }

  const cacheKey = `${targetLang}:${text.trim()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Language mapping for Google Translate API
  const langMap: Record<string, string> = {
    hi: 'hi',
    ta: 'ta',
    te: 'te',
    kn: 'kn',
    ml: 'ml',
    bn: 'bn',
    mr: 'mr',
    gu: 'gu',
    hinglish: 'hi',
    en: 'en',
  };

  const tl = langMap[targetLang.toLowerCase()] || 'en';
  if (tl === 'en') return text;

  try {
    // 1. Primary: Fast Google Translate Neural API
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    const res = await fetch(gtxUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedResult = data[0]
          .map((item: any) => (item && item[0] ? item[0] : ''))
          .join('');

        if (translatedResult && translatedResult.trim()) {
          translationCache.set(cacheKey, translatedResult);
          return translatedResult;
        }
      }
    }
  } catch (gtxErr) {
    console.warn('GTX translation notice, trying AI fallback:', gtxErr);
  }

  // 2. Secondary: LLM Fallback
  try {
    const langNames: Record<string, string> = {
      hi: 'Hindi',
      ta: 'Tamil',
      te: 'Telugu',
      kn: 'Kannada',
      ml: 'Malayalam',
      bn: 'Bengali',
      mr: 'Marathi',
      gu: 'Gujarati',
      hinglish: 'Hinglish (Romanized Hindi-English mix)',
    };

    const targetLangName = langNames[targetLang] || targetLang;

    const prompt = `Translate the following course educational text accurately into ${targetLangName}. Keep technical terms clear. Output ONLY the translated text without quotes or explanations.\n\nText: "${text}"`;

    const aiRes = await executeAIWithFallback<string>(
      prompt,
      'You are a professional educational translator for engineering curricula.'
    );

    if (aiRes && aiRes.data) {
      const cleaned = typeof aiRes.data === 'string' ? aiRes.data.trim() : JSON.stringify(aiRes.data);
      translationCache.set(cacheKey, cleaned);
      return cleaned;
    }
  } catch (aiErr) {
    console.error('Translation AI error:', aiErr);
  }

  return text;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { texts, targetLang = 'en' } = body;

    if (!texts || !Array.isArray(texts)) {
      return NextResponse.json({ error: 'texts must be an array of strings' }, { status: 400 });
    }

    if (targetLang === 'en' || !targetLang) {
      return NextResponse.json({ success: true, translations: texts });
    }

    // Process all texts in parallel
    const translations = await Promise.all(
      texts.map((t: string) => translateSingleText(t, targetLang))
    );

    return NextResponse.json({ success: true, translations });
  } catch (error: any) {
    console.error('Error in /api/translate:', error);
    return NextResponse.json(
      { error: error.message || 'Internal translation server error' },
      { status: 500 }
    );
  }
}
