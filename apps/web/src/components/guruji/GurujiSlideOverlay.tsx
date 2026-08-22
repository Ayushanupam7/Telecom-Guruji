'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Square,
  Play,
  Pause,
  Sparkles,
  MessageSquare,
  GripHorizontal,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Sliders,
  Languages,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { Course, CourseSlide, GurujiAvatarState, GurujiVoiceSettings, Module } from '@signalhub/types';
import { GurujiAvatar } from './GurujiAvatar';
import { GurujiAnimationController } from './GurujiAnimationController';
import { GurujiLipSync } from './GurujiLipSync';
import { GurujiSpeechEngine } from './GurujiSpeechEngine';
import { GurujiContextBuilder } from './GurujiContextBuilder';
import { useLanguage } from '@/context/LanguageContext';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'hinglish', name: 'Hinglish', native: 'Hinglish' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
];

interface GurujiSlideOverlayProps {
  course: Course;
  activeModule: Module;
  activeSlide: CourseSlide;
  allSlidesInModule: CourseSlide[];
  currentSlideIdx: number;
  isCardOpen: boolean;
  onOpenCard: () => void;
}

export function GurujiSlideOverlay({
  course,
  activeModule,
  activeSlide,
  allSlidesInModule,
  currentSlideIdx,
  isCardOpen,
  onOpenCard,
}: GurujiSlideOverlayProps) {
  const { language: siteLanguage, setLanguage: setSiteLanguage } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isToolsCollapsed, setIsToolsCollapsed] = useState(false);

  // Auto-collapse after 10 seconds of inactivity
  const autoCollapseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetAutoCollapseTimer = useCallback(() => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
    }
    // Only auto-collapse if language menu is closed and tools are currently open
    if (!isLangMenuOpen && !isToolsCollapsed) {
      autoCollapseTimerRef.current = setTimeout(() => {
        setIsToolsCollapsed(true);
      }, 10000);
    }
  }, [isLangMenuOpen, isToolsCollapsed]);

  // Handle auto-collapse triggers
  useEffect(() => {
    resetAutoCollapseTimer();
    return () => {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
      }
    };
  }, [resetAutoCollapseTimer]);

  useEffect(() => {
    if (!isToolsCollapsed && !isLangMenuOpen) {
      resetAutoCollapseTimer();
    } else if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
    }
  }, [isToolsCollapsed, isLangMenuOpen, resetAutoCollapseTimer]);

  // 1. Controller & Lip Sync Engine Instances
  const animationController = useMemo(() => new GurujiAnimationController(), []);
  const lipSync = useMemo(
    () =>
      new GurujiLipSync((v) => {
        animationController.setViseme(v);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('guruji-viseme-sync', { detail: { viseme: v } }));
        }
      }),
    [animationController]
  );

  const [voiceSettings, setVoiceSettings] = useState<GurujiVoiceSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tg_guruji_voice_settings');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      language: siteLanguage || 'en',
      voiceId: '',
      speed: 1.0,
      volume: 1.0,
      autoSpeak: true,
    };
  });

  const [speechEngine] = useState<GurujiSpeechEngine>(
    () =>
      new GurujiSpeechEngine(lipSync, {
        onStart: () => {
          setIsSpeaking(true);
          setIsPaused(false);
          animationController.setState('speaking');
        },
        onEnd: () => {
          setIsSpeaking(false);
          setIsPaused(false);
          animationController.setState('idle');
        },
        onPause: () => {
          setIsPaused(true);
          animationController.setState('paused');
        },
        onResume: () => {
          setIsPaused(false);
          animationController.setState('speaking');
        },
        onError: () => {
          setIsSpeaking(false);
          setIsPaused(false);
          animationController.setState('idle');
        },
      })
  );

  // Sync voice settings
  useEffect(() => {
    speechEngine.updateSettings(voiceSettings);
  }, [voiceSettings, speechEngine]);

  // 2. Overlay State
  const [avatarState, setAvatarState] = useState<GurujiAvatarState>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [currentSpeechText, setCurrentSpeechText] = useState<string>('');

  // 3. Draggable State (Smooth Pointer Drag)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const previousSlideIdRef = useRef<string>(activeSlide.id);

  // Subscribe to controller and broadcast state
  useEffect(() => {
    const unsub = animationController.subscribe((s) => {
      setAvatarState(s.state);
    });
    return unsub;
  }, [animationController]);

  // Listen to viseme & state synchronizations from Card 4
  useEffect(() => {
    const handleVisemeSync = (e: any) => {
      if (e.detail?.viseme) {
        animationController.setViseme(e.detail.viseme);
      }
    };
    const handleStateSync = (e: any) => {
      if (e.detail?.state) {
        animationController.setState(e.detail.state);
        setAvatarState(e.detail.state);
      }
      if (e.detail?.lookDirection) {
        animationController.setLookDirection(e.detail.lookDirection);
      }
    };

    window.addEventListener('guruji-viseme-sync', handleVisemeSync);
    window.addEventListener('guruji-state-sync', handleStateSync);
    return () => {
      window.removeEventListener('guruji-viseme-sync', handleVisemeSync);
      window.removeEventListener('guruji-state-sync', handleStateSync);
    };
  }, [animationController]);

  // 4. Slide change handling & Auto-Explanation
  useEffect(() => {
    if (previousSlideIdRef.current !== activeSlide.id) {
      previousSlideIdRef.current = activeSlide.id;

      // Stop active speech on previous slide
      speechEngine.stop();
      setIsSpeaking(false);
      setIsPaused(false);
      animationController.setState('idle');

      // If Guruji is visible and autoSpeak is true (or default on), explain new slide
      if (isVisible && !isCardOpen && voiceSettings.autoSpeak !== false) {
        handleExplainSlide();
      }
    }
  }, [activeSlide.id, isVisible, isCardOpen, voiceSettings.autoSpeak]);

  // Initial Auto-Explanation on mount
  useEffect(() => {
    if (!isCardOpen && voiceSettings.autoSpeak !== false) {
      const timer = setTimeout(() => {
        handleExplainSlide();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // When Card 4 is opened, pause the slide overlay audio so it doesn't collide with Card 4
  useEffect(() => {
    if (isCardOpen) {
      speechEngine.stop();
    }
  }, [isCardOpen]);

  // Sync siteLanguage changes to voice settings and speech engine
  useEffect(() => {
    if (siteLanguage) {
      setVoiceSettings((prev) => ({ ...prev, language: siteLanguage }));
      speechEngine.updateSettings({ language: siteLanguage });
    }
  }, [siteLanguage, speechEngine]);

  // Listen to explanations synchronized from Card 4
  useEffect(() => {
    const handleSync = (e: any) => {
      const { slideId, data } = e.detail || {};
      if (slideId === activeSlide.id && data?.speechText) {
        setCurrentSpeechText(data.speechText);
      }
    };
    window.addEventListener('guruji-explanation-sync', handleSync);
    return () => window.removeEventListener('guruji-explanation-sync', handleSync);
  }, [activeSlide.id]);

  // Listen to speech state synchronizations
  useEffect(() => {
    const handleSpeechSync = (e: any) => {
      if (typeof e.detail?.isSpeaking === 'boolean') {
        setIsSpeaking(e.detail.isSpeaking);
      }
      if (typeof e.detail?.isPaused === 'boolean') {
        setIsPaused(e.detail.isPaused);
      }
    };
    window.addEventListener('guruji-speech-sync', handleSpeechSync);
    return () => window.removeEventListener('guruji-speech-sync', handleSpeechSync);
  }, []);

  // 5. Explain Slide via AI
  const handleExplainSlide = async () => {
    if (isCardOpen) {
      window.dispatchEvent(new CustomEvent('guruji-remote-trigger-explain'));
      return;
    }

    setIsAnalyzing(true);
    speechEngine.stop();
    animationController.setState('thinking');
    animationController.setLookDirection('left_slide');

    const activeLang = voiceSettings.language || siteLanguage || 'en';

    // 1. Check cached explanation first
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(`tg_explanation_${activeSlide.id}_${activeLang}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.speechText) {
            setCurrentSpeechText(parsed.speechText);
            setIsAnalyzing(false);
            if (!isCardOpen) {
              speechEngine.speak(parsed.speechText, activeLang);
            }
            return;
          }
        }
      } catch (e) {}
    }

    try {
      const slideCtx = GurujiContextBuilder.buildSlideContext(
        course,
        activeModule,
        activeSlide,
        allSlidesInModule,
        currentSlideIdx
      );

      const res = await fetch('/api/ai/guruji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain_slide',
          language: activeLang,
          isFirstTime: false,
          slideContext: slideCtx,
        }),
      });

      const data = await res.json();
      if (data.success && data.data && data.data.speechText) {
        setCurrentSpeechText(data.data.speechText);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(`tg_explanation_${activeSlide.id}_${activeLang}`, JSON.stringify(data.data));
            window.dispatchEvent(
              new CustomEvent('guruji-explanation-sync', {
                detail: { slideId: activeSlide.id, language: activeLang, data: data.data },
              })
            );
          } catch (e) {}
        }
        if (!isCardOpen) {
          speechEngine.speak(data.data.speechText, activeLang);
        }
      } else {
        const fallbackMap: Record<string, string> = {
          hi: `यहाँ ${activeSlide.title} है। इस स्लाइड में दिए गए मुख्य घटकों और परिभाषाओं को ध्यान से समझें।`,
          hinglish: `Yeh hai ${activeSlide.title}. Is slide ke core components aur concepts ko dhyan se samajhte hain.`,
          ta: `இது ${activeSlide.title}. இந்த ஸ்லைடில் உள்ள முக்கிய கருத்துக்களை கவனிப்போம்.`,
          te: `ఇది ${activeSlide.title}. ఈ స్లైడ్‌లోని ముఖ్యమైన అంశాలను అర్థం చేసుకుందాం.`,
          kn: `ಇದು ${activeSlide.title}. ಈ ಸ್ಲೈಡ್‌ನಲ್ಲಿರುವ ಮುಖ್ಯ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಗಮನಿಸಿ.`,
          ml: `ഇത് ${activeSlide.title}. ഈ സ്ലൈഡിലെ പ്രധാന ആശയങ്ങൾ നമുക്ക് പഠിക്കാം.`,
          bn: `এটি ${activeSlide.title}। এই স্লাইডের মূল বিষয়গুলি মনোযোগ দিয়ে বুঝুন।`,
          mr: `ही ${activeSlide.title} आहे. या स्लाईडमधील मुख्य घटक काळजीपूर्वक समजून घ्या.`,
          gu: `આ ${activeSlide.title} છે. આ સ્લાઇડના મુખ્ય મુદ્દાઓને સમજીએ.`,
          en: `Here is ${activeSlide.title}. Notice the core components and signal path definitions shown on this slide.`,
        };
        const fallback = fallbackMap[activeLang] || fallbackMap.en;
        setCurrentSpeechText(fallback);
        if (!isCardOpen) {
          speechEngine.speak(fallback, activeLang);
        }
      }
    } catch (err) {
      console.error('Error analyzing slide for overlay:', err);
      animationController.setState('idle');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 6. Stop / Play Controls
  const handleStop = () => {
    if (isCardOpen) {
      window.dispatchEvent(new CustomEvent('guruji-remote-toggle-play'));
      return;
    }
    speechEngine.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    animationController.setState('idle');
  };

  const handlePlayPause = () => {
    if (isCardOpen) {
      window.dispatchEvent(new CustomEvent('guruji-remote-toggle-play'));
      return;
    }

    if (isSpeaking && !isPaused) {
      speechEngine.pause();
    } else if (isPaused) {
      speechEngine.resume();
    } else if (currentSpeechText) {
      speechEngine.speak(currentSpeechText, voiceSettings.language);
    } else {
      handleExplainSlide();
    }
  };

  // 8. Language Change Handler (Changes full app language & AI speech language)
  const handleLanguageChange = (langCode: string) => {
    setSiteLanguage(langCode);
    setVoiceSettings((prev) => {
      const updated = {
        ...prev,
        language: langCode,
      };
      try {
        localStorage.setItem('tg_guruji_voice_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    speechEngine.updateSettings({ language: langCode });
    setIsLangMenuOpen(false);
  };

  // 9. Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag if clicking buttons
    e.preventDefault();
    setIsDragging(true);

    const rect = containerRef.current?.getBoundingClientRect();
    const currentX = rect ? rect.left : window.innerWidth - 260;
    const currentY = rect ? rect.top : window.innerHeight - 340;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentX,
      posY: currentY,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const isSmall = window.innerWidth < 640;
    const maxX = Math.max(10, window.innerWidth - (isSmall ? 140 : 220));
    const maxY = Math.max(50, window.innerHeight - (isSmall ? 160 : 240));
    const newX = Math.max(6, Math.min(maxX, dragStartRef.current.posX + deltaX));
    const newY = Math.max(50, Math.min(maxY, dragStartRef.current.posY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  // If user manually closed overlay
  if (!isVisible) return null;

  // Compute position styles: if dragged, use fixed coordinates; otherwise default dock on right of slide
  const positionStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 45,
      }
    : {
        position: 'absolute',
        right: '8px',
        bottom: '12px',
        zIndex: 25,
      };

  return (
    <div
      ref={containerRef}
      style={positionStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`select-none transition-shadow duration-200 touch-none ${
        isDragging ? 'cursor-grabbing scale-[1.02] opacity-95' : 'cursor-grab'
      }`}
    >
      {/* TRANSPARENT AVATAR STAGE (Nothing on top) */}
      <div className="flex flex-col items-center group relative">
        {/* 2D VECTOR AVATAR CHARACTER (Completely Transparent Background - Mobile & Tablet Responsive) */}
        {!isMinimized && (
          <div className="w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 relative flex items-center justify-center filter drop-shadow-xl transition-transform">
            <GurujiAvatar controller={animationController} avatarState={avatarState} isMini={true} />
          </div>
        )}

        {/* FLOATING QUICK ACTION TOOLS BAR (Bottom with 2s Animated Auto-Collapse) */}
        {isToolsCollapsed ? (
          /* COMPACT COLLAPSED PILL (Ultra-clean view) */
          <div
            className="flex items-center space-x-1 p-1 px-2.5 rounded-full bg-zinc-950/90 dark:bg-zinc-900/90 text-white border border-sky-500/35 shadow-xl backdrop-blur-md mt-1 transition-all duration-300 ease-in-out hover:border-sky-400 hover:bg-zinc-950 animate-in fade-in zoom-in-95"
            onMouseEnter={() => {
              if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current);
            }}
          >
            {/* Drag Handle */}
            <div className="flex items-center px-0.5 text-sky-400 cursor-grab active:cursor-grabbing select-none" title="Drag to move Guruji">
              <GripHorizontal className="w-3.5 h-3.5 opacity-80" />
              {isSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />}
            </div>

            {/* Quick Re-Analyse Button */}
            <button
              type="button"
              onClick={handleExplainSlide}
              disabled={isAnalyzing}
              className="p-1 rounded-full text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition cursor-pointer disabled:opacity-50"
              title="Re-analyse and explain this slide"
            >
              <Sparkles className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </button>

            {/* Quick Play/Pause */}
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-1 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              title={isSpeaking && !isPaused ? 'Pause' : 'Play'}
            >
              {isSpeaking && !isPaused ? <Pause className="w-3 h-3 text-sky-400" /> : <Play className="w-3 h-3" />}
            </button>

            {/* Reveal Arrow Button */}
            <button
              type="button"
              onClick={() => setIsToolsCollapsed(false)}
              className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[10px] font-semibold transition cursor-pointer"
              title="Reveal Full Tools Bar"
            >
              <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[9px] uppercase tracking-wide font-bold">Tools</span>
            </button>
          </div>
        ) : (
          /* FULL FLOATING QUICK ACTION TOOLS BAR (Animated) */
          <div
            className="flex items-center space-x-1 p-1 px-1.5 rounded-xl bg-zinc-950/95 dark:bg-zinc-900/95 text-white border border-sky-500/35 shadow-2xl backdrop-blur-md mt-1 transition-all duration-300 ease-in-out group-hover:border-sky-400 animate-in fade-in zoom-in-95"
            onMouseEnter={() => {
              if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current);
            }}
            onMouseLeave={() => {
              resetAutoCollapseTimer();
            }}
          >
            {/* Drag Handle */}
            <div className="flex items-center px-1 text-sky-400 cursor-grab active:cursor-grabbing select-none" title="Drag to move Guruji">
              <GripHorizontal className="w-3.5 h-3.5 opacity-80" />
              {isSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />}
            </div>

            {/* Full App Language Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold transition cursor-pointer"
                title="Change App & AI Voice Language"
              >
                <Languages className="w-3.5 h-3.5 text-sky-400" />
                <span className="uppercase">{siteLanguage || 'en'}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-80" />
              </button>

              {/* Language Selection Popup Menu */}
              {isLangMenuOpen && (
                <div
                  className="absolute bottom-full left-0 mb-2 w-48 max-h-56 overflow-y-auto rounded-xl bg-zinc-950/95 dark:bg-zinc-900/95 text-white border border-sky-500/40 shadow-2xl backdrop-blur-xl p-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
                    <span>App & AI Language</span>
                    <Languages className="w-3 h-3 text-sky-400" />
                  </div>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => handleLanguageChange(l.code)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] text-left transition cursor-pointer ${
                        siteLanguage === l.code
                          ? 'bg-sky-500/20 text-sky-300 font-bold'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <span>{l.native} <span className="text-[9px] opacity-60">({l.name})</span></span>
                      {siteLanguage === l.code && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-3.5 bg-zinc-700/60 mx-0.5" />

            {/* Stop Button */}
            <button
              type="button"
              onClick={handleStop}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
              title="Stop Speech"
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            {/* Play / Pause Button */}
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition shadow-sm cursor-pointer"
              title={isSpeaking && !isPaused ? 'Pause Speech' : 'Play / Explain'}
            >
              {isSpeaking && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Small Analyse Button */}
            <button
              type="button"
              onClick={handleExplainSlide}
              disabled={isAnalyzing}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/35 text-[10px] font-semibold transition disabled:opacity-50 cursor-pointer"
              title="Re-analyse and explain this slide"
            >
              <Sparkles className={`w-3 h-3 text-amber-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? '...' : 'Analyse'}</span>
            </button>

            {/* Open Full Q&A Card Button */}
            <button
              type="button"
              onClick={onOpenCard}
              className="p-1.5 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/20 transition cursor-pointer"
              title="Open Full Guruji Card & Q&A Chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>

            {/* Minimize / Restore Avatar Toggle */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              title={isMinimized ? 'Expand Avatar' : 'Minimize Avatar'}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>

            <div className="w-px h-3.5 bg-zinc-700/60 mx-0.5" />

            {/* Collapse Arrow Button */}
            <button
              type="button"
              onClick={() => setIsToolsCollapsed(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-300 hover:bg-zinc-800 transition cursor-pointer"
              title="Collapse Tools Bar for Clean View"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
