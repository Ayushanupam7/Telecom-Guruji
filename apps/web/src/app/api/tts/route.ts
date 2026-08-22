import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'en';

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    // Map internal language codes to Google TTS BCP-47 codes
    const langCodeMap: Record<string, string> = {
      ta: 'ta',
      te: 'te',
      kn: 'kn',
      ml: 'ml',
      bn: 'bn',
      mr: 'mr',
      gu: 'gu',
      hi: 'hi',
      hinglish: 'hi',
      en: 'en',
    };

    const targetLang = langCodeMap[lang.toLowerCase()] || 'en';

    // Clean text of markdown and URLs
    const cleanedText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    // Google Translate TTS chunk size limit is ~200 characters
    // Take the first 200 characters or split appropriately
    const truncatedText = cleanedText.length > 200 ? cleanedText.slice(0, 197) + '...' : cleanedText;

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetLang}&client=tw-ob&q=${encodeURIComponent(
      truncatedText
    )}`;

    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `TTS Provider returned ${response.status}` },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: any) {
    console.error('Error in TTS route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal TTS server error' },
      { status: 500 }
    );
  }
}
