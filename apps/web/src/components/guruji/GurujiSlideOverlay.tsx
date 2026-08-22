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
  Check,
  Power,
  Moon
} from 'lucide-react';
import { Course, CourseSlide, GurujiAvatarState, GurujiVoiceSettings, Module } from '@signalhub/types';
import { GurujiAvatar } from './GurujiAvatar';
import { GurujiAnimationController } from './GurujiAnimationController';
import { GurujiLipSync } from './GurujiLipSync';
import { GurujiSpeechEngine } from './GurujiSpeechEngine';
import { GurujiContextBuilder } from './GurujiContextBuilder';
import { GurujiVoiceSettingsModal } from './GurujiVoiceSettingsModal';
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

/**
 * Composes a complete spoken teaching lesson script including:
 * 1. Key Lesson Breakdown (Main Explanation)
 * 2. Core Takeaways (All Bullet Points)
 * 3. Real-World Industry Scenario / Example
 * 4. Exam / Technical Interview Tip
 */
export function buildFullSpokenLesson(
  data: {
    speechText?: string;
    bulletPoints?: string[];
    practicalExample?: string;
    examTip?: string;
  },
  lang: string = 'en'
): string {
  if (!data) return '';
  const parts: string[] = [];

  // 1. Key Lesson Breakdown
  if (data.speechText?.trim()) {
    parts.push(data.speechText.trim());
  }

  // 2. Core Takeaways (Bullet Points)
  if (data.bulletPoints && data.bulletPoints.length > 0) {
    const validPoints = data.bulletPoints.filter(Boolean);
    if (validPoints.length > 0) {
      const introMap: Record<string, string> = {
        hi: 'अब इसके मुख्य बिंदुओं को समझें:',
        hinglish: 'Ab iske core takeaways dekhte hain:',
        ta: 'முக்கிய குறிப்புகள்:',
        te: 'ముఖ్యమైన అంశాలు:',
        kn: 'ಮುಖ್ಯ ಅಂಶಗಳು:',
        ml: 'പ്രധാന ആശയങ്ങൾ:',
        bn: 'মূল বিষয়বস্তু:',
        mr: 'महत्त्वाचे मुद्दे:',
        gu: 'મુખ્ય મુદ્દાઓ:',
        en: 'Here are the key takeaways for this lesson:',
      };
      const intro = introMap[lang] || introMap.en;
      parts.push(`${intro} ${validPoints.join('. ')}.`);
    }
  }

  // 3. Real-World Industry Scenario
  if (data.practicalExample?.trim()) {
    const exampleMap: Record<string, string> = {
      hi: 'वास्तविक उदाहरण:',
      hinglish: 'Real-world industry scenario ki baat karein toh:',
      ta: 'நடைமுறை உதாரணம்:',
      te: 'వాస్తవ ఉదాహరణ:',
      kn: 'ನೈಜ ಜಗತ್ತಿನ ಉದಾಹರಣೆ:',
      ml: 'പ്രായോഗിക ഉദാഹരണം:',
      bn: 'বাস্তব উদাহরণ:',
      mr: 'प्रत्यक्ष उदाहरण:',
      gu: 'વાસ્તવિક ઉદાહરણ:',
      en: 'In a real-world industry scenario:',
    };
    const exampleIntro = exampleMap[lang] || exampleMap.en;
    parts.push(`${exampleIntro} ${data.practicalExample.trim()}`);
  }

  // 4. Exam / Technical Interview Tip
  if (data.examTip?.trim()) {
    const tipMap: Record<string, string> = {
      hi: 'और परीक्षा या इंटरव्यू के लिए विशेष सुझाव:',
      hinglish: 'Aur exam ya interview ke liye crucial tip:',
      ta: 'தேர்வு மற்றும் நேர்காணல் குறிப்பு:',
      te: 'పరీక్ష మరియు ఇంటర్వ్యూ చిట్కా:',
      kn: 'ಪರೀಕ್ಷೆ ಮತ್ತು ಸಂದರ್ಶನದ ಸಲಹೆ:',
      ml: 'പരീക്ഷാ ടിപ്പ്:',
      bn: 'পরীক্ষা বা ইন্টারভিউ টিপ:',
      mr: 'परीक्षा आणि मुलाखतीसाठी टीप:',
      gu: 'પરીક્ષા અને ઇન્ટરવ્યુ માટે ટિપ:',
      en: 'And for your exams or technical interviews:',
    };
    const tipIntro = tipMap[lang] || tipMap.en;
    parts.push(`${tipIntro} ${data.examTip.trim()}`);
  }

  return parts.join(' ');
}

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
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Student preference to turn off / snooze AI scanning and auto-speaking
  const [isAiDisabled, setIsAiDisabled] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('tg_guruji_ai_enabled') === 'false';
      } catch (e) {}
    }
    return false;
  });

  const handleToggleAi = (disable: boolean) => {
    setIsAiDisabled(disable);
    try {
      localStorage.setItem('tg_guruji_ai_enabled', disable ? 'false' : 'true');
    } catch (e) {}

    if (disable) {
      speechEngine.stop();
      setIsAnalyzing(false);
      setIsSpeaking(false);
      setIsPaused(false);
      animationController.setState('idle');
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    } else {
      setTimeout(() => {
        handleExplainSlide();
      }, 200);
    }
  };

  // Sync settings with other components or test voice triggers
  useEffect(() => {
    const handleSettingsSync = (e: any) => {
      if (e.detail?.settings) {
        setVoiceSettings(e.detail.settings);
        speechEngine.updateSettings(e.detail.settings);
      }
    };
    const handleTestVoice = (e: any) => {
      if (e.detail?.text) {
        speechEngine.speak(e.detail.text, e.detail.lang || voiceSettings.language);
      }
    };
    window.addEventListener('guruji-settings-sync', handleSettingsSync);
    window.addEventListener('guruji-test-voice', handleTestVoice);
    return () => {
      window.removeEventListener('guruji-settings-sync', handleSettingsSync);
      window.removeEventListener('guruji-test-voice', handleTestVoice);
    };
  }, [speechEngine, voiceSettings.language]);

  // SHUT OFF SPEECH WHEN CLOSING COURSE / LEAVING PAGE / UNMOUNTING
  useEffect(() => {
    const handleStopAll = () => {
      speechEngine.stop();
      setIsSpeaking(false);
      setIsPaused(false);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    };

    window.addEventListener('guruji-stop-all-speech', handleStopAll);
    window.addEventListener('beforeunload', handleStopAll);
    window.addEventListener('pagehide', handleStopAll);
    window.addEventListener('popstate', handleStopAll);

    return () => {
      window.removeEventListener('guruji-stop-all-speech', handleStopAll);
      window.removeEventListener('beforeunload', handleStopAll);
      window.removeEventListener('pagehide', handleStopAll);
      window.removeEventListener('popstate', handleStopAll);
      handleStopAll();
    };
  }, [speechEngine]);

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

  // Subscribe to controller
  useEffect(() => {
    const unsub = animationController.subscribe((s) => {
      setAvatarState(s.state);
    });
    return unsub;
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

      // If Guruji is visible, not disabled by student, and autoSpeak is on, explain new slide
      if (isVisible && !isAiDisabled && voiceSettings.autoSpeak !== false) {
        handleExplainSlide();
      }
    }
  }, [activeSlide.id, isVisible, isAiDisabled, voiceSettings.autoSpeak]);

  // Initial Auto-Explanation on mount
  useEffect(() => {
    if (!isAiDisabled && voiceSettings.autoSpeak !== false) {
      const timer = setTimeout(() => {
        handleExplainSlide();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isAiDisabled]);

  // Sync siteLanguage changes to voice settings and speech engine
  useEffect(() => {
    if (siteLanguage) {
      setVoiceSettings((prev) => ({ ...prev, language: siteLanguage }));
      speechEngine.updateSettings({ language: siteLanguage });
    }
  }, [siteLanguage, speechEngine]);

  // Sync explanation text without interrupting ongoing speech
  useEffect(() => {
    const handleSync = (e: any) => {
      const { slideId, data, language } = e.detail || {};
      if (slideId === activeSlide.id && data) {
        const fullSpeech = buildFullSpokenLesson(data, language || voiceSettings.language || siteLanguage || 'en');
        setCurrentSpeechText(fullSpeech);
      }
    };

    window.addEventListener('guruji-explanation-sync', handleSync);
    return () => {
      window.removeEventListener('guruji-explanation-sync', handleSync);
    };
  }, [activeSlide.id, voiceSettings.language, siteLanguage]);

  // 5. Explain Slide via AI (Floating Avatar is the Sole Audio Speaker)
  const handleExplainSlide = async () => {
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
          if (parsed) {
            const fullSpeech = buildFullSpokenLesson(parsed, activeLang);
            if (fullSpeech) {
              setCurrentSpeechText(fullSpeech);
              setIsAnalyzing(false);
              speechEngine.speak(fullSpeech, activeLang);
              return;
            }
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
      if (data.success && data.data) {
        const fullSpeech = buildFullSpokenLesson(data.data, activeLang);
        setCurrentSpeechText(fullSpeech);
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
        speechEngine.speak(fullSpeech, activeLang);
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
        const fallbackObj = {
          speechText: fallbackMap[activeLang] || fallbackMap.en,
          bulletPoints: [`Key Topic: ${activeSlide.title}`, `Review module definitions and parameters.`],
          practicalExample: `Standard production deployment in modern high-availability networks.`,
          examTip: `Remember the key definitions and state transitions for assessments.`,
        };
        const fullSpeech = buildFullSpokenLesson(fallbackObj, activeLang);
        setCurrentSpeechText(fullSpeech);
        speechEngine.speak(fullSpeech, activeLang);
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
    speechEngine.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    animationController.setState('idle');
  };

  const handlePlayPause = () => {
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

  // If student turned off / snoozed AI Guruji, show unobtrusive wake-up badge at top-right of card
  if (isAiDisabled) {
    return (
      <div className="absolute top-16 right-4 z-40 animate-in fade-in slide-in-from-top-2 duration-300">
        <button
          type="button"
          onClick={() => handleToggleAi(false)}
          className="flex items-center space-x-2.5 px-4 py-2 rounded-full bg-zinc-950/90 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-700 shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
          title="Guruji AI is currently off. Click to turn on AI auto-scanning and teaching."
        >
          <span className="text-base">👨‍🏫</span>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-zinc-300 flex items-center space-x-1.5">
              <span>Guruji AI</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-medium">Off</span>
            </span>
          </div>
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition">
            <span>Turn On</span>
            <span>⚡</span>
          </span>
        </button>
      </div>
    );
  }

  // If user manually closed overlay
  if (!isVisible) return null;

  // Compute position styles: if dragged, use fixed coordinates; otherwise default dock on top right of slide card
  const positionStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 45,
      }
    : {
        position: 'absolute',
        right: '16px',
        top: '60px',
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

        {/* UNIFIED MORPHING FLOATING QUICK ACTION TOOLS (Fluid Dynamic Spring Morph) */}
        <div
          className={`w-56 sm:w-60 overflow-hidden rounded-3xl bg-zinc-950/95 dark:bg-zinc-900/95 text-white border border-sky-500/40 shadow-2xl backdrop-blur-xl mt-2 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-sky-400 ${
            isToolsCollapsed
              ? 'max-h-[48px] p-1.5 px-3'
              : 'max-h-[175px] p-2.5 space-y-2'
          }`}
          onMouseEnter={() => {
            if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current);
          }}
          onMouseLeave={() => {
            if (!isToolsCollapsed) resetAutoCollapseTimer();
          }}
        >
          {/* Top Row: Always Visible, Smoothly Transitions */}
          <div className="flex items-center justify-between">
            {/* Drag Handle */}
            <div className="flex items-center px-1 text-sky-400 cursor-grab active:cursor-grabbing select-none" title="Drag to move Guruji">
              <GripHorizontal className="w-4 h-4 opacity-90" />
              {isSpeaking && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1.5" />}
            </div>

            {/* In Collapsed state: Quick Actions directly inline */}
            {isToolsCollapsed ? (
              <div className="flex items-center space-x-1.5">
                {/* Quick Re-Analyse Button */}
                <button
                  type="button"
                  onClick={handleExplainSlide}
                  disabled={isAnalyzing}
                  className="p-1.5 rounded-full text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
                  title="Re-analyse and explain this slide"
                >
                  <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                </button>

                {/* Quick Play/Pause */}
                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="p-1.5 rounded-full text-zinc-200 hover:text-white hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
                  title={isSpeaking && !isPaused ? 'Pause' : 'Play'}
                >
                  {isSpeaking && !isPaused ? <Pause className="w-4 h-4 text-sky-400" /> : <Play className="w-4 h-4" />}
                </button>

                {/* Voice Settings Button */}
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-sky-300 hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
                  title="Guruji Voice & AI Settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>

                {/* Reveal Arrow Button */}
                <button
                  type="button"
                  onClick={() => setIsToolsCollapsed(false)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold active:scale-95 transition cursor-pointer shadow-xs"
                  title="Expand Tools Bar Downward"
                >
                  <ChevronDown className="w-4 h-4 text-sky-400" />
                  <span className="text-[11px] sm:text-xs uppercase tracking-wide font-extrabold">Tools</span>
                </button>
              </div>
            ) : (
              /* In Expanded state: Top row has Language selector + Settings button + Collapse button */
              <div className="flex items-center space-x-1.5">
                {/* Language Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition cursor-pointer active:scale-95"
                    title="Change App & AI Voice Language"
                  >
                    <Languages className="w-3.5 h-3.5 text-sky-400" />
                    <span className="uppercase">{siteLanguage || 'en'}</span>
                    <ChevronDown className="w-3 h-3 opacity-80" />
                  </button>

                  {/* Language Selection Popup Menu */}
                  {isLangMenuOpen && (
                    <div
                      className="absolute top-full right-0 mt-2 w-52 max-h-52 overflow-y-auto rounded-2xl bg-zinc-950/95 dark:bg-zinc-900/95 text-white border border-sky-500/40 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
                        <span>App & AI Language</span>
                        <Languages className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => handleLanguageChange(l.code)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition cursor-pointer ${
                            siteLanguage === l.code
                              ? 'bg-sky-500/20 text-sky-300 font-bold'
                              : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                          }`}
                        >
                          <span>{l.native} <span className="text-[10px] opacity-60">({l.name})</span></span>
                          {siteLanguage === l.code && <Check className="w-4 h-4 text-sky-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Voice Settings Button */}
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="p-1 rounded-full text-zinc-400 hover:text-sky-300 hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
                  title="Guruji Voice & AI Settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>

                {/* Collapse Button */}
                <button
                  type="button"
                  onClick={() => setIsToolsCollapsed(true)}
                  className="p-1 rounded-full text-zinc-400 hover:text-sky-300 hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
                  title="Collapse Tools Bar Upward"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Expanded Drawer Rows (Smooth Animated Height Reveal) */}
          {!isToolsCollapsed && (
            <div className="space-y-1.5 pt-1.5 border-t border-zinc-800/80 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Row 2: Play/Pause Primary Action + Re-Analyse + Stop */}
              <div className="grid grid-cols-3 gap-1.5">
                {/* Play / Pause Button */}
                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="flex items-center justify-center space-x-1 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  title={isSpeaking && !isPaused ? 'Pause Speech' : 'Play / Explain'}
                >
                  {isSpeaking && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isSpeaking && !isPaused ? 'Pause' : 'Play'}</span>
                </button>

                {/* Analyse Button */}
                <button
                  type="button"
                  onClick={handleExplainSlide}
                  disabled={isAnalyzing}
                  className="flex items-center justify-center space-x-1 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/35 text-xs font-bold transition disabled:opacity-50 cursor-pointer active:scale-95 shadow-xs"
                  title="Re-analyse and explain this slide"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? '...' : 'Analyse'}</span>
                </button>

                {/* Stop Button */}
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex items-center justify-center space-x-1 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-red-400 active:scale-95 text-xs font-bold transition cursor-pointer"
                  title="Stop Speech"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              </div>

              {/* Row 3: Open Card (Ask Question) & Turn Off AI (Stop scanning) */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={onOpenCard}
                  className="flex items-center justify-center space-x-1.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-300 text-xs font-bold active:scale-95 transition cursor-pointer"
                  title="Open Full Guruji Card & Q&A Chat"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleAi(true)}
                  className="flex items-center justify-center space-x-1.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-bold active:scale-95 transition cursor-pointer"
                  title="Stop AI scanning and turn off Guruji for quiet study"
                >
                  <Power className="w-3.5 h-3.5 text-red-400" />
                  <span>Turn Off AI</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VOICE & AI SETTINGS MODAL */}
      <GurujiVoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        settings={voiceSettings}
        availableVoices={speechEngine.getAvailableVoices()}
        onSave={(newSettings) => {
          setVoiceSettings(newSettings);
          speechEngine.updateSettings(newSettings);
          try {
            localStorage.setItem('tg_guruji_voice_settings', JSON.stringify(newSettings));
          } catch (e) {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('guruji-settings-sync', { detail: { settings: newSettings } }));
          }
        }}
        onTestVoice={(text, lang) => speechEngine.speak(text, lang)}
      />
    </div>
  );
}
