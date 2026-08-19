'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Course, Module, CourseStatus } from '@signalhub/types';

interface ValidationIssue {
  id: string;
  stepId: number;
  label: string;
  severity: 'error' | 'warning';
  message: string;
}

interface Step7ValidationPublishProps {
  course: Course;
  modules: Module[];
  onJumpToStep: (stepId: number) => void;
  onPublish: (targetStatus: CourseStatus) => void;
  isPublishing: boolean;
  onPrev: () => void;
}

export function Step7ValidationPublish({
  course,
  modules,
  onJumpToStep,
  onPublish,
  isPublishing,
  onPrev,
}: Step7ValidationPublishProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedStatus, setSelectedStatus] = useState<CourseStatus>(
    course.status || (course.is_published ? 'published' : 'draft')
  );

  // Run comprehensive validation checklist
  const validationIssues: ValidationIssue[] = [];

  // Check Course Info
  if (!course.title || course.title.trim().length < 5) {
    validationIssues.push({
      id: 'v-title',
      stepId: 1,
      label: 'Course Title',
      severity: 'error',
      message: 'Course title is missing or too short (minimum 5 characters required).',
    });
  }

  if (!course.summary || course.summary.trim().length < 15) {
    validationIssues.push({
      id: 'v-summary',
      stepId: 1,
      label: 'Short Summary',
      severity: 'error',
      message: 'Course short summary is missing or too short (minimum 15 characters required).',
    });
  }

  if (!course.thumbnail_url) {
    validationIssues.push({
      id: 'v-image',
      stepId: 1,
      label: 'Course Thumbnail',
      severity: 'warning',
      message: 'No custom thumbnail URL specified; default placeholder image will be used.',
    });
  }

  // Check Modules & Roadmap
  if (!modules || modules.length === 0) {
    validationIssues.push({
      id: 'v-modules-none',
      stepId: 2,
      label: 'Modules Required',
      severity: 'error',
      message: 'Course must contain at least 1 module.',
    });
  } else {
    modules.forEach((mod, idx) => {
      const slides = mod.slides || mod.slides_data || [];
      if (slides.length === 0) {
        validationIssues.push({
          id: `v-mod-${mod.id}-empty`,
          stepId: 3,
          label: `Module ${idx + 1} (${mod.title})`,
          severity: 'error',
          message: `Module ${idx + 1} contains 0 slides. Please add content before publishing.`,
        });
      }
      if (mod.has_quiz && (!mod.quiz || (mod.quiz.questions || []).length === 0)) {
        validationIssues.push({
          id: `v-mod-${mod.id}-quiz`,
          stepId: 4,
          label: `Module ${idx + 1} Quiz`,
          severity: 'warning',
          message: `Module ${idx + 1} has quiz enabled, but no questions were added.`,
        });
      }
    });
  }

  // Check Final Assessment
  if (!course.final_assessment || (course.final_assessment.questions || []).length === 0) {
    validationIssues.push({
      id: 'v-final-exam',
      stepId: 4,
      label: 'Final Certification Assessment',
      severity: 'warning',
      message: 'No final assessment questions added. Students cannot take an exit certification exam.',
    });
  }

  const errors = validationIssues.filter((i) => i.severity === 'error');
  const warnings = validationIssues.filter((i) => i.severity === 'warning');
  const canPublish = errors.length === 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sky-500 mb-1">
            <span>Step 7 of 7</span>
            <span>•</span>
            <span>Launch</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
            Pre-Publish Validation & Deployment
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Review the automated course validation checklist and select your publishing state.
          </p>
        </div>
      </div>

      {/* Validation Status Banner */}
      <div
        className={`p-6 rounded-3xl border flex items-start space-x-4 shadow-sm ${
          errors.length > 0
            ? isLight
              ? 'bg-red-50/70 border-red-200 text-red-950'
              : 'bg-red-950/20 border-red-800/40 text-red-300'
            : warnings.length > 0
            ? isLight
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
            : isLight
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
        }`}
      >
        <div className="p-2 rounded-2xl bg-white dark:bg-black/40 shrink-0">
          {errors.length > 0 ? (
            <XCircle className="w-6 h-6 text-red-500" />
          ) : warnings.length > 0 ? (
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black tracking-tight">
            {errors.length > 0
              ? `${errors.length} Critical Issue${errors.length > 1 ? 's' : ''} Require Attention`
              : warnings.length > 0
              ? 'Course is Ready to Publish (with Minor Suggestions)'
              : 'Course is 100% Verified & Ready for Students!'}
          </h3>
          <p className="text-xs leading-relaxed opacity-90">
            {errors.length > 0
              ? 'Please resolve the blocking errors below by clicking [Fix Issue] before publishing.'
              : 'All mandatory curriculum requirements, modules, slides, and assessment parameters have passed inspection.'}
          </p>
        </div>
      </div>

      {/* Issues / Checklist Grid */}
      <div className={`p-6 rounded-3xl border space-y-4 ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
        <h3 className="text-base font-black tracking-tight flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-sky-500" />
          <span>Curriculum Quality Audit</span>
        </h3>

        {validationIssues.length === 0 ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>All 8 Quality Standards Passed</span>
          </div>
        ) : (
          <div className="space-y-3">
            {validationIssues.map((issue) => (
              <div
                key={issue.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  issue.severity === 'error'
                    ? isLight
                      ? 'bg-red-50/40 border-red-200'
                      : 'bg-red-950/10 border-red-800/30'
                    : isLight
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-amber-950/10 border-amber-800/30'
                }`}
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {issue.severity === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-xs">{issue.label}</span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {issue.message}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onJumpToStep(issue.stepId)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold shrink-0 hover:border-sky-500 transition"
                >
                  Fix Issue →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publishing State Options */}
      <div className={`p-6 rounded-3xl border space-y-5 ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
        <h3 className="text-base font-black tracking-tight flex items-center space-x-2">
          <Globe className="w-5 h-5 text-sky-500" />
          <span>Publishing Status & Visibility</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Draft */}
          <div
            onClick={() => setSelectedStatus('draft')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
              selectedStatus === 'draft'
                ? 'border-zinc-500 bg-zinc-500/10 ring-2 ring-zinc-500/20'
                : isLight
                ? 'border-zinc-200 hover:border-zinc-300'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                Draft
              </span>
              {selectedStatus === 'draft' && <CheckCircle2 className="w-4 h-4 text-zinc-500" />}
            </div>
            <h4 className="font-bold text-sm">Save as Draft</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Hidden from public catalog. You can continue editing anytime.
            </p>
          </div>

          {/* Ready for Review */}
          <div
            onClick={() => setSelectedStatus('ready_for_review')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
              selectedStatus === 'ready_for_review'
                ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                : isLight
                ? 'border-zinc-200 hover:border-zinc-300'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400">
                Review
              </span>
              {selectedStatus === 'ready_for_review' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
            </div>
            <h4 className="font-bold text-sm">Ready for Review</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Mark course for administrative or peer peer review.
            </p>
          </div>

          {/* Published */}
          <div
            onClick={() => { if (canPublish) setSelectedStatus('published'); }}
            className={`p-4 rounded-2xl border-2 transition ${
              !canPublish
                ? 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
                : selectedStatus === 'published'
                ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20 cursor-pointer'
                : isLight
                ? 'border-zinc-200 hover:border-zinc-300 cursor-pointer'
                : 'border-zinc-800 hover:border-zinc-700 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Live
              </span>
              {selectedStatus === 'published' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <h4 className="font-bold text-sm">Publish to Students</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Live on Telecom Guruji catalog. Students can enroll immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation & Final Action Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={onPrev}
          className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border text-sm font-bold ${
            isLight ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700' : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Preview</span>
        </button>

        <button
          type="button"
          disabled={isPublishing || (selectedStatus === 'published' && !canPublish)}
          onClick={() => onPublish(selectedStatus)}
          className={`inline-flex items-center space-x-2 px-9 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition shadow-lg disabled:opacity-50 ${
            selectedStatus === 'published'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
          }`}
        >
          {isPublishing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Globe className="w-4 h-4" />
          )}
          <span>
            {isPublishing
              ? 'Deploying Course...'
              : selectedStatus === 'published'
              ? 'Publish Course Live 🚀'
              : `Save as ${selectedStatus.replace('_', ' ').toUpperCase()}`}
          </span>
        </button>
      </div>
    </div>
  );
}
