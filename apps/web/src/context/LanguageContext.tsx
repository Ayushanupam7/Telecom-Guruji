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

  // Load language directly from Supabase user profile on mount / user change
  useEffect(() => {
    if (!user?.id && !user?.email) return;

    async function loadSupabaseLanguage() {
      try {
        let query = supabaseAdmin.from('profiles').select('preferred_language');
        if (user?.id) {
          query = query.eq('id', user.id);
        } else if (user?.email) {
          query = query.eq('email', user.email);
        }
        const { data } = await query.limit(1);
        if (data && data[0]?.preferred_language) {
          setLanguageState(data[0].preferred_language);
        } else if (user?.language) {
          setLanguageState(user.language);
        }
      } catch (e) {
        console.warn('Language Supabase load notice:', e);
      }
    }

    loadSupabaseLanguage();
  }, [user?.id, user?.email, user?.language]);

  const setLanguage = async (newLang: string) => {
    setLanguageState(newLang);

    // Persist language directly to Supabase profile
    if (user?.id || user?.email) {
      try {
        let updateQuery = supabaseAdmin.from('profiles').update({
          preferred_language: newLang,
          updated_at: new Date().toISOString(),
        });

        if (user?.id) {
          updateQuery = updateQuery.eq('id', user.id);
        } else {
          updateQuery = updateQuery.eq('email', user.email);
        }

        await updateQuery;
      } catch (e) {
        console.warn('Language Supabase sync notice:', e);
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
