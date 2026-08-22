'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, Circle, Loader2, BookOpen, Layers, Zap, ArrowRight } from 'lucide-react';
import { Course } from '@signalhub/types';
import { GurujiContextBuilder } from './GurujiContextBuilder';

interface GurujiCourseScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  language: 'en' | 'hi' | 'hinglish';
  onScanComplete: (knowledge: any) => void;
  onExplainCourse: () => void;
  onAskAnything: () => void;
}

const SCAN_STAGES = [
  { id: 'structure', label: 'Analyzing course structure & curriculum metadata' },
  { id: 'modules', label: 'Parsing all module definitions & milestones' },
  { id: 'lessons', label: 'Extracting slides, diagrams, and code snippets' },
  { id: 'concepts', label: 'Synthesizing core architectural telecom concepts' },
  { id: 'knowledge', label: 'Building course memory & indexing knowledge graph' },
];

export function GurujiCourseScanModal({
  isOpen,
  onClose,
  course,
  language,
  onScanComplete,
  onExplainCourse,
  onAskAnything,
}: GurujiCourseScanModalProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIdx(0);
      setIsDone(false);
      setError(null);
      return;
    }

    // Check cached knowledge first
    const cached = GurujiContextBuilder.getCachedCourseKnowledge(course.id);
    if (cached) {
      setScanResult(cached);
      setCurrentStepIdx(SCAN_STAGES.length);
      setIsDone(true);
      return;
    }

    // Execute scan flow
    let isMounted = true;
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev < SCAN_STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 900);

    // Call API in parallel
    fetch('/api/ai/guruji', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'scan_course',
        courseData: course,
        language,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        clearInterval(interval);
        if (data.success && data.data) {
          setScanResult(data.data);
          GurujiContextBuilder.cacheCourseKnowledge(course.id, data.data);
          onScanComplete(data.data);
          setCurrentStepIdx(SCAN_STAGES.length);
          setIsDone(true);
        } else {
          setError(data.error || 'Could not complete course analysis');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        clearInterval(interval);
        setError(err.message || 'Network error during course scan');
      });

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, course, language]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl border bg-zinc-950/95 text-white border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">Guruji Course Scanner</h3>
              <p className="text-[11px] text-zinc-400">{course.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!isDone && !error && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sky-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-bold">Guruji is learning your course curriculum...</span>
              </div>

              {/* Progress checklist */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                {SCAN_STAGES.map((stage, idx) => {
                  const isCompleted = idx < currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  return (
                    <div key={stage.id} className="flex items-center space-x-3 text-xs">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-600 shrink-0" />
                      )}
                      <span
                        className={
                          isCompleted
                            ? 'text-zinc-200 font-medium'
                            : isCurrent
                            ? 'text-sky-300 font-bold'
                            : 'text-zinc-500'
                        }
                      >
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs space-y-1">
              <div className="font-bold">Scan Incomplete</div>
              <div>{error}</div>
            </div>
          )}

          {isDone && scanResult && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-bold">Done! I understand this complete course curriculum.</span>
              </div>

              {scanResult.courseExecutiveSummary && (
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Executive Overview</div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{scanResult.courseExecutiveSummary}</p>
                </div>
              )}

              {scanResult.keyArchitecturalTopics && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Key Core Concepts</div>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult.keyArchitecturalTopics.map((topic: string, i: number) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-300"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition"
          >
            Close
          </button>

          {isDone && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExplainCourse();
                }}
                className="px-4 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-bold transition flex items-center space-x-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explain Course</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAskAnything();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition flex items-center space-x-1"
              >
                <span>Ask Anything</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
