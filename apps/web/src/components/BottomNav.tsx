'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Award, User, Layers } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export function BottomNav() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLight = theme === 'light';

  // 1. Hide Bottom Navigation on Authentication Page (/auth)
  if (pathname === '/auth') {
    return null;
  }

  const role = (user?.role as string) || 'student';
  const isLoggedIn = !!user;

  // 2. Student Navigation Order: Home -> Explore -> Certificate -> Profile
  const navItems = [
    {
      label: 'Home',
      href: isLoggedIn ? '/student/dashboard' : '/',
      icon: Home,
      isActive: isLoggedIn
        ? pathname.startsWith('/student') || pathname === '/'
        : pathname === '/',
    },
    {
      label: 'Explore',
      href: '/courses',
      icon: Compass,
      isActive: pathname === '/courses' || pathname.startsWith('/courses/'),
    },
    ...(role === 'instructor'
      ? [
          {
            label: 'Studio',
            href: '/instructor/dashboard',
            icon: Layers,
            isActive: pathname.startsWith('/instructor'),
          },
        ]
      : [
          {
            label: 'Certificate',
            href: '/certificate/c3333333-3333-3333-3333-333333333333',
            icon: Award,
            isActive: pathname.startsWith('/certificate'),
          },
        ]),
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      isActive: pathname === '/profile',
    },
  ];

  return (
    <nav
      className={`fixed bottom-3 left-4 right-4 z-40 lg:hidden max-w-md mx-auto rounded-3xl border backdrop-blur-xl transition-all duration-300 ${
        isLight
          ? 'bg-white/90 border-zinc-200/90 text-black shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
          : 'bg-zinc-950/90 border-zinc-800/90 text-white shadow-[0_8px_30px_rgb(0,0,0,0.8)]'
      }`}
      aria-label="Mobile Bottom Navigation Bar"
    >
      <div className="px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-2xl transition-all duration-300 cursor-pointer active:scale-95 ${
                active
                  ? isLight
                    ? 'bg-black text-white shadow-md font-black scale-105'
                    : 'bg-white text-black shadow-md font-black scale-105'
                  : isLight
                  ? 'text-zinc-500 hover:text-black hover:bg-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 transition-transform duration-300 ${active ? 'scale-110' : ''}`} />
              </div>
              <span className="text-[10px] tracking-tight leading-none font-mono uppercase font-bold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
