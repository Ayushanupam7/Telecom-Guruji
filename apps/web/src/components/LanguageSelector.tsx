'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@signalhub/shared';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function LanguageSelector() {
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const isLight = theme === 'light';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  return (
    <div
      className={`flex items-center space-x-1.5 border rounded-full px-3 py-1 text-xs font-bold transition-all ${
        isLight
          ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 shadow-sm'
          : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
      }`}
    >
      <Globe className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
      <select
        value={language}
        onChange={handleChange}
        className={`bg-transparent focus:outline-none cursor-pointer font-bold ${
          isLight ? 'text-slate-800' : 'text-slate-200'
        }`}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option
            key={lang.code}
            value={lang.code}
            className={isLight ? 'bg-white text-slate-900 font-medium' : 'bg-slate-900 text-white font-medium'}
          >
            {lang.flag} {lang.nativeName} ({lang.code.toUpperCase()})
          </option>
        ))}
      </select>
    </div>
  );
}
