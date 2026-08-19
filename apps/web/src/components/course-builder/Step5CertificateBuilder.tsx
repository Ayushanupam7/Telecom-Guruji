'use client';

import React, { useState } from 'react';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Palette,
  FileText,
  User,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Sparkles,
  Printer
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { CertificateConfig, CertificateDesign, Course } from '@signalhub/types';

interface Step5CertificateBuilderProps {
  course: Course;
  certificateConfig?: CertificateConfig;
  onChange: (config: CertificateConfig) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step5CertificateBuilder({
  course,
  certificateConfig,
  onChange,
  onNext,
  onPrev,
}: Step5CertificateBuilderProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const cert: CertificateConfig = certificateConfig || {
    template: 'classic',
    title: 'Certificate of Telecommunications Mastery',
    signatureName: course.trainer_name || 'Dr. Ayush Sharma',
    signatureTitle: 'Lead Telecom Systems Architect & Instructor',
    accentColor: '#0284c7',
  };

  const templates: Array<{ id: CertificateDesign; name: string; desc: string }> = [
    { id: 'classic', name: 'Classic Gold & Navy', desc: 'Timeless formal diploma border with seal' },
    { id: 'modern', name: 'Modern High-Tech Cyan', desc: 'Clean geometric lines with digital telemetry accents' },
    { id: 'professional', name: 'Executive Monochrome', desc: 'Minimalist enterprise certificate for corporate certifications' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sky-500 mb-1">
            <span>Step 5 of 7</span>
            <span>•</span>
            <span>Accreditation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
            Certificate & Accreditation Builder
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Design the verified digital certificate that students unlock upon successfully passing all quizzes and the final assessment.
          </p>
        </div>
      </div>

      {/* 2-Column Studio: Left Settings, Right HD Certificate Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: SETTINGS (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Template Selector */}
          <div className={`p-6 rounded-2xl border space-y-4 ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
            <h3 className="text-base font-black flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Certificate Design Template</span>
            </h3>

            <div className="space-y-2.5">
              {templates.map((t) => {
                const isSelected = cert.template === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => onChange({ ...cert, template: t.id })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/5 ring-2 ring-sky-500/20'
                        : isLight
                        ? 'border-zinc-200 hover:border-zinc-300'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{t.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-500" />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{t.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate Customization Details */}
          <div className={`p-6 rounded-2xl border space-y-4 ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
            <h3 className="text-base font-black flex items-center space-x-2">
              <Palette className="w-4 h-4 text-sky-500" />
              <span>Certificate Content & Signatures</span>
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Certificate Title Header
              </label>
              <input
                type="text"
                value={cert.title || ''}
                onChange={(e) => onChange({ ...cert, title: e.target.value })}
                placeholder="Certificate of Telecommunications Mastery"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Signatory Name (Instructor)
              </label>
              <input
                type="text"
                value={cert.signatureName || ''}
                onChange={(e) => onChange({ ...cert, signatureName: e.target.value })}
                placeholder="Dr. Ayush Sharma"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Signatory Official Title
              </label>
              <input
                type="text"
                value={cert.signatureTitle || ''}
                onChange={(e) => onChange({ ...cert, signatureTitle: e.target.value })}
                placeholder="Lead Telecom Architect & Instructor"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Accent Seal Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={cert.accentColor || '#0284c7'}
                  onChange={(e) => onChange({ ...cert, accentColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={cert.accentColor || '#0284c7'}
                  onChange={(e) => onChange({ ...cert, accentColor: e.target.value })}
                  className={`flex-1 px-3 py-2 rounded-xl border font-mono text-xs ${
                    isLight ? 'border-zinc-300' : 'border-zinc-700 bg-zinc-900'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HD LIVE CERTIFICATE PREVIEW (7 cols) */}
        <div className="lg:col-span-7 space-y-3 sticky top-24">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Live Digital Certificate Preview
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">
              Verified Digital Hash
            </span>
          </div>

          {/* Certificate HD Canvas */}
          <div
            id="certificate-print-area"
            className={`relative aspect-[1.414/1] rounded-2xl border-4 p-8 sm:p-12 flex flex-col justify-between text-center overflow-hidden transition-all shadow-2xl ${
              cert.template === 'modern'
                ? 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white border-sky-500/40'
                : cert.template === 'professional'
                ? 'bg-white text-black border-black shadow-none'
                : isLight
                ? 'bg-amber-50/20 text-zinc-900 border-amber-500/40'
                : 'bg-zinc-950 text-white border-amber-500/30'
            }`}
          >
            {/* Top Brand & Seal */}
            <div className="flex items-center justify-between">
              <div className="text-left">
                <span className="text-xs font-black tracking-wider uppercase text-sky-500">
                  Telecom Guruji
                </span>
                <p className="text-[10px] text-zinc-400 font-mono">ACCREDITED EDTECH PLATFORM</p>
              </div>

              {/* Decorative Seal Badge */}
              <div
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-xs shadow-md"
                style={{
                  borderColor: cert.accentColor || '#0284c7',
                  color: cert.accentColor || '#0284c7',
                }}
              >
                ★ VERIFIED
              </div>
            </div>

            {/* Main Certificate Typography */}
            <div className="space-y-3 py-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                {cert.title || 'Certificate of Completion'}
              </h4>
              <p className="text-xs italic text-zinc-500">This is to proudly certify that</p>
              <h2 className="text-2xl sm:text-4xl font-black font-serif tracking-tight underline decoration-sky-500/50 decoration-2 underline-offset-8">
                Student Learner
              </h2>
              <p className="text-xs text-zinc-500 max-w-md mx-auto pt-2">
                has successfully completed all modules, practical assessments, and the final exam for
              </p>
              <h3 className="text-lg sm:text-xl font-black text-sky-500">
                {course.title || '5G Mobile Networks Architecture'}
              </h3>
            </div>

            {/* Bottom Signatures & Verification */}
            <div className="flex items-end justify-between pt-6 border-t border-zinc-300/40 dark:border-zinc-700/40 text-left text-xs">
              <div>
                <div className="font-serif italic text-base sm:text-lg font-bold">
                  {cert.signatureName || 'Dr. Ayush Sharma'}
                </div>
                <div className="text-[10px] text-zinc-400">{cert.signatureTitle || 'Lead Telecom Architect'}</div>
                <div className="text-[9px] text-zinc-400 font-mono mt-0.5">Instructor & Evaluator</div>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                  <QrCode className="w-7 h-7 text-zinc-700 dark:text-zinc-300" />
                </div>
                <div className="text-[9px] font-mono text-zinc-400 mt-1">ID: TG-2026-9821-X</div>
              </div>

              <div className="text-right">
                <div className="font-bold text-xs">Date of Issue</div>
                <div className="text-[11px] font-mono text-zinc-400">August 18, 2026</div>
                <div className="text-[9px] text-emerald-500 font-bold mt-0.5">Score: 92% • Passed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={onPrev}
          className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border text-sm font-bold ${
            isLight ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700' : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assessments</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center space-x-2 px-8 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition shadow-sm"
        >
          <span>Continue to Student Preview →</span>
        </button>
      </div>
    </div>
  );
}
