'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const showToast = useCallback(({ title, message, type = 'success', duration = 3500 }: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, title, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* 🎯 RIGHT-ALIGNED COMPACT NOTIFICATION TOAST CONTAINER 🎯 */}
      <div
        className="fixed top-20 right-3 sm:right-5 z-[9999] flex flex-col items-end space-y-2 max-w-[260px] w-full pointer-events-none font-sans"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const type = toast.type || 'success';
          const durationMs = toast.duration || 3500;

          return (
            <div
              key={toast.id}
              className={`w-full pointer-events-auto relative overflow-hidden flex items-center space-x-2 px-3 py-2 rounded-xl border backdrop-blur-xl shadow-lg transition-all transform animate-in fade-in slide-in-from-right-6 duration-300 ${
                isLight
                  ? type === 'success'
                    ? 'bg-white/95 border-emerald-500/40 text-black shadow-zinc-200'
                    : type === 'error'
                    ? 'bg-white/95 border-rose-500/40 text-black shadow-zinc-200'
                    : type === 'warning'
                    ? 'bg-white/95 border-amber-500/40 text-black shadow-zinc-200'
                    : 'bg-white/95 border-sky-500/40 text-black shadow-zinc-200'
                  : type === 'success'
                  ? 'bg-black/95 border-emerald-500/40 text-white shadow-black/90'
                  : type === 'error'
                  ? 'bg-black/95 border-rose-500/40 text-white shadow-black/90'
                  : type === 'warning'
                  ? 'bg-black/95 border-amber-500/40 text-white shadow-black/90'
                  : 'bg-black/95 border-sky-500/40 text-white shadow-black/90'
              }`}
            >
              {/* MINIMAL ICON BADGE */}
              <div className="shrink-0">
                {type === 'success' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
                {type === 'error' && (
                  <div className="w-6 h-6 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                )}
                {type === 'warning' && (
                  <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                )}
                {type === 'info' && (
                  <div className="w-6 h-6 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/30">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* COMPACT MESSAGE TEXT */}
              <div className="flex-1 min-w-0 pr-1 leading-tight text-left">
                <h4 className={`text-xs font-bold tracking-tight truncate ${isLight ? 'text-black' : 'text-white'}`}>
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className={`text-[10px] truncate ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {toast.message}
                  </p>
                )}
              </div>

              {/* DISMISS BUTTON */}
              <button
                onClick={() => removeToast(toast.id)}
                type="button"
                className={`p-1 rounded-lg transition-colors shrink-0 ${
                  isLight ? 'text-zinc-400 hover:text-black hover:bg-zinc-100' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                }`}
                aria-label="Close notification"
              >
                <X className="w-3 h-3" />
              </button>

              {/* MICRO SHRINKING PROGRESS BAR AT BOTTOM */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-200/30 dark:bg-zinc-800/30">
                <div
                  className={`h-full animate-toast-progress ${
                    type === 'success'
                      ? 'bg-emerald-500'
                      : type === 'error'
                      ? 'bg-rose-500'
                      : type === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-sky-500'
                  }`}
                  style={{ animationDuration: `${durationMs}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
