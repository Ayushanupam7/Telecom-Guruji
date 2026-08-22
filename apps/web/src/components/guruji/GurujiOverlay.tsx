'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  BookOpen,
  Send,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Lightbulb,
  Award,
  PanelRightClose,
  FileText,
  Sliders
} from 'lucide-react';
import { Course, CourseSlide, GurujiContextMode, GurujiMessage, GurujiVoiceSettings, Module } from '@signalhub/types';
import { GurujiContextBuilder } from './GurujiContextBuilder';
import { GurujiCourseScanModal } from './GurujiCourseScanModal';
import { GurujiVoiceSettingsModal } from './GurujiVoiceSettingsModal';
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

  // 1. UI & Interaction States
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
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

  // Sync settings across components
  useEffect(() => {
    const handleSettingsSync = (e: any) => {
      if (e.detail?.settings) {
        setVoiceSettings(e.detail.settings);
      }
    };
    window.addEventListener('guruji-settings-sync', handleSettingsSync);
    return () => window.removeEventListener('guruji-settings-sync', handleSettingsSync);
  }, []);

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
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [courseKnowledge, setCourseKnowledge] = useState<any>(() =>
    GurujiContextBuilder.getCachedCourseKnowledge(course.id)
  );

  const chatEndRef = useRef<HTMLDivElement>(null);
  const previousSlideIdRef = useRef<string>(activeSlide.id);
  const recognitionRef = useRef<any>(null);

  // 2. Fetch Explanation on Slide Change or Initial Open
  useEffect(() => {
    if (previousSlideIdRef.current !== activeSlide.id) {
      previousSlideIdRef.current = activeSlide.id;
      if (isOpen) {
        handleExplainCurrentSlide(false);
      }
    }
  }, [activeSlide.id, isOpen]);

  // Initial fetch when opened
  useEffect(() => {
    if (isOpen && !currentExplanation) {
      handleExplainCurrentSlide(false);
    }
  }, [isOpen]);

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
    window.addEventListener('guruji-explanation-sync', handleSync);
    return () => window.removeEventListener('guruji-explanation-sync', handleSync);
  }, [activeSlide.id]);

  // 3. EXPLAIN CURRENT SLIDE (Pure Text Assistant)
  const handleExplainCurrentSlide = async (firstTime: boolean = false) => {
    setIsLoadingAI(true);
    const activeLang = siteLanguage || 'en';

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
          } catch (e) {}
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
          en: `Let's focus on ${activeSlide.title}. This slide illustrates fundamental architectures in ${activeModule.title}. Review the key diagrams and bullet points carefully.`,
        };
        const fallbackText = fallbackMap[activeLang] || fallbackMap.en;
        setCurrentExplanation({
          speechText: fallbackText,
          bulletPoints: [`Key Topic: ${activeSlide.title}`, `Review module definitions and parameters.`],
        });
      }
    } catch (err) {
      console.error('Error generating slide explanation:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // 4. SEND QUESTION (Q&A)
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
          language: siteLanguage || 'en',
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
    } catch (err) {
      console.error('Error answering question:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // 5. Speech-to-Text Microphone Input for Questions
  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = siteLanguage === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendQuestion(transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
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
      {/* CARD 4: RIGHT GURUJI AI ASSISTANT CARD (TEXT & Q&A STUDY GUIDE)         */}
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
                      Guruji AI Study Guide
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-sky-500/10 border border-sky-500/20 text-[9px] font-mono font-bold text-sky-600 dark:text-sky-400">
                      {(siteLanguage || 'en').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Slide {activeSlide.slide_number || currentSlideIdx + 1}: {activeSlide.title}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Voice & AI Settings Button */}
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition text-[10px] font-bold cursor-pointer"
                  title="Guruji Voice & AI Settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>

                {/* Desktop Collapse Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition text-[10px] font-bold cursor-pointer"
                  title="Collapse Guruji Card"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                  <span>Collapse</span>
                </button>
              </div>
            </div>

            {/* 2. STATUS & CONTEXT SCOPE BAR */}
            <div className="px-3 py-2 bg-gradient-to-r from-sky-500/5 via-indigo-500/5 to-transparent border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-1.5 text-zinc-400 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI Study Guide Ready</span>
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
                  <span>Notes</span>
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
                  <span>Q&A {chatMessages.length > 0 && `(${chatMessages.length})`}</span>
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
                      <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">Generating study notes...</p>
                    </div>
                  ) : currentExplanation ? (
                    <div className="space-y-2.5 animate-in fade-in">
                      {/* Detailed Overview */}
                      <div className="p-3 rounded-2xl bg-sky-500/5 dark:bg-sky-950/30 border border-sky-500/20 space-y-1.5">
                        <div className="flex items-center space-x-1 text-[9px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          <FileText className="w-3 h-3" />
                          <span>Key Lesson Breakdown</span>
                        </div>
                        <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                          {currentExplanation.speechText}
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
                        Click below to generate detailed study notes for this slide.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleExplainCurrentSlide(false)}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        Generate Study Notes ⚡
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

            {/* 5. BOTTOM QUESTION / MICROPHONE INPUT BAR */}
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
                  onClick={toggleSpeechRecognition}
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

      {/* VOICE & AI SETTINGS MODAL */}
      <GurujiVoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        settings={voiceSettings}
        availableVoices={[]}
        onSave={(newSettings) => {
          setVoiceSettings(newSettings);
          try {
            localStorage.setItem('tg_guruji_voice_settings', JSON.stringify(newSettings));
          } catch (e) {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('guruji-settings-sync', { detail: { settings: newSettings } }));
          }
        }}
        onTestVoice={(text, lang) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('guruji-test-voice', { detail: { text, lang } }));
          }
        }}
      />

      {/* FULL COURSE SCANNER MODAL */}
      <GurujiCourseScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        course={course}
        language={siteLanguage || 'en'}
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
