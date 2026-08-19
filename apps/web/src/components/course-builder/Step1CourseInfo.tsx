'use client';

import React, { useState } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  Tag,
  DollarSign,
  Globe,
  Layers,
  Clock,
  User,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Eye,
  ShieldCheck,
  BookOpen,
  Star,
  RefreshCw,
  X,
  ArrowRight,
  Zap,
  Award,
  BarChart,
  Check
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Course, CourseTemplateConfig, CourseTheme } from '@signalhub/types';
import { formatCoursePrice, getCurrencySymbol, CURRENCY_OPTIONS } from '@/lib/currency';

interface Step1CourseInfoProps {
  course: Course;
  onChange: (updated: Partial<Course>) => void;
  onNext: () => void;
}

const CATEGORY_PRESETS = [
  '5G & Mobile Networks',
  'Telecommunications',
  'RF & Antenna Engineering',
  'Cloud & NFV Architecture',
  'Signal Processing',
  'Optical Fiber Networks',
  'Cybersecurity & Telecom',
  'IoT & Embedded Systems',
];

const LEVEL_OPTIONS: Array<{ id: 'beginner' | 'intermediate' | 'advanced' | 'all_levels'; label: string; desc: string }> = [
  { id: 'beginner', label: 'Beginner', desc: 'No prior telecom background needed' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Basic networking & signals knowledge' },
  { id: 'advanced', label: 'Advanced', desc: 'Protocol architectures & engineering math' },
  { id: 'all_levels', label: 'All Levels', desc: 'Foundations to advanced masterclass' },
];

const THUMBNAIL_PRESETS = [
  {
    name: '5G Cellular Tower',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Global Satellite NTN',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Data Center & Edge Cloud',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Circuit Board & Silicon',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  },
];

export function Step1CourseInfo({ course, onChange, onNext }: Step1CourseInfoProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [generatingWithAI, setGeneratingWithAI] = useState(false);

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

  const handleUpdateTemplate = (updates: Partial<CourseTemplateConfig>) => {
    onChange({
      template_config: {
        ...template,
        ...updates,
      },
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const existing = course.tags || [];
      if (!existing.includes(tagInput.trim().toLowerCase())) {
        onChange({ tags: [...existing, tagInput.trim().toLowerCase()] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const existing = course.tags || [];
    onChange({ tags: existing.filter((t) => t !== tagToRemove) });
  };

  const handleGenerateDescriptionAI = async () => {
    if (!course.title) return;
    try {
      setGeneratingWithAI(true);
      const res = await fetch('/api/ai/improve-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'expand',
          content: `Course Title: ${course.title}. Category: ${course.category || '5G & Mobile Networks'}. Target Level: ${course.level || 'intermediate'}.`,
          instruction: 'Generate a compelling 2-sentence summary and a detailed multi-paragraph course overview covering telecom industry relevance and architecture skills learned.',
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        onChange({
          detailed_description: data.result,
          summary: course.summary || data.result.slice(0, 180) + '...',
        });
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setGeneratingWithAI(false);
    }
  };

  const presetThemes: Array<{ id: CourseTheme; name: string; primary: string; secondary: string; desc: string }> = [
    { id: 'telecom_classic', name: 'Telecom Classic', primary: '#0284c7', secondary: '#6366f1', desc: 'Sleek dark telecom network palette with cyan and indigo accents.' },
    { id: 'modern', name: 'Modern Electric', primary: '#10b981', secondary: '#06b6d4', desc: 'Vibrant emerald & cyan high-tech finish.' },
    { id: 'minimal', name: 'Minimal Monochrome', primary: '#000000', secondary: '#71717a', desc: 'Clean, distraction-free architectural styling.' },
    { id: 'professional', name: 'Executive Blue', primary: '#1d4ed8', secondary: '#4338ca', desc: 'Formal telecom enterprise training aesthetic.' },
  ];

  const isFree = !course.price || course.price === 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step 1 of 7 • Course Identity & Fundamentals</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
            Course Information & Identity
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Configure metadata, pricing model, instructor credentials, and visual artwork for your course.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTemplateModal(true)}
          className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 ${
            isLight
              ? 'bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-800'
              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
          }`}
        >
          <Palette className="w-4 h-4 text-sky-500" />
          <span>Styling Theme ({template.theme.replace('_', ' ')})</span>
        </button>
      </div>

      {/* 2-COLUMN GRID: Left Form Controls, Right Sticky Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: FORM SECTIONS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION 1: CORE COURSE IDENTITY */}
          <div className={`p-6 sm:p-7 rounded-3xl border space-y-5 shadow-xs ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center space-x-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  Course Identity & Description
                </h3>
                <p className="text-[11px] text-zinc-400">Title, instructor bio, and detailed learning syllabus.</p>
              </div>
            </div>

            {/* Course Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-zinc-400">
                  {(course.title || '').length} / 100
                </span>
              </div>
              <input
                type="text"
                maxLength={100}
                placeholder="e.g. 5G Standalone Architecture, Core Protocols & Slicing"
                value={course.title || ''}
                onChange={(e) => onChange({ title: e.target.value })}
                className={`w-full px-4 py-3 rounded-2xl border font-bold text-sm outline-none transition focus:ring-2 ring-sky-500/20 ${
                  isLight ? 'bg-zinc-50 border-zinc-300 text-black focus:border-black' : 'bg-zinc-900 border-zinc-700 text-white focus:border-white'
                }`}
              />
            </div>

            {/* Instructor Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Lead Instructor / Specialist Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Gaurav K. Sinhaa, Telecom Systems Specialist"
                  value={course.trainer_name || ''}
                  onChange={(e) => onChange({ trainer_name: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm outline-none transition focus:ring-2 ring-sky-500/20 ${
                    isLight ? 'bg-zinc-50 border-zinc-300 text-black focus:border-black' : 'bg-zinc-900 border-zinc-700 text-white focus:border-white'
                  }`}
                />
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>

            {/* Short Summary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Course Headline & Short Summary <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-zinc-400">
                  {(course.summary || '').length} / 220
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={220}
                placeholder="Master 4G LTE, 5G NR architecture, massive MIMO beamforming, and core network slicing."
                value={course.summary || ''}
                onChange={(e) => onChange({ summary: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-2xl border text-sm outline-none transition resize-none focus:ring-2 ring-sky-500/20 ${
                  isLight ? 'bg-zinc-50 border-zinc-300 text-black focus:border-black' : 'bg-zinc-900 border-zinc-700 text-white focus:border-white'
                }`}
              />
            </div>

            {/* Detailed Description with AI Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Detailed Course Description
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescriptionAI}
                  disabled={generatingWithAI || !course.title}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-sky-500/15 to-indigo-500/15 border border-sky-500/30 text-xs font-bold text-sky-600 dark:text-sky-400 hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>{generatingWithAI ? 'Synthesizing with AI...' : '✨ Generate with AI'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                placeholder="Detailed curriculum overview explaining industry relevance, system architectures, and technical competencies..."
                value={course.detailed_description || course.description || ''}
                onChange={(e) => onChange({ detailed_description: e.target.value, description: e.target.value })}
                className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none transition resize-none focus:ring-2 ring-sky-500/20 leading-relaxed ${
                  isLight ? 'bg-zinc-50 border-zinc-300 text-black focus:border-black' : 'bg-zinc-900 border-zinc-700 text-white focus:border-white'
                }`}
              />
            </div>

            {/* Category Pills */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Primary Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_PRESETS.map((cat) => {
                  const isSelected = (course.category || '5G & Mobile Networks') === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => onChange({ category: cat })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs scale-102'
                          : isLight
                          ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty Level Cards */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Difficulty Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {LEVEL_OPTIONS.map((lvl) => {
                  const isSelected = (course.level || 'intermediate') === lvl.id;
                  return (
                    <div
                      key={lvl.id}
                      onClick={() => onChange({ level: lvl.id })}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-black dark:border-white bg-zinc-50 dark:bg-zinc-900 shadow-xs'
                          : isLight
                          ? 'border-zinc-200 hover:border-zinc-300 bg-white'
                          : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black">{lvl.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />}
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2">{lvl.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: PRICING & COURSE ACCESS */}
          <div className={`p-6 sm:p-7 rounded-3xl border space-y-5 shadow-xs ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center space-x-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  Pricing & Monetization
                </h3>
                <p className="text-[11px] text-zinc-400">Set course currency, pricing tier, or offer free open-access.</p>
              </div>
            </div>

            {/* Free vs Paid Segmented Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onChange({ price: 0, course_type: 'free' })}
                className={`py-3 px-4 rounded-2xl border-2 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  isFree
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                    : isLight
                    ? 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                    : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Free Open Access</span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ price: course.price && course.price > 0 ? course.price : 49, course_type: 'paid' })}
                className={`py-3 px-4 rounded-2xl border-2 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  !isFree
                    ? 'border-black dark:border-white bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white ring-2 ring-black/10 dark:ring-white/10'
                    : isLight
                    ? 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                    : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Paid Premium Course</span>
              </button>
            </div>

            {/* Price Inputs (Shown if paid) */}
            {!isFree && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 animate-in fade-in">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Course Price
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="49"
                      value={course.price ?? 49}
                      onChange={(e) => onChange({ price: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border font-mono font-bold text-base outline-none transition focus:ring-2 ring-sky-500/20 ${
                        isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                      }`}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-400 text-sm">
                      {getCurrencySymbol(course.currency || 'INR')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Currency
                  </label>
                  <select
                    value={course.currency || 'INR'}
                    onChange={(e) => onChange({ currency: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm font-bold outline-none transition cursor-pointer ${
                      isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) — {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Duration and Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Estimated Total Duration
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="15"
                    step="5"
                    placeholder="160"
                    value={course.course_duration ?? 160}
                    onChange={(e) => onChange({ course_duration: parseInt(e.target.value, 10) || 60 })}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border font-mono text-sm outline-none transition ${
                      isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  />
                  <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    minutes
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Instruction Language
                </label>
                <select
                  value={course.default_language || 'en'}
                  onChange={(e) => onChange({ default_language: e.target.value as any })}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm font-bold outline-none transition cursor-pointer ${
                    isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                >
                  <option value="en">English (Global)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="mr">Marathi (मराठी)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: VISUAL ARTWORK & MEDIA */}
          <div className={`p-6 sm:p-7 rounded-3xl border space-y-5 shadow-xs ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center space-x-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  Visual Artwork & Keywords
                </h3>
                <p className="text-[11px] text-zinc-400">High-resolution cover image and catalog discovery tags.</p>
              </div>
            </div>

            {/* Thumbnail URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Course Thumbnail URL
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-1518770660439-4636190af475..."
                value={course.thumbnail_url || ''}
                onChange={(e) => onChange({ thumbnail_url: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-mono outline-none transition ${
                  isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                }`}
              />
            </div>

            {/* Clickable Preset Wallpapers */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Quick High-Res Telecom Artwork Presets:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {THUMBNAIL_PRESETS.map((preset) => {
                  const isSelected = course.thumbnail_url === preset.url;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => onChange({ thumbnail_url: preset.url })}
                      className={`group relative aspect-video rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                        isSelected ? 'border-sky-500 ring-2 ring-sky-500/30' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/60 flex items-end p-1.5">
                        <span className="text-[10px] font-bold text-white leading-tight line-clamp-1">{preset.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Course Discovery Tags
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type a tag & press Enter (e.g. 5g, lte, beamforming)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-2xl border text-sm outline-none transition ${
                    isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-wider hover:opacity-90 transition cursor-pointer"
                >
                  Add Tag
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(course.tags || ['telecom', '5g', 'networking']).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 ml-1 text-sm font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY LIVE STUDENT DISCOVERY PREVIEW (5 cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
              <Eye className="w-4 h-4 text-emerald-500" />
              <span>Live Student Discovery Card</span>
            </div>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Sync</span>
            </span>
          </div>

          {/* Student Card Preview */}
          <div
            className={`rounded-3xl border overflow-hidden transition-all duration-300 shadow-2xl ${
              isLight ? 'bg-white border-zinc-200 shadow-zinc-200/50' : 'bg-zinc-950 border-zinc-800 shadow-black/60'
            }`}
          >
            {/* Thumbnail Header with Category & Level */}
            <div className="relative aspect-video bg-zinc-900 overflow-hidden">
              <img
                src={
                  course.thumbnail_url ||
                  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
                }
                alt="Course cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex items-center space-x-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm"
                  style={{ backgroundColor: template.primaryColor || '#0284c7' }}
                >
                  {course.category || '5G & Mobile Networks'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-black/60 backdrop-blur text-white border border-white/20">
                  {course.level || 'Intermediate'}
                </span>
              </div>

              {/* Price Tag in Thumbnail */}
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/80 backdrop-blur border border-white/20 text-white font-black text-sm font-mono">
                {course.price && course.price > 0 ? (
                  <span>
                    {getCurrencySymbol(course.currency || 'INR')} {course.price}
                  </span>
                ) : (
                  <span className="text-emerald-400">FREE</span>
                )}
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug line-clamp-2">
                  {course.title || 'Untitled Telecom Course'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {course.summary || 'Master 4G LTE, 5G NR architecture, massive MIMO beamforming, and core network slicing.'}
                </p>
              </div>

              {/* Instructor Badge */}
              <div className="flex items-center space-x-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                  style={{ backgroundColor: template.secondaryColor || '#6366f1' }}
                >
                  {(course.trainer_name || 'G').charAt(0).toUpperCase()}
                </div>
                <div className="text-xs truncate">
                  <span className="text-zinc-400">Instructor: </span>
                  <span className="font-bold">{course.trainer_name || 'Gaurav K. Sinhaa'}</span>
                </div>
              </div>

              {/* Course Metrics */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-center text-xs">
                <div>
                  <div className="font-black font-mono">{course.modules?.length || 5}</div>
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">Modules</div>
                </div>
                <div className="border-x border-zinc-200 dark:border-zinc-800">
                  <div className="font-black font-mono">{course.course_duration || 160}m</div>
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">Duration</div>
                </div>
                <div>
                  <div className="font-black flex items-center justify-center space-x-0.5 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>5.0</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">Rating</div>
                </div>
              </div>

              {/* Mock Student CTA */}
              <button
                type="button"
                className="w-full py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-wider transition shadow-md hover:opacity-90 cursor-default"
                style={{ backgroundColor: template.primaryColor || '#0284c7' }}
              >
                Enroll in Course • {course.price && course.price > 0 ? `${getCurrencySymbol(course.currency || 'INR')} ${course.price}` : 'Free'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION FOOTER */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg ${
        isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
      }`}>
        <div className="space-y-0.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
            Course Identity Complete
          </h4>
          <p className="text-[11px] text-zinc-400">
            Next: Structure module roadmaps, sequencing, and learning outcomes.
          </p>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="px-8 py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider hover:opacity-90 transition active:scale-95 shadow-md flex items-center justify-center space-x-2 cursor-pointer"
        >
          <span>Continue to Curriculum Roadmap</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* CUSTOMIZE TEMPLATE MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 sm:p-8 ${isLight ? 'bg-white border-zinc-200 text-black' : 'bg-zinc-950 border-zinc-800 text-white'}`}>
            <button
              onClick={() => setShowTemplateModal(false)}
              className="absolute right-6 top-6 p-2 rounded-full text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black">Course Visual Theme & Palette</h3>
                <p className="text-xs text-zinc-500">
                  Custom styling applied to student slide player, cards, certificates, and badges.
                </p>
              </div>
            </div>

            {/* Preset Themes */}
            <div className="space-y-4 mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                Select Theme Preset
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {presetThemes.map((t) => {
                  const isSelected = template.theme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleUpdateTemplate({ theme: t.id, primaryColor: t.primary, secondaryColor: t.secondary })}
                      className={`p-4 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500/5 ring-2 ring-sky-500/20'
                          : isLight
                          ? 'border-zinc-200 hover:border-zinc-300'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.primary }} />
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.secondary }} />
                          <span className="font-bold text-sm">{t.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-500" />}
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">{t.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Palette */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Primary Brand Accent
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={template.primaryColor}
                    onChange={(e) => handleUpdateTemplate({ primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={template.primaryColor}
                    onChange={(e) => handleUpdateTemplate({ primaryColor: e.target.value })}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border font-mono text-xs ${isLight ? 'border-zinc-300' : 'border-zinc-700 bg-zinc-900'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Secondary Accent
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={template.secondaryColor}
                    onChange={(e) => handleUpdateTemplate({ secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={template.secondaryColor}
                    onChange={(e) => handleUpdateTemplate({ secondaryColor: e.target.value })}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border font-mono text-xs ${isLight ? 'border-zinc-300' : 'border-zinc-700 bg-zinc-900'}`}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowTemplateModal(false)}
              className="w-full py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider shadow-md hover:opacity-90 cursor-pointer"
            >
              Apply Theme Customization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
