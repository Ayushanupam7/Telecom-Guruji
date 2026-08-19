'use client';

import React from 'react';
import { InstructorMobileWarning } from '@/components/instructor/InstructorMobileWarning';

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile/Small Screen Instructor Warning */}
      <InstructorMobileWarning />
      
      {/* Instructor Route Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
