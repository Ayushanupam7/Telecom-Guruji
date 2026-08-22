'use client';

import React, { useState } from 'react';
import { Sparkles, MessageSquare, Volume2, Mic, Check, ChevronLeft, PanelRightOpen } from 'lucide-react';
import { GurujiAvatarState } from '@signalhub/types';

interface GurujiFloatingButtonProps {
  onClick: () => void;
  avatarState?: GurujiAvatarState;
  isVisible: boolean;
}

export function GurujiFloatingButton({ onClick, avatarState = 'idle', isVisible }: GurujiFloatingButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!isVisible) return null;

  return (
    <>
      {/* DESKTOP & TABLET: RIGHT-DOCKED COLLAPSED GURUJI CARD TAB */}
      <div className="hidden sm:flex fixed right-0 top-[58%] -translate-y-1/2 z-40 select-none animate-in fade-in duration-300">
        <button
          type="button"
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative flex items-center space-x-2 py-3 px-2.5 rounded-l-2xl bg-zinc-950/95 dark:bg-zinc-900/95 text-white border-y border-l border-sky-500/40 shadow-2xl shadow-sky-500/25 hover:border-sky-400 hover:bg-zinc-900 active:scale-95 transition-all duration-300 cursor-pointer backdrop-blur-md group"
          title="Expand Guruji AI Teacher Card (Click to open)"
        >
          {/* Subtle Aura Glow */}
          <div className="absolute inset-0 rounded-l-2xl bg-gradient-to-r from-sky-500/20 via-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Left Arrow Icon */}
          <ChevronLeft className="w-3.5 h-3.5 text-sky-400 group-hover:-translate-x-0.5 transition-transform" />

          {/* Guruji Avatar Face Badge */}
          <div className="relative w-7 h-7 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <span className="text-sm">👨‍🏫</span>

            {/* Active Status Pulse Dot */}
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-zinc-950" />
            </span>
          </div>

          {/* Text Label */}
          <div className="text-left flex flex-col justify-center min-w-0 pr-1">
            <div className="flex items-center space-x-1">
              <span className="text-xs font-black tracking-tight text-white flex items-center gap-1">
                Guruji AI
                <Sparkles className="w-2.5 h-2.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium text-sky-300/90 leading-tight">
              {isHovered ? 'Ask Guruji →' : 'Collapsed'}
            </span>
          </div>
        </button>
      </div>

      {/* MOBILE: COMPACT FLOATING BUTTON (Positioned cleanly above bottom nav without covering controls) */}
      <div className="sm:hidden fixed bottom-16 right-3 z-40 select-none animate-in fade-in duration-300">
        <button
          type="button"
          onClick={onClick}
          className="flex items-center space-x-2 px-3 py-2 rounded-2xl bg-zinc-950/95 text-white border border-sky-500/40 shadow-xl active:scale-95 transition-all backdrop-blur-md"
        >
          <span className="text-base">👨‍🏫</span>
          <span className="text-xs font-black">Guruji AI</span>
        </button>
      </div>
    </>
  );
}
