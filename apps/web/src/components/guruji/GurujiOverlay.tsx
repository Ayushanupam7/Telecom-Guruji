'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  Mic,
  MicOff,
  Sparkles,
  BookOpen,
  Send,
  Sliders,
  Maximize2,
  Minimize2,
  MessageSquare,
  ChevronDown,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Award,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { Course, CourseSlide, GurujiAvatarState, GurujiContextMode, GurujiMessage, GurujiVoiceSettings, Module } from '@signalhub/types';
import { GurujiAnimationController } from './GurujiAnimationController';
import { GurujiLipSync } from './GurujiLipSync';
import { GurujiSpeechEngine } from './GurujiSpeechEngine';
import { GurujiContextBuilder } from './GurujiContextBuilder';
import { GurujiVoiceSettingsModal } from './GurujiVoiceSettingsModal';
import { GurujiCourseScanModal } from './GurujiCourseScanModal';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

interface GurujiOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  activeModule: Module;
  activeSlide: CourseSlide;
  allSlidesInModule: CourseSlide[];
  currentSlideIdx: number;
  isMaximized?: boolean;
}

export function GurujiOverlay({
  isOpen,
  onClose,
  course,
  activeModule,
  activeSlide,
  allSlidesInModule,
  currentSlideIdx,
  isMaximized = false,
}: GurujiOverlayProps) {
  const { language: siteLanguage } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // 1. Controller & Engine Instances (Persisted across renders)
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
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('guruji-speech-sync', { detail: { isSpeaking: true, isPaused: false } }));
          }
        },
        onEnd: () => {
          setIsSpeaking(false);
          setIsPaused(false);
          animationController.setState('idle');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('guruji-speech-sync', { detail: { isSpeaking: false, isPaused: false } }));
          }
        },
        onPause: () => {
          setIsPaused(true);
          animationController.setState('paused');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('guruji-speech-sync', { detail: { isSpeaking: true, isPaused: true } }));
          }
        },
        onResume: () => {
          setIsPaused(false);
          animationController.setState('speaking');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('guruji-speech-sync', { detail: { isSpeaking: true, isPaused: false } }));
          }
        },
        onError: () => {
          setIsSpeaking(false);
          setIsPaused(false);
          animationController.setState('idle');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('guruji-speech-sync', { detail: { isSpeaking: false, isPaused: false } }));
          }
        },
        onListeningStateChange: (listening) => {
          setIsListening(listening);
          if (listening) {
            animationController.setState('listening');
          } else {
            animationController.setState('idle');
          }
        },
        onListeningResult: (transcript) => {
          if (transcript) {
            handleSendQuestion(transcript);
          }
        },
      })
  );

  // Sync siteLanguage changes to voice settings and speech engine
  useEffect(() => {
    if (siteLanguage) {
      setVoiceSettings((prev) => ({ ...prev, language: siteLanguage }));
      speechEngine.updateSettings({ language: siteLanguage });
    }
  }, [siteLanguage, speechEngine]);

  // Sync settings to engine
  useEffect(() => {
    speechEngine.updateSettings(voiceSettings);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tg_guruji_voice_settings', JSON.stringify(voiceSettings));
      } catch (e) {}
    }
  }, [voiceSettings, speechEngine]);

  // 2. UI & Interaction States
  const [avatarState, setAvatarState] = useState<GurujiAvatarState>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isFirstOpenInSession, setIsFirstOpenInSession] = useState(true);

  // Current Slide Explanation Data
  const [currentExplanation, setCurrentExplanation] = useState<{
    speechText: string;
    bulletPoints?: string[];
    practicalExample?: string;
    examTip?: string;
  } | null>(null);

  // Q&A and Context Mode States
  const [contextMode, setContextMode] = useState<GurujiContextMode>('slide');
  const [chatMessages, setChatMessages] = useState<GurujiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'explanation' | 'chat'>('explanation');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [courseKnowledge, setCourseKnowledge] = useState<any>(() =>
    GurujiContextBuilder.getCachedCourseKnowledge(course.id)
  );

  const chatEndRef = useRef<HTMLDivElement>(null);
  const previousSlideIdRef = useRef<string>(activeSlide.id);

  // Subscribe to controller state changes & broadcast to floating avatar
  useEffect(() => {
    const unsub = animationController.subscribe((s) => {
      setAvatarState(s.state);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('guruji-state-sync', {
            detail: { state: s.state, gesture: s.gesture, lookDirection: s.lookDirection },
          })
        );
      }
    });
    return unsub;
  }, [animationController]);

  // 3. CINEMATIC WALK-IN LIFECYCLE WHEN OPENED
  useEffect(() => {
    let timer1: any;
    let timer2: any;
    let timer3: any;

    if (isOpen) {
      // Phase 1: Start walking in
      animationController.setState('walking');

      // Phase 2: Walk in takes 1.1s -> arrive & settle
      timer1 = setTimeout(() => {
        animationController.setState('arriving');
        // Phase 3: Settle & turn towards slide
        timer2 = setTimeout(() => {
          animationController.setState('idle');
          animationController.setLookDirection('left_slide');

          // Phase 4: Automatically explain current slide
          timer3 = setTimeout(() => {
            handleExplainCurrentSlide(isFirstOpenInSession);
            setIsFirstOpenInSession(false);
          }, 350);
        }, 300);
      }, 1000);
    } else {
      speechEngine.stop();
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen]);

  // 4. SLIDE CHANGE HANDLER (Auto stop audio & sync new slide)
  useEffect(() => {
    if (previousSlideIdRef.current !== activeSlide.id) {
      previousSlideIdRef.current = activeSlide.id;

      // Stop any speech on previous slide
      speechEngine.stop();
      setIsSpeaking(false);
      setIsPaused(false);
      animationController.setState('idle');

      if (isOpen) {
        if (voiceSettings.autoSpeak) {
          handleExplainCurrentSlide(false);
        } else {
          setCurrentExplanation(null);
        }
      }
    }
  }, [activeSlide.id, isOpen, voiceSettings.autoSpeak]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Listen to explanations synchronized from Floating Overlay
  useEffect(() => {
    const handleSync = (e: any) => {
      const { slideId, data } = e.detail || {};
      if (slideId === activeSlide.id && data) {
        setCurrentExplanation(data);
      }
    };
    const handleRemoteToggle = () => {
      if (isSpeaking && !isPaused) {
        speechEngine.pause();
      } else if (isPaused) {
        speechEngine.resume();
      } else if (currentExplanation?.speechText) {
        speechEngine.speak(currentExplanation.speechText, voiceSettings.language);
      } else {
        handleExplainCurrentSlide(false);
      }
    };
    const handleRemoteExplain = () => {
      handleExplainCurrentSlide(false);
    };

    window.addEventListener('guruji-explanation-sync', handleSync);
    window.addEventListener('guruji-remote-toggle-play', handleRemoteToggle);
    window.addEventListener('guruji-remote-trigger-explain', handleRemoteExplain);
    return () => {
      window.removeEventListener('guruji-explanation-sync', handleSync);
      window.removeEventListener('guruji-remote-toggle-play', handleRemoteToggle);
      window.removeEventListener('guruji-remote-trigger-explain', handleRemoteExplain);
    };
  }, [activeSlide.id, isSpeaking, isPaused, currentExplanation, voiceSettings.language, speechEngine]);

  // Collapse with walk-out transition
  const handleInitiateClose = () => {
    speechEngine.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    animationController.setState('exiting');

    setTimeout(() => {
      onClose();
      animationController.setState('idle');
    }, 400);
  };

  // 5. EXPLAIN CURRENT SLIDE
  const handleExplainCurrentSlide = async (firstTime: boolean = false) => {
    setIsLoadingAI(true);
    speechEngine.stop();
    animationController.setState('thinking');

    const activeLang = voiceSettings.language || siteLanguage || 'en';

    // 1. Check cached explanation first
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(`tg_explanation_${activeSlide.id}_${activeLang}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.speechText) {
            setCurrentExplanation(parsed);
            setActiveTab('explanation');
            setIsLoadingAI(false);
            animationController.setState('speaking');
            speechEngine.speak(parsed.speechText, activeLang);
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
          isFirstTime: firstTime,
          slideContext: slideCtx,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCurrentExplanation(data.data);
        setActiveTab('explanation');

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

        // Speak out the explanation
        if (data.data.speechText) {
          speechEngine.speak(data.data.speechText, activeLang);
        }
      } else {
        const activeLang = voiceSettings.language || siteLanguage || 'en';
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
          en: `Let's focus on ${activeSlide.title}. This slide illustrates fundamental architectures in ${activeModule.title}. Review the key diagrams and bullet points carefully.`,
        };
        const fallbackText = fallbackMap[activeLang] || fallbackMap.en;
        setCurrentExplanation({
          speechText: fallbackText,
          bulletPoints: [`Key Topic: ${activeSlide.title}`, `Review module definitions and parameters.`],
        });
        speechEngine.speak(fallbackText, activeLang);
      }
    } catch (err) {
      console.error('Error generating slide explanation:', err);
      animationController.setState('idle');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // 6. SEND QUESTION (Q&A)
  const handleSendQuestion = async (questionText?: string) => {
    const q = (questionText || inputText).trim();
    if (!q) return;

    setInputText('');
    setActiveTab('chat');

    // Add student message to UI
    const userMsg: GurujiMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'student',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contextMode,
      slideId: activeSlide.id,
      slideTitle: activeSlide.title,
    };
    setChatMessages((prev) => [...prev, userMsg]);

    setIsLoadingAI(true);
    speechEngine.stop();
    animationController.setState('thinking');

    try {
      const slideCtx = GurujiContextBuilder.buildSlideContext(
        course,
        activeModule,
        activeSlide,
        allSlidesInModule,
        currentSlideIdx
      );

      const historyPayload = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/guruji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask_question',
          question: q,
          language: voiceSettings.language,
          contextMode,
          slideContext: slideCtx,
          courseKnowledge,
          conversationHistory: historyPayload,
        }),
      });

      const data = await res.json();
      let answer = '';
      if (data.success && data.data) {
        answer = data.data.answerText || data.data;
      } else {
        answer = "I'm reviewing your question against the course content. Make sure to check the slide diagrams and definitions.";
      }

      const gurujiMsg: GurujiMessage = {
        id: `msg-${Date.now()}-guruji`,
        role: 'guruji',
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        contextMode,
      };
      setChatMessages((prev) => [...prev, gurujiMsg]);

      // Speak answer
      speechEngine.speak(answer, voiceSettings.language);
    } catch (err) {
      console.error('Error answering question:', err);
      animationController.setState('idle');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Quick suggestion questions
  const SUGGESTION_CHIPS = [
    'Explain this simply',
    'Give a real-world example',
    'What is the exam takeaway?',
    'Explain the diagram',
  ];

  return (
    <>
      {/* ======================================================================= */}
      {/* CARD 4: RIGHT GURUJI AI AVATAR CARD (INTEGRATED COURSE PLAYER COLUMN) */}
      {/* ======================================================================= */}
      <aside
        className={`
          fixed lg:static inset-y-2 sm:inset-y-3 right-2 sm:right-3 z-50 lg:z-10
          rounded-2xl sm:rounded-3xl border flex flex-col transition-all duration-300 ease-in-out shadow-lg shrink-0 overflow-hidden
          ${isLight ? 'bg-white/95 border-zinc-200/80 shadow-zinc-200/50 backdrop-blur-md' : 'bg-zinc-900/95 border-zinc-800 shadow-black/50 backdrop-blur-md'}
          ${
            isOpen
              ? 'w-[90vw] sm:w-88 md:w-96 lg:w-80 xl:w-96 translate-x-0 opacity-100 lg:h-[calc(100vh-140px)] lg:sticky lg:top-3'
              : 'translate-x-[110%] lg:w-0 lg:p-0 lg:border-0 lg:overflow-hidden lg:opacity-0 pointer-events-none'
          }
          ${isMaximized ? 'lg:w-0 lg:p-0 lg:border-0 lg:overflow-hidden lg:opacity-0 pointer-events-none' : ''}
        `}
        style={{ width: !isOpen || isMaximized ? '0px' : undefined }}
      >
        {isOpen && (
          <div className="flex-1 flex flex-col h-full min-h-0 text-black dark:text-white select-none">
            {/* 1. CARD 4 HEADER BAR */}
            <div className="p-3 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-xs flex items-center justify-center shrink-0">
                  <span className="text-xs">👨‍🏫</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 truncate">
                      Guruji AI
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-sky-500/10 border border-sky-500/20 text-[9px] font-mono font-bold text-sky-600 dark:text-sky-400">
                      {voiceSettings.language.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Slide {activeSlide.slide_number || currentSlideIdx + 1}: {activeSlide.title}
                  </div>
                </div>
              </div>

              {/* Header Control Buttons */}
              <div className="flex items-center space-x-1 shrink-0">
                {/* Voice Settings Button */}
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  title="Voice & Language Settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>

                {/* Desktop Collapse Button */}
                <button
                  type="button"
                  onClick={handleInitiateClose}
                  className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition text-[10px] font-bold"
                  title="Collapse Guruji Card"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                  <span>Collapse</span>
                </button>
              </div>
            </div>

            {/* 2. AI TEACHER STATUS & CONTEXT BAR (Avatar is exclusively used in the floating slide overlay) */}
            <div className="px-3 py-2 bg-gradient-to-r from-sky-500/5 via-indigo-500/5 to-transparent border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                {isSpeaking ? (
                  <div className="flex items-end space-x-1 h-3.5 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
                    <span className="w-1 bg-sky-500 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 bg-sky-500 rounded-full animate-bounce h-3.5" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 bg-sky-500 rounded-full animate-bounce h-2.5" style={{ animationDelay: '300ms' }} />
                    <span className="w-1 bg-sky-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: '450ms' }} />
                    <span className="text-[9px] font-bold text-sky-500 ml-1">Speaking</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-zinc-400 text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>AI Ready</span>
                  </div>
                )}
              </div>

              {/* Quick Context Mode Selector */}
              <div className="flex items-center gap-0.5 bg-zinc-100/90 dark:bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setContextMode('slide')}
                  className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold transition ${
                    contextMode === 'slide' ? 'bg-sky-500 text-white' : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                  title="Context: Current Slide"
                >
                  Slide
                </button>
                <button
                  type="button"
                  onClick={() => setContextMode('module')}
                  className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold transition ${
                    contextMode === 'module' ? 'bg-sky-500 text-white' : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                  title="Context: Entire Current Module"
                >
                  Module
                </button>
                <button
                  type="button"
                  onClick={() => setContextMode('course')}
                  className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold transition ${
                    contextMode === 'course' ? 'bg-sky-500 text-white' : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                  title="Context: Full Course"
                >
                  Course
                </button>
              </div>
            </div>

            {/* 3. TAB CONTROLS (Explanation vs Q&A Chat) */}
            <div className="px-2.5 pt-1.5 pb-1 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-50/30 dark:bg-zinc-900/20">
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('explanation')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ${
                    activeTab === 'explanation'
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                      : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Explain</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ${
                    activeTab === 'chat'
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                      : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Ask {chatMessages.length > 0 && `(${chatMessages.length})`}</span>
                </button>
              </div>

              {/* Scan Full Course Quick Trigger */}
              <button
                type="button"
                onClick={() => setIsScanModalOpen(true)}
                className="px-2 py-0.5 rounded-lg text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition flex items-center space-x-1"
                title="Index full course curriculum with AI"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>Scan Course</span>
              </button>
            </div>

            {/* 4. MAIN SCROLLABLE CONTENT BODY */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin min-h-0">
              {activeTab === 'explanation' ? (
                <div className="space-y-3">
                  {isLoadingAI ? (
                    <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-center space-y-2.5">
                      <div className="w-6 h-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto" />
                      <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">Guruji is teaching this slide...</p>
                    </div>
                  ) : currentExplanation ? (
                    <div className="space-y-2.5 animate-in fade-in">
                      {/* Guruji Live Speech Transcript / Caption */}
                      <div className="p-3 rounded-2xl bg-sky-500/5 dark:bg-sky-950/30 border border-sky-500/20 space-y-1.5">
                        <div className="flex items-center space-x-1 text-[9px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          <Volume2 className="w-3 h-3" />
                          <span>Teaching Explanation</span>
                        </div>
                        <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                          "{currentExplanation.speechText}"
                        </p>
                      </div>

                      {/* Bullet Takeaways */}
                      {currentExplanation.bulletPoints && currentExplanation.bulletPoints.length > 0 && (
                        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                          <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Core Takeaways</span>
                          </div>
                          <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                            {currentExplanation.bulletPoints.map((pt, i) => (
                              <li key={i} className="flex items-start space-x-1.5">
                                <span className="text-sky-500 font-bold">•</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Practical Industry Example */}
                      {currentExplanation.practicalExample && (
                        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                          <div className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                            <Lightbulb className="w-3 h-3" />
                            <span>Real-World Scenario</span>
                          </div>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            {currentExplanation.practicalExample}
                          </p>
                        </div>
                      )}

                      {/* Exam / Interview Tip */}
                      {currentExplanation.examTip && (
                        <div className="p-2.5 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 space-y-0.5">
                          <div className="text-[9px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center space-x-1">
                            <Award className="w-3 h-3" />
                            <span>Exam Tip</span>
                          </div>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300">{currentExplanation.examTip}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-center space-y-2.5">
                      <p className="text-xs text-zinc-500">
                        Click below to have Guruji explain this lesson slide in detail.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleExplainCurrentSlide(false)}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        Explain Slide ⚡
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Q&A CHAT VIEW */
                <div className="space-y-2.5">
                  {chatMessages.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-center space-y-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mx-auto border border-sky-500/20">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold">Ask Guruji Anything</h4>
                        <p className="text-[10px] text-zinc-500">
                          Ask about this slide, protocol specs, or telecom concepts.
                        </p>
                      </div>

                      {/* Suggestion Chips */}
                      <div className="pt-1 flex flex-wrap gap-1 justify-center">
                        {SUGGESTION_CHIPS.map((chip, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendQuestion(chip)}
                            className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium transition cursor-pointer"
                          >
                            {chip} →
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${msg.role === 'student' ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[90%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                              msg.role === 'student'
                                ? 'bg-sky-600 text-white rounded-br-xs'
                                : isLight
                                ? 'bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-bl-xs'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-xs'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[8px] text-zinc-400 font-mono mt-0.5 px-1">
                            {msg.role === 'student' ? 'You' : 'Guruji'} • {msg.timestamp}
                          </span>
                        </div>
                      ))}
                      {isLoadingAI && (
                        <div className="flex items-center space-x-1.5 text-xs text-sky-500 p-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
                          <span className="text-[11px]">Guruji is thinking...</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. PLAYBACK & SPEECH AUDIO BAR */}
            <div className="p-2.5 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/60 flex items-center justify-between gap-1.5 shrink-0">
              {/* Audio Action Buttons */}
              <div className="flex items-center space-x-1">
                {isSpeaking && !isPaused ? (
                  <button
                    type="button"
                    onClick={() => speechEngine.pause()}
                    className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white transition"
                    title="Pause Speech"
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (isPaused) {
                        speechEngine.resume();
                      } else if (currentExplanation?.speechText) {
                        speechEngine.speak(currentExplanation.speechText, voiceSettings.language);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition shadow-2xs"
                    title="Play / Resume Speech"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => speechEngine.stop()}
                  className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition"
                  title="Stop Audio"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => speechEngine.replay()}
                  className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition"
                  title="Replay Audio"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Explain Again Action Button */}
              <button
                type="button"
                onClick={() => handleExplainCurrentSlide(false)}
                className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                title="Re-explain Current Slide"
              >
                ⚡ Explain Again
              </button>
            </div>

            {/* 6. BOTTOM QUESTION / MICROPHONE INPUT BAR */}
            <div className="p-2.5 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuestion();
                }}
                className="flex items-center space-x-1.5"
              >
                {/* Microphone Speech Recognition Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      speechEngine.stopListening();
                    } else {
                      speechEngine.startListening();
                    }
                  }}
                  className={`p-2 rounded-xl border transition active:scale-95 shrink-0 ${
                    isListening
                      ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                  title={isListening ? 'Listening... (Click to stop)' : 'Speak question with Microphone'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Listening to voice...'
                      : `Ask Guruji (${contextMode === 'slide' ? 'Slide' : contextMode === 'module' ? 'Module' : 'Course'})...`
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none focus:border-sky-500 transition placeholder:text-zinc-400"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoadingAI}
                  className="p-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-40 text-white transition active:scale-95 shadow-xs shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </aside>

      {/* VOICE SETTINGS MODAL */}
      <GurujiVoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        settings={voiceSettings}
        availableVoices={speechEngine.getAvailableVoices()}
        onSave={(newSettings) => setVoiceSettings(newSettings)}
        onTestVoice={(text, lang) => speechEngine.speak(text, lang)}
      />

      {/* FULL COURSE SCANNER MODAL */}
      <GurujiCourseScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        course={course}
        language={voiceSettings.language}
        onScanComplete={(k) => setCourseKnowledge(k)}
        onExplainCourse={() => {
          setContextMode('course');
          handleSendQuestion('Give me a comprehensive summary of this entire course curriculum.');
        }}
        onAskAnything={() => {
          setActiveTab('chat');
        }}
      />
    </>
  );
}
