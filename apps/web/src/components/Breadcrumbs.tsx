'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs sm:text-sm font-medium font-sans py-2 overflow-x-auto scrollbar-none">
      <Link
        href="/student/dashboard"
        className={`flex items-center space-x-1.5 transition-colors hover:underline shrink-0 ${
          isLight ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'
        }`}
        title="Dashboard Home"
      >
        <Home className="w-4 h-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-zinc-400' : 'text-zinc-600'}`} />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className={`transition-colors hover:underline truncate shrink-0 ${
                  isLight ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`font-semibold truncate shrink-0 ${
                  isLight ? 'text-black font-extrabold' : 'text-white font-extrabold'
                }`}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
