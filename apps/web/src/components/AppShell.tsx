'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { QuickToolsDrawer } from '@/components/QuickToolsDrawer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isLearnPage = pathname.startsWith('/learn/');
  const isAuthPage = pathname === '/auth';
  const isCourseCreatePage = pathname.startsWith('/instructor/course/create');
  const isInstructorDashboard = pathname.startsWith('/instructor/dashboard') || pathname === '/instructor';
  const isImmersive = isLearnPage || isAuthPage || isCourseCreatePage;

  return (
    <>
      {!isImmersive && <Header />}
      <main
        className={`flex-1 w-full ${
          isLearnPage
            ? 'p-0 m-0 w-full min-h-screen flex flex-col'
            : isAuthPage
            ? 'w-full min-h-screen flex items-center justify-center p-0 m-0'
            : isCourseCreatePage
            ? 'w-full p-2 sm:p-4'
            : isInstructorDashboard
            ? 'w-full min-h-screen p-0 m-0'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 lg:pb-8'
        }`}
      >
        {children}
      </main>
      {!isImmersive && <BottomNav />}
      {!isAuthPage && <QuickToolsDrawer />}
      {!isImmersive && <Footer />}
    </>
  );
}
