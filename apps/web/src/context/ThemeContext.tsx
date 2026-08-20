'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemePreference: (newTheme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light', // DEFAULT THEME IS LIGHT MODE
  toggleTheme: () => {},
  setThemePreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isAuthPage = pathname === '/auth' || pathname.startsWith('/auth');

  // Read localStorage synchronously so first paint uses the correct theme
  // (avoids flash of light mode for dark-mode users)
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = (localStorage.getItem('theme_preference') || localStorage.getItem('signalhub-theme')) as Theme | null;
      if (stored === 'dark' || stored === 'light') return stored;
    }
    return 'light'; // default
  });

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
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme_preference', targetTheme);
      localStorage.setItem('signalhub-theme', targetTheme);
    }
  };

  // Enforce correct DOM theme classes when navigating or theme changes
  useEffect(() => {
    applyDomTheme(theme, isAuthPage);
  }, [isAuthPage, theme]);

  // Synchronize across open browser tabs via localStorage storage event
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme_preference' || e.key === 'signalhub-theme') {
        const newTheme = e.newValue as Theme | null;
        if (newTheme === 'dark' || newTheme === 'light') {
          setTheme(newTheme);
          applyDomTheme(newTheme, isAuthPage);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthPage]);

  /**
   * TOGGLE THEME & SAVE TO LOCALSTORAGE
   */
  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  };

  const setThemePreference = (newTheme: Theme) => {
    applyTheme(newTheme);
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
