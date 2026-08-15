'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDictionary, DEFAULT_LANGUAGE } from '@signalhub/shared';
import { supabaseAdmin } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  dict: ReturnType<typeof getDictionary>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<string>('en');

  // Load language from localStorage or user profile on mount / user change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('signalhub-lang');
      if (savedLang) {
        setLanguageState(savedLang);
      } else if (user?.language) {
        setLanguageState(user.language);
      }
    }
  }, [user]);

  const setLanguage = async (newLang: string) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('signalhub-lang', newLang);
    }

    // Persist language to Supabase profile if user is logged in
    if (user?.id) {
      try {
        await supabaseAdmin.from('profiles').update({
          preferred_language: newLang,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
      } catch (e) {
        console.log('Language Supabase sync notice:', e);
      }
    }
  };

  const dict = getDictionary(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dict }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
