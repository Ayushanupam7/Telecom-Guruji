import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export const dynamic = 'force-dynamic';

// Authentic Microsoft Neural MALE Voice mappings for Guruji
const MALE_VOICE_MAP: Record<string, string> = {
  hi: 'hi-IN-MadhurNeural', // Hindi Male
  hinglish: 'hi-IN-MadhurNeural', // Hinglish Male
  en: 'en-IN-PrabhatNeural', // Indian English Male
  ta: 'ta-IN-ValluvarNeural', // Tamil Male
  te: 'te-IN-MohanNeural', // Telugu Male
  kn: 'kn-IN-GaganNeural', // Kannada Male
  ml: 'ml-IN-MidhunNeural', // Malayalam Male
  bn: 'bn-IN-BashkarNeural', // Bengali Male
  mr: 'mr-IN-ManoharNeural', // Marathi Male
  gu: 'gu-IN-NiranjanNeural', // Gujarati Male
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = (searchParams.get('lang') || 'en').toLowerCase();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    // Clean text of markdown and URLs
    const cleanedText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    // Select the designated Male Neural Voice for the language
    const voiceName = MALE_VOICE_MAP[lang] || 'en-IN-PrabhatNeural';

    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      
      const { audioStream } = tts.toStream(cleanedText);

      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      tts.close();

      const audioBuffer = Buffer.concat(chunks);

      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (edgeErr) {
      console.warn('MsEdgeTTS error, falling back to male voice parameter:', edgeErr);

      // Fallback
      return NextResponse.json(
        { error: 'Failed to synthesize male voice' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in TTS route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal TTS server error' },
      { status: 500 }
    );
  }
}
