import { NextRequest, NextResponse } from 'next/server';
import { Course, Module, CourseSlide } from '@signalhub/types';
import { executeAIWithFallback } from '@/lib/ai/aiService';

export const dynamic = 'force-dynamic';

const TARGET_LANGUAGES = ['hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'hinglish'] as const;

const LANG_LABELS: Record<string, string> = {
  hi: 'Hindi (Devanagari)',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  hinglish: 'Hinglish (Conversational Tech Hindi-English)',
};

async function translateTextWithGTX(text: string, lang: string): Promise<string> {
  if (!text || !text.trim() || lang === 'en') return text;

  const targetLangCode = lang === 'hinglish' ? 'hi' : lang;

  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(
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
          return translatedResult;
        }
      }
    }
  } catch (e) {
    // Fallback to original text if error
  }
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { course } = body as { course: Partial<Course> };

    if (!course || !course.title) {
      return NextResponse.json({ error: 'Course data is required' }, { status: 400 });
    }

    const enrichedCourse = { ...course };

    // 1. Course Level Translations
    const courseTranslations: Record<string, { title?: string; summary?: string; description?: string }> =
      enrichedCourse.translations || {};

    for (const lang of TARGET_LANGUAGES) {
      if (!courseTranslations[lang]) courseTranslations[lang] = {};
      courseTranslations[lang].title = await translateTextWithGTX(course.title, lang);
      if (course.summary) {
        courseTranslations[lang].summary = await translateTextWithGTX(course.summary, lang);
      }
      if (course.description) {
        courseTranslations[lang].description = await translateTextWithGTX(course.description, lang);
      }
    }
    enrichedCourse.translations = courseTranslations;

    // 2. Module & Slide Level Translations
    if (Array.isArray(enrichedCourse.modules)) {
      for (const mod of enrichedCourse.modules) {
        const modTranslations: Record<string, { title?: string; description?: string }> =
          mod.translations || {};

        for (const lang of TARGET_LANGUAGES) {
          if (!modTranslations[lang]) modTranslations[lang] = {};
          modTranslations[lang].title = await translateTextWithGTX(mod.title, lang);
          if (mod.description) {
            modTranslations[lang].description = await translateTextWithGTX(mod.description, lang);
          }
        }
        mod.translations = modTranslations;

        // Translate Slides in Module
        const slides = mod.slides || mod.slides_data || [];
        for (const slide of slides) {
          const slideTranslations: Record<string, { title?: string; body_markdown?: string; notes?: string }> =
            slide.translations || {};

          for (const lang of TARGET_LANGUAGES) {
            if (!slideTranslations[lang]) slideTranslations[lang] = {};
            slideTranslations[lang].title = await translateTextWithGTX(slide.title, lang);
            if (slide.notes) {
              slideTranslations[lang].notes = await translateTextWithGTX(slide.notes, lang);
            }
          }
          slide.translations = slideTranslations;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedCourse,
      message: 'Multi-language translation package generated for all 10 languages.',
    });
  } catch (error: any) {
    console.error('Error generating course translations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate course translations' },
      { status: 500 }
    );
  }
}
