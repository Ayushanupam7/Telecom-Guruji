'use client';

import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Laptop,
  AlertTriangle,
  X,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Layers,
  BarChart2
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function InstructorMobileWarning() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Check screen width (< 1024px) or mobile/tablet user agent
      const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 1024;
      const isMobileUA =
        typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      const mobileDetected = isSmallScreen || isMobileUA;
      setIsMobile(mobileDetected);

      // Check session storage if previously dismissed in this session
      const previouslyDismissed =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('instructor_screen_warning_dismissed') === 'true';

      if (mobileDetected && !previouslyDismissed) {
        setShowModal(true);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleDismissModal = () => {
    setShowModal(false);
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('instructor_screen_warning_dismissed', 'true');
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!isMobile) return null;

  return (
    <>
      {/* 1. TOP MOBILE BANNER (Visible on small screens) */}
      <aside
        aria-label="Screen resolution recommendation"
        className={`lg:hidden w-full px-4 py-2 text-xs border-b flex items-center justify-between gap-3 ${
          isLight
            ? 'bg-amber-50/90 text-amber-950 border-amber-200'
            : 'bg-amber-950/30 text-amber-300 border-amber-800/40'
        }`}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <Monitor className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="truncate font-medium">
            <strong className="font-bold">PC / Laptop Recommended:</strong> For best course authoring & slide editing.
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="text-[11px] font-black underline uppercase tracking-wider shrink-0 cursor-pointer hover:opacity-80"
        >
          Details
        </button>
      </aside>

      {/* 2. FULL MODAL WARNING POPUP */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-warning-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            className={`relative w-full max-w-lg rounded-3xl border p-6 sm:p-8 shadow-2xl ${
              isLight ? 'bg-white border-zinc-200 text-black' : 'bg-zinc-950 border-zinc-800 text-white'
            }`}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismissModal}
              className="absolute right-5 top-5 p-2 rounded-2xl text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Banner */}
            <div className="flex items-center space-x-3 mb-5">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Laptop className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                  Display Recommendation
                </span>
                <h2 id="mobile-warning-title" className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                  Larger Screen Recommended
                </h2>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3 mb-6">
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                The <strong>Telecom Guruji Instructor Studio</strong> & <strong>Course Creator</strong> are built for larger desktop, laptop, or tablet landscape screens.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                While you can view your dashboard on mobile, advanced authoring tools like the multi-block slide builder, quiz configuration, and telemetry graphs work best with full screen real estate.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              <div className={`p-3 rounded-2xl border text-center ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
                <Layers className="w-4 h-4 mx-auto mb-1 text-sky-500" />
                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block">Slide Studio</span>
              </div>
              <div className={`p-3 rounded-2xl border text-center ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
                <Sparkles className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block">AI Authoring</span>
              </div>
              <div className={`p-3 rounded-2xl border text-center ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
                <BarChart2 className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block">Analytics</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`w-full py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : isLight
                    ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Link Copied! Open on your PC/Laptop</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-400" />
                    <span>Copy Studio Link to Open on Laptop</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDismissModal}
                className="w-full py-3.5 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider hover:opacity-90 transition active:scale-95 shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Continue on Mobile Anyway</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
