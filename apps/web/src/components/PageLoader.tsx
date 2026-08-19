'use client';

import React from 'react';

interface PageLoaderProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export function PageLoader({
  fullScreen = true,
}: PageLoaderProps) {
  return (
    <div
      className={`${
        fullScreen ? 'fixed inset-0 z-[9999]' : 'w-full min-h-[220px]'
      } flex flex-col items-center justify-center bg-white/95 dark:bg-black/95 backdrop-blur-md text-black dark:text-white pointer-events-auto p-6 transition-all duration-300`}
    >
      {/* PURE MONOCHROME BLACK & WHITE MINIMALIST SPINNER */}
      <div className="relative flex items-center justify-center">
        {/* Outer Ring */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-zinc-200 dark:border-zinc-800 border-t-black dark:border-t-white animate-spin" />
        {/* Inner Counter Spinning Ring */}
        <div className="absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full border-[3px] border-zinc-300 dark:border-zinc-700 border-b-black dark:border-b-white animate-spin [animation-direction:reverse]" />
      </div>
    </div>
  );
}

export default PageLoader;
