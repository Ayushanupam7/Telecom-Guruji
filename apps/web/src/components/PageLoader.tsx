'use client';

import React from 'react';

interface PageLoaderProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export function PageLoader({}: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white pointer-events-auto">
      {/* PURE MONOCHROME BLACK & WHITE MINIMALIST SPINNER */}
      <div className="relative flex items-center justify-center">
        {/* Outer Ring */}
        <div className="w-14 h-14 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-black dark:border-t-white animate-spin" />
        {/* Inner Counter Spinning Ring */}
        <div className="absolute w-8 h-8 rounded-full border-4 border-zinc-300 dark:border-zinc-700 border-b-black dark:border-b-white animate-spin [animation-direction:reverse]" />
      </div>
    </div>
  );
}

export default PageLoader;
