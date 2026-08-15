export const APP_NAME = 'SignalHub';
export const APP_TAGLINE = 'AI-Powered Learning & Verification Platform';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
] as const;

export const DEFAULT_LANGUAGE = 'en';

export const COURSE_CATEGORIES = [
  'Computer Science',
  'Software Engineering',
  'Data Science & AI',
  'Web Development',
  'Cloud & DevOps',
  'Cybersecurity',
  'Mobile Development',
] as const;

export const VIDEO_WATCH_COMPLETION_THRESHOLD = 90; // 90% required
