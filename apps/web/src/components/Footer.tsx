'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

export function Footer() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // HIDE FOOTER ON LOGIN / AUTH PAGE
  if (pathname === '/auth') {
    return null;
  }

  return (
    <footer
      className={`mt-auto border-t py-3.5 px-4 text-center text-[11px] font-mono font-medium transition-colors mb-20 lg:mb-0 ${
        isLight
          ? 'bg-white border-zinc-200 text-zinc-500'
          : 'bg-black border-zinc-800 text-zinc-400'
      }`}
    >
      <p>© 2026 Telecom Guruji. Production-Grade AI EdTech Infrastructure.</p>
    </footer>
  );
}
