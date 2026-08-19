import { NextRequest, NextResponse } from 'next/server';
import { executeAIWithFallback } from '@/lib/ai/aiService';

export interface GlossaryAIResult {
  term: string;
  full_form?: string;
  short_definition: string;
  detailed_meaning: string;
  telecom_application: string;
  real_world_example: string;
  key_takeaways: string[];
  related_terms?: string[];
}

export interface ExtractedSlideTerm {
  term: string;
  full_form?: string;
  short_definition: string;
  category: 'Architecture' | '5G RAN' | '5G Core' | 'Protocols' | 'Cloud' | 'Billing & Operations' | 'General';
  difficulty_reason?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, term, slideText, slideTitle, language = 'en', courseContext } = body as {
      action?: 'lookup' | 'scan_slide';
      term?: string;
      slideText?: string;
      slideTitle?: string;
      language?: string;
      courseContext?: string;
    };

    const langInstructions: Record<string, string> = {
      hi: 'Explain in clear Hindi (हिन्दी) suitable for telecom students, keeping technical terms/acronyms in English/Latin script.',
      ta: 'Explain in clear Tamil (தமிழ்) suitable for telecom students, keeping technical terms/acronyms in English/Latin script.',
      te: 'Explain in clear Telugu (తెలుగు) suitable for telecom students, keeping technical terms/acronyms in English/Latin script.',
      kn: 'Explain in clear Kannada (ಕನ್ನಡ) suitable for telecom students, keeping technical terms/acronyms in English/Latin script.',
      ml: 'Explain in clear Malayalam (മലയാളം) suitable for telecom students, keeping technical terms/acronyms in English/Latin script.',
      en: 'Explain in clear, technical yet accessible English.',
    };

    const targetLangNote = langInstructions[language] || langInstructions.en;

    // SCENARIO A: SCAN SLIDE FOR HARD / COMPLEX TERMS
    if (action === 'scan_slide') {
      if (!slideText || !slideText.trim()) {
        return NextResponse.json({ success: false, error: 'slideText parameter is required for slide scanning' }, { status: 400 });
      }

      const systemPrompt = `You are "Telecom Guruji AI Assistant", an expert Telecommunications & Cloud Engineering Professor.
Your task is to scan the provided lesson slide content and extract 3 to 6 key, complex, or technical terms/acronyms that might be difficult for students.
Respond ONLY with a valid JSON object matching the requested schema. Do NOT use markdown code fences.`;

      const prompt = `Analyze this course slide text and identify 3-6 difficult telecom, 5G, networking, or cloud terms:
Slide Title: "${slideTitle || 'Current Lesson Slide'}"
Slide Content: "${slideText.slice(0, 3000)}"
${courseContext ? `Course Context: ${courseContext}` : ''}
Language Instruction: ${targetLangNote}

Provide the output strictly as a JSON object:
{
  "terms": [
    {
      "term": "Term or Acronym Name",
      "full_form": "Expanded Acronym or full standard name (if applicable, else empty string)",
      "short_definition": "Clear 1-2 sentence definition focused on how it is used in this slide.",
      "category": "One of: Architecture | 5G RAN | 5G Core | Protocols | Cloud | Billing & Operations | General",
      "difficulty_reason": "Why this term is important or tricky in this slide"
    }
  ]
}`;

      const aiResult = await executeAIWithFallback<{ terms: ExtractedSlideTerm[] } | string>(prompt, systemPrompt, { asJSON: true });

      let parsedTerms: ExtractedSlideTerm[] = [];
      if (typeof aiResult.data === 'string') {
        try {
          const clean = aiResult.data.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
          const parsed = JSON.parse(clean);
          parsedTerms = parsed.terms || [];
        } catch {
          parsedTerms = [];
        }
      } else if (Array.isArray(aiResult.data?.terms)) {
        parsedTerms = aiResult.data.terms;
      }

      return NextResponse.json({
        success: true,
        action: 'scan_slide',
        data: parsedTerms,
        providerUsed: aiResult.providerUsed,
      });
    }

    // SCENARIO B: SINGLE TERM AI DEFINITION LOOKUP
    if (!term || typeof term !== 'string' || !term.trim()) {
      return NextResponse.json({ success: false, error: 'Term parameter is required' }, { status: 400 });
    }

    const cleanTerm = term.trim();

    const systemPrompt = `You are "Telecom Guruji AI Assistant", a world-class Telecommunications Engineer & 5G/4G Network Systems Professor.
Your goal is to provide concise, crystal-clear, and practical technical explanations of telecommunications, wireless, networking, DSP, RF, and cloud terms.
Respond ONLY with a valid JSON object matching the requested schema. Do NOT enclose in markdown code fences or backticks.`;

    const prompt = `Define and explain the telecommunication/networking term: "${cleanTerm}"
${courseContext ? `Course Context: ${courseContext}` : ''}
Language Instruction: ${targetLangNote}

Provide the response in the following JSON structure:
{
  "term": "${cleanTerm}",
  "full_form": "Expanded acronym or official standard name (if applicable, else empty string)",
  "short_definition": "A 1-2 sentence high-level definition suitable for a glossary.",
  "detailed_meaning": "A clear explanation of what this is, why it is needed, and how it works in modern telecom networks.",
  "telecom_application": "Where this is applied in telecom infrastructure (e.g. 5G NR RAN, 5G Core, gNB, eNodeB, Fronthaul/Backhaul, Fiber, RF, Spectrum).",
  "real_world_example": "A concrete real-world engineering or operator deployment scenario (e.g. Reliance Jio / Airtel 5G, Qualcomm Snapdragon modem, Open RAN, tower beamforming).",
  "key_takeaways": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3"
  ],
  "related_terms": ["Related Term 1", "Related Term 2", "Related Term 3"]
}`;

    const aiResult = await executeAIWithFallback<GlossaryAIResult | string>(prompt, systemPrompt, { asJSON: true });

    let parsedData: GlossaryAIResult;

    if (typeof aiResult.data === 'string') {
      try {
        const clean = aiResult.data.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
        parsedData = JSON.parse(clean);
      } catch (parseErr) {
        parsedData = {
          term: cleanTerm,
          short_definition: aiResult.data.slice(0, 180),
          detailed_meaning: aiResult.data,
          telecom_application: 'Telecommunications network architecture & protocols.',
          real_world_example: `Practical deployment in modern cellular systems.`,
          key_takeaways: ['Core telecom specification component', 'Essential for protocol interoperability'],
        };
      }
    } else {
      parsedData = aiResult.data;
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      providerUsed: aiResult.providerUsed,
      fallbackUsed: aiResult.fallbackUsed,
      model: aiResult.model,
    });
  } catch (err: any) {
    console.error('AI Glossary Error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Failed to search definition via AI' 
    }, { status: 500 });
  }
}
