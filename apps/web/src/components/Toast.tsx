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

  const styleConfig = {
    success: {
      container: isLight
        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 shadow-emerald-900/10'
        : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/80',
      badge: 'bg-emerald-600 text-white',
      title: 'text-emerald-900 dark:text-emerald-100',
      message: 'text-emerald-700 dark:text-emerald-300',
      close: 'text-emerald-600 hover:bg-emerald-200/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50',
    },
    warning: {
      container: isLight
        ? 'bg-red-500/10 border-red-500/40 text-red-950 shadow-red-500/10'
        : 'bg-red-950/90 border-red-500/50 text-red-100 shadow-red-950/80',
      badge: 'bg-red-600 text-white animate-pulse',
      title: 'text-red-900 dark:text-red-100',
      message: 'text-red-700 dark:text-red-300',
      close: 'text-red-600 hover:bg-red-200/50 dark:text-red-400 dark:hover:bg-red-900/50',
    },
    error: {
      container: isLight
        ? 'bg-red-500/10 border-red-500/40 text-red-950 shadow-red-500/10'
        : 'bg-red-950/90 border-red-500/50 text-red-100 shadow-red-950/80',
      badge: 'bg-red-600 text-white',
      title: 'text-red-900 dark:text-red-100',
      message: 'text-red-700 dark:text-red-300',
      close: 'text-red-600 hover:bg-red-200/50 dark:text-red-400 dark:hover:bg-red-900/50',
    },
    info: {
      container: isLight
        ? 'bg-sky-500/10 border-sky-500/40 text-sky-950 shadow-sky-500/10'
        : 'bg-sky-950/90 border-sky-500/50 text-sky-100 shadow-sky-950/80',
      badge: 'bg-sky-600 text-white',
      title: 'text-sky-900 dark:text-sky-100',
      message: 'text-sky-700 dark:text-sky-300',
      close: 'text-sky-600 hover:bg-sky-200/50 dark:text-sky-400 dark:hover:bg-sky-900/50',
    },
  }[type] || {
    container: isLight
      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 shadow-emerald-500/10'
      : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/80',
    badge: 'bg-emerald-600 text-white',
    title: 'text-emerald-900 dark:text-emerald-100',
    message: 'text-emerald-700 dark:text-emerald-300',
    close: 'text-emerald-600 hover:bg-emerald-200/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50',
  };

  return (
    <div
      className={`w-[260px] sm:w-[280px] pointer-events-auto relative flex items-center space-x-2.5 px-3.5 py-3 rounded-2xl border shadow-2xl transition-all duration-200 ease-in-out backdrop-blur-md ${isExiting
          ? 'opacity-0 translate-x-6 scale-95'
          : 'opacity-100 translate-x-0 scale-100 animate-in fade-in slide-in-from-right-6'
        } ${styleConfig.container}`}
      role="alert"
    >
      {/* BADGE ICON */}
      <div className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center shadow-xs ${styleConfig.badge}`}>
        <IconComponent className="w-4 h-4" />
      </div>

      {/* TEXT CONTENT */}
      <div className="flex-1 min-w-0 pr-1 text-left leading-tight">
        <h4 className={`text-xs font-black tracking-tight truncate ${styleConfig.title}`}>
          {title}
        </h4>
        {message && (
          <p className={`text-[11px] font-semibold line-clamp-2 mt-0.5 leading-snug ${styleConfig.message}`}>
            {message}
          </p>
        )}
      </div>

      {/* DISMISS BUTTON */}
      <button
        onClick={handleClose}
        type="button"
        className={`p-1 rounded-lg transition-colors shrink-0 ${styleConfig.close}`}
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
