'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

export function Footer() {
  const rawPathname = usePathname();
  const pathname = rawPathname || '';
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // HIDE FOOTER ON LOGIN / AUTH PAGE
  if (pathname === '/auth') {
    return null;
  }

  return (
    <footer
      className={`mt-auto border-t py-5 px-4 text-center text-xs font-mono font-medium transition-colors mb-20 lg:mb-0 space-y-2.5 ${
        isLight
          ? 'bg-white border-zinc-200 text-zinc-600'
          : 'bg-black border-zinc-800 text-zinc-400'
      }`}
    >
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold font-sans">
        <Link href="/about" className="hover:underline text-black dark:text-white">About Us</Link>
        <span>•</span>
        <Link href="/courses" className="hover:underline text-black dark:text-white">Course Catalog</Link>
        <span>•</span>
        <Link href="/certificates" className="hover:underline text-black dark:text-white">Certificates</Link>
      </div>

      <p className="text-[11px] opacity-90 leading-relaxed font-sans font-medium">
        Developed by <strong className={isLight ? 'text-black font-extrabold' : 'text-white font-extrabold'}>Ayush Anupam</strong>
      </p>

      <p className="text-[10px] opacity-60">© 2026 Telecom Guruji. Production-Grade AI EdTech & Verification Infrastructure.</p>
    </footer>
  );
}
