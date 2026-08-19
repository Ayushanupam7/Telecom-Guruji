'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabaseAdmin, supabase } from '@/lib/supabase';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemePreference: (newTheme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light', // DEFAULT THEME IS LIGHT MODE
  toggleTheme: () => {},
  setThemePreference: async () => {},
});

const isUUID = (str?: string): boolean =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname() || '';
  const isAuthPage = pathname === '/auth' || pathname.startsWith('/auth');
  const [theme, setTheme] = useState<Theme>('light'); // DEFAULT TO LIGHT MODE

  const applyDomTheme = (targetTheme: Theme, isAuth: boolean) => {
    if (typeof window !== 'undefined') {
      if (isAuth || targetTheme === 'light') {
        document.documentElement.classList.remove('dark', 'dark-mode');
        document.documentElement.classList.add('light', 'light-mode');
        document.body.classList.remove('dark', 'dark-mode');
        document.body.classList.add('light', 'light-mode');
      } else {
        document.documentElement.classList.remove('light', 'light-mode');
        document.documentElement.classList.add('dark', 'dark-mode');
        document.body.classList.remove('light', 'light-mode');
        document.body.classList.add('dark', 'dark-mode');
      }
    }
  };

  const applyTheme = (targetTheme: Theme) => {
    setTheme(targetTheme);
    applyDomTheme(targetTheme, isAuthPage);
  };

  // Enforce correct DOM theme classes when navigating or theme changes
  useEffect(() => {
    applyDomTheme(theme, isAuthPage);
  }, [isAuthPage, theme]);

  // 1. AUTOMATICALLY SYNC DARK OR LIGHT THEME FROM SUPABASE USER DATABASE
  useEffect(() => {
    async function syncDatabaseTheme() {
      if (user?.id || user?.email) {
        try {
          const validId = isUUID(user?.id) ? user?.id : null;
          const targetEmail = user?.email;

          let query = supabaseAdmin.from('profiles').select('theme_preference');
          if (validId && targetEmail) {
            query = query.or(`id.eq.${validId},email.eq.${targetEmail}`);
          } else if (validId) {
            query = query.eq('id', validId);
          } else if (targetEmail) {
            query = query.eq('email', targetEmail);
          }

          const { data: pAdmin } = await query.limit(1);
          let dbTheme: string | null = pAdmin?.[0]?.theme_preference || null;

          if (!dbTheme) {
            let queryAnon = supabase.from('profiles').select('theme_preference');
            if (validId && targetEmail) {
              queryAnon = queryAnon.or(`id.eq.${validId},email.eq.${targetEmail}`);
            } else if (validId) {
              queryAnon = queryAnon.eq('id', validId);
            } else if (targetEmail) {
              queryAnon = queryAnon.eq('email', targetEmail);
            }
            const { data: pAnon } = await queryAnon.limit(1);
            dbTheme = pAnon?.[0]?.theme_preference || null;
          }

          if (dbTheme === 'dark' || dbTheme === 'light') {
            console.log(`🌙 AUTOMATICALLY RESTORED ${dbTheme.toUpperCase()} THEME FROM SUPABASE DB FOR ${user?.email || user?.id}`);
            applyTheme(dbTheme as Theme);
            return;
          }
        } catch (e) {
          console.log('Supabase theme auto-sync note:', e);
        }
      }

      // Default to Light Mode
      applyTheme('light');
    }

    syncDatabaseTheme();
  }, [user?.id, user?.email]);

  // 2. ⚡ REALTIME SUPABASE LISTENERS FOR INSTANT MULTI-DEVICE THEME SYNC
  useEffect(() => {
    if (!user?.id && !user?.email) return;

    const filterClause = isUUID(user?.id) ? `id=eq.${user.id}` : `email=eq.${user.email}`;
    const channelName = `realtime-theme-${user?.id || user?.email}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: filterClause,
        },
        (payload: any) => {
          const newTheme = payload.new?.theme_preference;
          if (newTheme === 'dark' || newTheme === 'light') {
            console.log(`⚡ REALTIME SUPABASE THEME SYNC RECEIVED: ${newTheme.toUpperCase()}`);
            applyTheme(newTheme);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, user?.email]);

  /**
   * 🚀 GUARANTEED SYNCHRONIZATION OF THEME PREFERENCE TO SUPABASE PROFILES TABLE
   */
  const syncThemeToSupabase = async (targetTheme: Theme) => {
    const targetEmail = user?.email || 'student@signalhub.app';
    const validId = isUUID(user?.id) ? user?.id : 'e1111111-1111-1111-1111-111111111111';

    try {
      // 1. UPDATE EXACT MATCHING PROFILE BY EMAIL (CASE-INSENSITIVE)
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({
          theme_preference: targetTheme,
          updated_at: new Date().toISOString(),
        })
        .ilike('email', targetEmail)
        .select();

      if (!updateErr && updated && updated.length > 0) {
        console.log(`✅ THEME (${targetTheme.toUpperCase()}) UPDATED IN SUPABASE DB FOR ${targetEmail}`);
        return;
      }

      // 2. IF ROW DOES NOT EXIST FOR THIS EMAIL YET, UPSERT SPECIFICALLY FOR THIS EMAIL
      const payload: any = {
        id: validId,
        email: targetEmail,
        full_name: user?.fullName || 'User',
        role: user?.role || 'student',
        theme_preference: targetTheme,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabaseAdmin
        .from('profiles')
        .upsert(payload, { onConflict: 'email' });

      if (upsertErr) {
        await supabase
          .from('profiles')
          .upsert(payload, { onConflict: 'email' });
      }

      console.log(`✅ THEME (${targetTheme.toUpperCase()}) SAVED TO SUPABASE PROFILES FOR ${targetEmail}`);
    } catch (err) {
      console.log('Supabase theme sync note:', err);
    }
  };

  /**
   * TOGGLE THEME & SYNC WITH SUPABASE DATABASE
   */
  const toggleTheme = async () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    await syncThemeToSupabase(nextTheme);
  };

  const setThemePreference = async (newTheme: Theme) => {
    applyTheme(newTheme);
    await syncThemeToSupabase(newTheme);
  };

  const effectiveThemeClass = isAuthPage ? 'light-mode' : (theme === 'light' ? 'light-mode' : 'dark-mode');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemePreference }}>
      <div className={effectiveThemeClass}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
