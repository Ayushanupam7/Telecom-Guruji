import { DEFAULT_LANGUAGE } from '../constants';
import { en } from './en';
import { hi } from './hi';
import { ta } from './ta';
import { te } from './te';
import { kn } from './kn';
import { ml } from './ml';
import { CATEGORY_MAP, COURSE_TRANSLATIONS, GENERIC_SUMMARY_TRANSLATIONS, MODULE_TRANSLATIONS, SLIDE_TRANSLATIONS } from './courses';

export const UI_DICTIONARIES = {
  en,
  hi,
  ta,
  te,
  kn,
  ml,
};

export type DictionaryLanguage = keyof typeof UI_DICTIONARIES;

export function getDictionary(lang: string = DEFAULT_LANGUAGE) {
  const code = (lang in UI_DICTIONARIES) ? (lang as DictionaryLanguage) : DEFAULT_LANGUAGE;
  return UI_DICTIONARIES[code];
}

export function translateCategory(cat: string, lang: string): string {
  if (lang === 'en' || !lang) return cat;
  return CATEGORY_MAP[cat]?.[lang] || cat;
}

export function translateCourseTitle(slugOrId: string, originalTitle: string, lang: string): string {
  if (lang === 'en' || !lang) return originalTitle;
  const match = COURSE_TRANSLATIONS[slugOrId];
  if (match && match[lang]?.title) {
    return match[lang].title;
  }
  return originalTitle;
}

export function translateCourseSummary(slugOrId: string, originalSummary: string, lang: string): string {
  if (lang === 'en' || !lang) return originalSummary;
  const match = COURSE_TRANSLATIONS[slugOrId];
  if (match && match[lang]?.summary) {
    return match[lang].summary;
  }
  const genericMatch = GENERIC_SUMMARY_TRANSLATIONS[originalSummary];
  if (genericMatch && genericMatch[lang]) {
    return genericMatch[lang];
  }
  return originalSummary;
}

export function translateModuleTitle(originalTitle: string, lang: string): string {
  if (lang === 'en' || !lang) return originalTitle;
  const match = MODULE_TRANSLATIONS[originalTitle];
  if (match && match[lang]?.title) {
    return match[lang].title;
  }
  
  const dict = getDictionary(lang);
  const modNumMatch = originalTitle.match(/^Module\s+(\d+):\s*(.*)$/i);
  if (modNumMatch) {
    const num = modNumMatch[1];
    const subTitle = modNumMatch[2];
    for (const key of Object.keys(MODULE_TRANSLATIONS)) {
      if (key.toLowerCase().includes(subTitle.toLowerCase())) {
        const tr = MODULE_TRANSLATIONS[key][lang]?.title;
        if (tr) return tr;
      }
    }
    return `${dict.moduleWord || 'Module'} ${num}: ${subTitle}`;
  }
  return originalTitle;
}

export function translateModuleDescription(originalDesc: string, lang: string): string {
  if (lang === 'en' || !lang) return originalDesc;
  for (const mKey of Object.keys(MODULE_TRANSLATIONS)) {
    const item = MODULE_TRANSLATIONS[mKey];
    if (item[lang]?.description) {
      return item[lang].description;
    }
  }
  return originalDesc;
}

export function translateSlideTitle(originalTitle: string, lang: string): string {
  if (lang === 'en' || !lang) return originalTitle;
  const match = SLIDE_TRANSLATIONS[originalTitle];
  if (match && match[lang]?.title) {
    return match[lang].title;
  }

  const dict = getDictionary(lang);
  const slideNumMatch = originalTitle.match(/^Slide\s+(\d+):\s*(.*)$/i);
  if (slideNumMatch) {
    const num = slideNumMatch[1];
    const subTitle = slideNumMatch[2];
    for (const key of Object.keys(SLIDE_TRANSLATIONS)) {
      const cleanKey = key.replace(/^Slide\s+\d+:\s*/i, '').toLowerCase();
      if (cleanKey.includes(subTitle.toLowerCase()) || subTitle.toLowerCase().includes(cleanKey)) {
        const tr = SLIDE_TRANSLATIONS[key][lang]?.title;
        if (tr) return tr;
      }
    }
    return `${dict.slideWord || 'Slide'} ${num}: ${subTitle}`;
  }

  return originalTitle;
}

export function translateSlideBody(originalBody: string, slideTitle: string, lang: string): string {
  if (lang === 'en' || !lang) return originalBody;
  const match = SLIDE_TRANSLATIONS[slideTitle];
  if (match && match[lang]?.body_markdown) {
    return match[lang].body_markdown;
  }

  for (const key of Object.keys(SLIDE_TRANSLATIONS)) {
    const cleanKey = key.replace(/^Slide\s+\d+:\s*/i, '').toLowerCase();
    const cleanTitle = slideTitle.replace(/^Slide\s+\d+:\s*/i, '').toLowerCase();
    if (cleanKey === cleanTitle || cleanKey.includes(cleanTitle) || cleanTitle.includes(cleanKey)) {
      if (SLIDE_TRANSLATIONS[key][lang]?.body_markdown) {
        return SLIDE_TRANSLATIONS[key][lang].body_markdown;
      }
    }
  }

  if (originalBody.toLowerCase().includes('client-server') || originalBody.toLowerCase().includes('load balancer')) {
    const fallbackMap: Record<string, string> = {
      hi: 'क्लाइंट-सर्वर डेटा प्रवाह और लोड बैलेंसर नोड रूटिंग का दृश्य विवरण।',
      ta: 'கிளையண்ட்-சர்வர் தரவு ஓட்டம் மற்றும் லோட் பேலன்சர் முனை ரூட்டிங் காட்சி பகுப்பாய்வு.',
      te: 'క్లయింట్-సర్వర్ డేటా ఫ్లో మరియు లోడ్ బ్యాలెన్సర్ నోడ్ రూటింగ్ దృశ్య విశ్లేషణ.',
      kn: 'ಕ್ಲೈಂಟ್-ಸರ್ವರ್ ಡೇಟಾ ಹರಿವು ಮತ್ತು ಲೋಡ್ ಬ್ಯಾಲೆನ್ಸರ್ ನೋಡ್ ರೂಟಿಂಗ್ ದೃಶ್ಯ ವಿವರಣೆ.',
      ml: 'ക്ലയന്റ്-സെർവർ ഡാറ്റാ ഫ്ലോയുടെയും ലോഡ് ബാലൻസർ നോഡ് റൂട്ടിംഗിന്റെയും വിഷ്വൽ വിശകലനം.',
    };
    if (fallbackMap[lang]) return fallbackMap[lang];
  }

  return originalBody;
}
