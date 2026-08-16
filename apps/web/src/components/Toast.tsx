'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastItemProps extends ToastMessage {
  onClose: (id: string) => void;
}

export function ToastItem({ id, title, message, type = 'success', duration = 3500, onClose }: ToastItemProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 200);
  };

  // Auto dismiss with smooth fade-out
  useEffect(() => {
    const autoDismissTimer = setTimeout(() => {
      setIsExiting(true);
      const removeTimer = setTimeout(() => {
        onClose(id);
      }, 200);
      return () => clearTimeout(removeTimer);
    }, duration);

    return () => clearTimeout(autoDismissTimer);
  }, [id, duration, onClose]);

  const IconComponent = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[type] || CheckCircle2;

  return (
    <div
      className={`w-[240px] sm:w-[260px] pointer-events-auto relative flex items-center space-x-2.5 px-3 py-2.5 rounded-xl border shadow-2xl transition-all duration-200 ease-in-out no-underline ${
        isExiting
          ? 'opacity-0 translate-x-6 scale-95'
          : 'opacity-100 translate-x-0 scale-100 animate-in fade-in slide-in-from-right-6'
      } ${
        isLight
          ? 'bg-white border-black text-black shadow-zinc-400/40'
          : 'bg-black border-white text-white shadow-black'
      }`}
      role="alert"
    >
      {/* MONOCHROME PURE BLACK / WHITE BADGE */}
      <div className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center ${
        isLight ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <IconComponent className="w-3.5 h-3.5" />
      </div>

      {/* SHORT & CONCISE TEXT CONTENT (NO UNDERLINE) */}
      <div className="flex-1 min-w-0 pr-1 text-left leading-tight no-underline">
        <h4 className="text-xs font-extrabold tracking-tight truncate no-underline">
          {title}
        </h4>
        {message && (
          <p className="text-[10px] font-medium truncate opacity-70 mt-0.5 no-underline">
            {message}
          </p>
        )}
      </div>

      {/* DISMISS BUTTON */}
      <button
        onClick={handleClose}
        type="button"
        className={`p-1 rounded-md transition-colors shrink-0 ${
          isLight
            ? 'text-zinc-500 hover:text-black hover:bg-zinc-100'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
        }`}
        aria-label="Close notification"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
