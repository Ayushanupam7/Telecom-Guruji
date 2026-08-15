'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  SlidersHorizontal, X, Globe, Moon, Sun, Check, ChevronLeft 
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@signalhub/shared';

export function QuickToolsDrawer() {
  const rawPathname = usePathname();
  const pathname = rawPathname || '';
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const isLight = theme === 'light';

  // 1. Listen for open-quick-tools event
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsCollapsed(false);
    };
    window.addEventListener('open-quick-tools', handleOpen);
    return () => window.removeEventListener('open-quick-tools', handleOpen);
  }, []);

  // 2. Auto-collapse trigger tab to an arrow after 6 seconds of non-interaction
  useEffect(() => {
    if (isOpen) return;

    const timer = setTimeout(() => {
      setIsCollapsed(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // 3. Hide completely on Authentication Page (/auth)
  if (pathname === '/auth') {
    return null;
  }

  return (
    <>
      {/* ULTRA-SLIM BLACK & WHITE FLOATING RIGHT TRIGGER ARROW TAB */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          type="button"
          className={`group py-3 px-1.5 rounded-l-xl border-y border-l shadow-2xl transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-90 ${
            isLight
              ? 'bg-black border-zinc-800 text-white hover:bg-zinc-900 hover:px-2.5'
              : 'bg-white border-zinc-200 text-black hover:bg-zinc-100 hover:px-2.5'
          }`}
          title="Platform Preferences & Language Tools"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'animate-pulse group-hover:scale-125'}`} />
        </button>
      </div>

      {/* BACKDROP OVERLAY */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* BLACK & WHITE SLIDING DRAWER PANEL */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-72 sm:w-80 z-50 border-l shadow-2xl transition-transform duration-250 ease-out flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${
          isLight
            ? 'bg-white border-zinc-300 text-black'
            : 'bg-black border-zinc-800 text-white'
        }`}
      >
        {/* DRAWER HEADER */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white flex items-center justify-center">
              <SlidersHorizontal className="w-3.5 h-3.5 text-black dark:text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-tight uppercase">Platform Preferences</h3>
              <p className="text-[9px] text-zinc-500 font-mono">Language & Appearance</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            type="button"
            className="p-1 rounded-md text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* DRAWER CONTENT */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 font-sans">
          
          {/* 1. LANGUAGE CHANGER SECTION */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-[11px] font-mono font-bold uppercase">
                <Globe className="w-3.5 h-3.5" />
                <span>App Language</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase">
                {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                    }}
                    type="button"
                    className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold'
                        : isLight
                        ? 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-base">{lang.flag}</span>
                      <div>
                        <span className="text-xs block font-bold">{lang.label}</span>
                        <span className="text-[9px] opacity-70 font-mono">{lang.nativeName}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. THEME MODE TOGGLE SECTION */}
          <div className="space-y-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-[11px] font-mono font-bold uppercase">
                {isLight ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>Appearance Mode</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (!isLight) toggleTheme();
                }}
                type="button"
                className={`p-3 rounded-lg border text-center space-y-1 transition-all ${
                  isLight
                    ? 'bg-black text-white border-black font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Sun className="w-4 h-4 mx-auto" />
                <span className="text-[11px] block font-bold">Light Mode</span>
              </button>

              <button
                onClick={() => {
                  if (isLight) toggleTheme();
                }}
                type="button"
                className={`p-3 rounded-lg border text-center space-y-1 transition-all ${
                  !isLight
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Moon className="w-4 h-4 mx-auto" />
                <span className="text-[11px] block font-bold">Dark Mode</span>
              </button>
            </div>
          </div>
        </div>

        {/* DRAWER FOOTER */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <button
            onClick={() => setIsOpen(false)}
            type="button"
            className="w-full py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold text-xs transition-all"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </>
  );
}

export default QuickToolsDrawer;
