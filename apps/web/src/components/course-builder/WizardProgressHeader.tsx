'use client';

import React from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronRight,
  Save,
  ArrowLeft,
  Eye,
  Sparkles,
  ShieldAlert,
  Layers,
  FileText,
  HelpCircle,
  Award,
  Globe,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export interface WizardStep {
  id: number;
  label: string;
  shortName: string;
  icon: React.ReactNode;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 1, label: 'Course Info', shortName: 'Info', icon: <FileText className="w-4 h-4" /> },
  { id: 2, label: 'Roadmap', shortName: 'Roadmap', icon: <Layers className="w-4 h-4" /> },
  { id: 3, label: 'Content Studio', shortName: 'Content', icon: <Sparkles className="w-4 h-4" /> },
  { id: 4, label: 'Assessment', shortName: 'Quiz', icon: <HelpCircle className="w-4 h-4" /> },
  { id: 5, label: 'Certificate', shortName: 'Certificate', icon: <Award className="w-4 h-4" /> },
  { id: 6, label: 'Student Preview', shortName: 'Preview', icon: <Eye className="w-4 h-4" /> },
  { id: 7, label: 'Publish & Validate', shortName: 'Publish', icon: <Globe className="w-4 h-4" /> },
];

interface WizardProgressHeaderProps {
  currentStep: number;
  onSelectStep: (stepId: number) => void;
  onSaveDraft: () => void;
  savingDraft: boolean;
  lastSavedText: string;
  courseTitle: string;
  validationIssuesCount?: number;
}

export function WizardProgressHeader({
  currentStep,
  onSelectStep,
  onSaveDraft,
  savingDraft,
  lastSavedText,
  courseTitle,
  validationIssuesCount = 0,
}: WizardProgressHeaderProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-200 ${
        isLight
          ? 'bg-white/95 border-zinc-200 shadow-xs text-zinc-900'
          : 'bg-zinc-950/95 border-zinc-800 shadow-black/40 text-white'
      }`}
    >
      {/* Top Main Navigation Bar - Full Width for ample space */}
      <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Back Link & Course Title & Sync Status (uses available left space) */}
        <div className="flex items-center space-x-3 min-w-0 flex-1 max-w-sm xl:max-w-md">
          <Link
            href="/instructor/dashboard?tab=courses"
            className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700 hover:text-black'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
            }`}
            title="Return to Instructor Dashboard"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </Link>

          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-xs sm:text-sm font-black truncate leading-tight tracking-tight font-sans">
              {courseTitle || 'Untitled Telecom Course'}
            </h1>
            <div className="flex items-center space-x-2 mt-0.5 whitespace-nowrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 font-mono">
                Creator
              </span>
              <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">•</span>
              <div className="inline-flex items-center space-x-1.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {savingDraft ? (
                  <>
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-sky-500 shrink-0" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    <span>{lastSavedText || 'Saved to drafts'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Step Stepper with compact responsive sizing */}
        <div className="hidden lg:flex items-center space-x-0.5 bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
          {WIZARD_STEPS.map((step) => {
            const isCurrent = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelectStep(step.id)}
                className={`flex items-center space-x-1.5 px-2 xl:px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm font-extrabold'
                    : isCompleted
                    ? isLight
                      ? 'text-zinc-700 hover:text-black hover:bg-zinc-200/70'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                    : isLight
                    ? 'text-zinc-400 hover:text-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black transition-colors shrink-0 ${
                    isCurrent
                      ? 'bg-sky-500 text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isLight
                      ? 'bg-zinc-300 text-zinc-700'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : step.id}
                </span>
                <span className="hidden 2xl:inline">{step.label}</span>
                <span className="2xl:hidden">{step.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Save Draft & Issue Count (Strictly shrink-0 to prevent cut-off) */}
        <div className="flex items-center space-x-2 shrink-0">
          {validationIssuesCount > 0 && currentStep === 7 && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{validationIssuesCount} issue{validationIssuesCount > 1 ? 's' : ''}</span>
            </span>
          )}

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={savingDraft}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap shrink-0 ${
              isLight
                ? 'bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-900 shadow-zinc-200'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white'
            }`}
          >
            {savingDraft ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500 shrink-0" />
            ) : (
              <Save className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            )}
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Step Ribbon */}
      <div className="lg:hidden px-4 py-2 border-t border-zinc-100 dark:border-zinc-800/80 overflow-x-auto scrollbar-none flex items-center space-x-1.5">
        {WIZARD_STEPS.map((step) => {
          const isCurrent = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(step.id)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition ${
                isCurrent
                  ? 'bg-black dark:bg-white text-white dark:text-black font-extrabold'
                  : isCompleted
                  ? isLight
                    ? 'bg-zinc-100 text-zinc-800'
                    : 'bg-zinc-900 text-zinc-200'
                  : 'text-zinc-400'
              }`}
            >
              <span>{step.id}.</span>
              <span>{step.shortName}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
