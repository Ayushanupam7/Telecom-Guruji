'use client';

import React, { useState } from 'react';
import {
  Eye,
  BookOpen,
  PlayCircle,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Star,
  Clock,
  Layers,
  Code,
  Quote,
  Table
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Course, Module, CourseSlide, RichBlock } from '@signalhub/types';
import { getCurrencySymbol } from '@/lib/currency';

interface Step6StudentPreviewProps {
  course: Course;
  modules: Module[];
  onNext: () => void;
  onPrev: () => void;
}

export function Step6StudentPreview({
  course,
  modules,
  onNext,
  onPrev,
}: Step6StudentPreviewProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [previewMode, setPreviewMode] = useState<'landing' | 'player'>('landing');
  const [selectedModIdx, setSelectedModIdx] = useState(0);
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(0);

  const activeModule = modules[selectedModIdx] || modules[0];
  const slides = activeModule?.slides || activeModule?.slides_data || [];
  const activeSlide = slides[selectedSlideIdx] || slides[0];

  const template = course.template_config || {
    theme: 'telecom_classic',
    primaryColor: '#0284c7',
    secondaryColor: '#6366f1',
    backgroundColor: '#000000',
    typography: 'roboto',
    cardStyle: 'bordered',
    slideLayout: 'standard',
    certificateDesign: 'classic',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Step Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sky-500 mb-1">
            <span>Step 6 of 7</span>
            <span>•</span>
            <span>Simulation</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight font-sans">
            Student Experience Preview
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Test how students will discover, navigate, and learn from your course.
          </p>
        </div>

        {/* Switch Landing vs Player */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setPreviewMode('landing')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              previewMode === 'landing'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                : 'text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Course Landing Page</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('player')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              previewMode === 'player'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                : 'text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Learning Player</span>
          </button>
        </div>
      </div>

      {/* 1. LANDING PAGE PREVIEW */}
      {previewMode === 'landing' && (
        <div className="space-y-8 rounded-3xl border p-6 sm:p-10 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-xl">
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center space-x-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white"
                  style={{ backgroundColor: template.primaryColor || '#0284c7' }}
                >
                  {course.category || 'Telecommunications'}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {course.level || 'Intermediate'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                {course.title || 'Mobile Network Fundamentals & 5G Architecture'}
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {course.summary || 'Master modern telecom standards, wireless signal processing, and high-performance network orchestration.'}
              </p>

              {/* Instructor Credentials */}
              <div className="flex items-center space-x-3 pt-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm"
                  style={{ backgroundColor: template.secondaryColor || '#6366f1' }}
                >
                  {(course.trainer_name || 'Dr. Ayush Sharma').charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Taught by</div>
                  <div className="text-sm font-bold">{course.trainer_name || 'Dr. Ayush Sharma'}</div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 flex items-center space-x-4">
                <button
                  type="button"
                  className="px-8 py-4 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-lg hover:opacity-90 transition"
                  style={{ backgroundColor: template.primaryColor || '#0284c7' }}
                >
                  Enroll Now • {course.price && course.price > 0 ? `${getCurrencySymbol(course.currency || 'INR')} ${course.price}` : 'Free'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('player')}
                  className="px-6 py-4 rounded-2xl border font-bold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
                >
                  Start Free Preview
                </button>
              </div>
            </div>

            {/* Hero Image Card */}
            <div className="lg:col-span-5">
              <div className="relative aspect-video sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900">
                <img
                  src={course.thumbnail_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'}
                  alt="Course cover"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* What You'll Learn Section */}
          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-xl font-black tracking-tight">What You'll Master in this Course</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Telecom fundamentals & cellular architecture',
                '2G / 3G / 4G LTE / 5G NR network protocols',
                'Core network slicing and NFV orchestration',
                'Radio access network (RAN) and beamforming',
                'Hands-on interactive module quizzes & evaluation',
                'Verified industry certificate upon completion',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Course Roadmap */}
          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black tracking-tight">Curriculum & Module Roadmap</h3>
              <span className="text-xs text-zinc-400 font-bold">{modules.length} Modules</span>
            </div>

            <div className="space-y-3">
              {modules.map((mod, idx) => (
                <div
                  key={mod.id}
                  className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-sky-500 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 font-mono font-black flex items-center justify-center text-xs">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{mod.title}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {(mod.slides || mod.slides_data || []).length} Lessons • {mod.duration_minutes || 30} mins
                        </p>
                      </div>
                    </div>
                    {mod.has_quiz && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Quiz Included
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. LEARNING PLAYER PREVIEW */}
      {previewMode === 'player' && (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden shadow-2xl">
          {/* Top Player Navigation Bar */}
          <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center space-x-3 truncate">
              <span className="text-xs font-black uppercase text-sky-500 font-mono">Learning Mode</span>
              <span className="text-zinc-400">•</span>
              <span className="text-xs sm:text-sm font-bold truncate">{course.title}</span>
            </div>

            {/* Progress Metric */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-xs text-zinc-400 font-mono">
                Slide {selectedSlideIdx + 1} of {(slides || []).length}
              </div>
              <div className="w-24 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{
                    width: `${(((selectedSlideIdx + 1) / Math.max(1, (slides || []).length)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Player Grid: Left Outline, Right Lesson Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Sidebar */}
            <div className="lg:col-span-4 border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/50">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                Course Syllabus
              </span>
              {modules.map((m, mIdx) => (
                <div key={m.id} className="space-y-1">
                  <div
                    onClick={() => { setSelectedModIdx(mIdx); setSelectedSlideIdx(0); }}
                    className={`p-2.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-between ${
                      selectedModIdx === mIdx
                        ? 'bg-sky-500 text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span>{m.title}</span>
                    <span className="text-[10px] opacity-80">{(m.slides || []).length}s</span>
                  </div>

                  {selectedModIdx === mIdx && (
                    <div className="pl-3 space-y-1 border-l-2 border-sky-500/40 ml-2">
                      {(m.slides || []).map((s, sIdx) => (
                        <div
                          key={s.id}
                          onClick={() => setSelectedSlideIdx(sIdx)}
                          className={`p-2 rounded-lg text-xs cursor-pointer transition ${
                            selectedSlideIdx === sIdx
                              ? 'bg-zinc-200 dark:bg-zinc-800 font-bold text-black dark:text-white'
                              : 'text-zinc-500 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          {sIdx + 1}. {s.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Slide Main Canvas */}
            <div className="lg:col-span-8 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black uppercase text-sky-500 font-mono">
                    {activeModule?.title}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                    {activeSlide?.title || 'Slide Title'}
                  </h2>
                </div>

                {/* Rendered Slide Blocks */}
                <div className="space-y-5">
                  {(activeSlide?.blocks || []).map((block: RichBlock) => (
                    <div key={block.id}>
                      {block.type === 'heading' && (
                        <h3 className="text-lg font-black tracking-tight">{block.content.text}</h3>
                      )}
                      {block.type === 'paragraph' && (
                        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                          {block.content.text}
                        </p>
                      )}
                      {block.type === 'bullet_list' && (
                        <ul className="space-y-2 pl-2">
                          {(block.content.items || []).map((item, idx) => (
                            <li key={idx} className="flex items-start space-x-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-2" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {block.type === 'image' && (
                        <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                          <img
                            src={block.content.url || ''}
                            alt="Slide graphic"
                            className="w-full aspect-video object-cover"
                          />
                        </div>
                      )}
                      {block.type === 'code' && (
                        <pre className="p-4 rounded-2xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto">
                          <code>{block.content.code}</code>
                        </pre>
                      )}
                      {block.type === 'quote' && (
                        <blockquote className="border-l-4 border-sky-500 pl-4 italic text-sm text-zinc-600 dark:text-zinc-300">
                          "{block.content.text}"
                          {block.content.author && (
                            <footer className="text-xs text-zinc-400 font-normal mt-1">— {block.content.author}</footer>
                          )}
                        </blockquote>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Player Navigation Controls */}
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  disabled={selectedSlideIdx === 0}
                  onClick={() => setSelectedSlideIdx((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl border text-xs font-bold disabled:opacity-30 flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Slide</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedSlideIdx < (slides || []).length - 1) {
                      setSelectedSlideIdx((prev) => prev + 1);
                    } else if (selectedModIdx < modules.length - 1) {
                      setSelectedModIdx((prev) => prev + 1);
                      setSelectedSlideIdx(0);
                    }
                  }}
                  className="px-6 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs flex items-center space-x-1"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bottom Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={onPrev}
          className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border text-sm font-bold ${
            isLight ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700' : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Certificate</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center space-x-2 px-8 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition shadow-sm"
        >
          <span>Continue to Validation & Publish →</span>
        </button>
      </div>
    </div>
  );
}
