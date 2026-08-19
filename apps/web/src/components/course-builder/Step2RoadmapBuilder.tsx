'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  HelpCircle,
  Clock,
  CheckCircle2,
  Edit3,
  GripVertical,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Check,
  Zap,
  Eye,
  FileText
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Module, CourseSlide, Quiz } from '@signalhub/types';

interface Step2RoadmapBuilderProps {
  modules: Module[];
  onChange: (modules: Module[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step2RoadmapBuilder({
  modules,
  onChange,
  onNext,
  onPrev,
}: Step2RoadmapBuilderProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [objectiveInput, setObjectiveInput] = useState<{ [modId: string]: string }>({});
  const [enhancingModuleId, setEnhancingModuleId] = useState<string | null>(null);

  // Add new module
  const handleAddModule = () => {
    const newIndex = modules.length + 1;
    const newMod: Module = {
      id: `mod-${Date.now()}`,
      course_id: '',
      title: `Module ${newIndex}: Core Telecom Architecture`,
      description: 'Overview of protocol stack, network entities, and interface procedures.',
      sequence_order: newIndex,
      duration_minutes: 30,
      is_free_preview: newIndex === 1,
      has_quiz: true,
      learning_outcomes: [
        'Understand foundational protocol specifications',
        'Analyze signal flows and control-plane signaling',
      ],
      slides: [
        {
          id: `s-${Date.now()}-1`,
          slide_number: 1,
          title: `Slide 1: Architectural Foundations`,
          content_type: 'block_based',
          blocks: [
            { id: 'b1', type: 'heading', content: { text: 'Key Architectural Concepts', level: 2 } },
            { id: 'b2', type: 'paragraph', content: { text: 'Introduction to this module topic and network elements.' } },
          ],
        },
      ],
      quiz: {
        id: `quiz-${Date.now()}`,
        title: `Module ${newIndex} Assessment`,
        passing_score_percent: 80,
        questions: [
          {
            id: `q-${Date.now()}`,
            question_text: 'Which network entity terminates the control plane in 5G standalone architecture?',
            question_type: 'single_choice',
            difficulty: 'medium',
            explanation: 'In 5G SA, the Access and Mobility Management Function (AMF) terminates NAS signaling.',
            options: [
              { id: 'o1', option_text: 'AMF (Access and Mobility Management Function)', is_correct: true, sequence_order: 1 },
              { id: 'o2', option_text: 'UPF (User Plane Function)', is_correct: false, sequence_order: 2 },
              { id: 'o3', option_text: 'SMF (Session Management Function)', is_correct: false, sequence_order: 3 },
            ],
          },
        ],
      },
      created_at: new Date().toISOString(),
    };
    onChange([...modules, newMod]);
    setEditingModuleId(newMod.id);
  };

  // Duplicate module
  const handleDuplicateModule = (mod: Module, index: number) => {
    const duplicated: Module = {
      ...mod,
      id: `mod-${Date.now()}`,
      title: `${mod.title} (Copy)`,
      sequence_order: index + 2,
      slides: (mod.slides || []).map((s, i) => ({
        ...s,
        id: `s-${Date.now()}-${i + 1}`,
      })),
      quiz: mod.quiz ? { ...mod.quiz, id: `quiz-${Date.now()}` } : undefined,
    };
    const updated = [...modules];
    updated.splice(index + 1, 0, duplicated);
    const reindexed = updated.map((m, i) => ({ ...m, sequence_order: i + 1 }));
    onChange(reindexed);
  };

  // Delete module
  const handleDeleteModule = (id: string) => {
    if (modules.length <= 1) {
      alert('A course must contain at least one module.');
      return;
    }
    const filtered = modules.filter((m) => m.id !== id);
    const reindexed = filtered.map((m, i) => ({ ...m, sequence_order: i + 1 }));
    onChange(reindexed);
    if (editingModuleId === id) setEditingModuleId(null);
  };

  // Move module up/down
  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === modules.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...modules];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reindexed = updated.map((m, i) => ({ ...m, sequence_order: i + 1 }));
    onChange(reindexed);
  };

  // Update specific module
  const handleUpdateModule = (id: string, updates: Partial<Module>) => {
    const updated = modules.map((m) => (m.id === id ? { ...m, ...updates } : m));
    onChange(updated);
  };

  // Add learning outcome
  const handleAddObjective = (modId: string) => {
    const text = (objectiveInput[modId] || '').trim();
    if (!text) return;
    const mod = modules.find((m) => m.id === modId);
    if (!mod) return;
    const outcomes = mod.learning_outcomes || [];
    handleUpdateModule(modId, { learning_outcomes: [...outcomes, text] });
    setObjectiveInput({ ...objectiveInput, [modId]: '' });
  };

  const handleRemoveObjective = (modId: string, idxToRemove: number) => {
    const mod = modules.find((m) => m.id === modId);
    if (!mod) return;
    const outcomes = (mod.learning_outcomes || []).filter((_, i) => i !== idxToRemove);
    handleUpdateModule(modId, { learning_outcomes: outcomes });
  };

  // AI Enhance Single Module Outcomes
  const handleAIEnhanceModule = async (mod: Module) => {
    try {
      setEnhancingModuleId(mod.id);
      const res = await fetch('/api/ai/improve-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'expand',
          content: `Module: ${mod.title}. Description: ${mod.description}`,
          instruction: 'Generate 4 rigorous, technical learning outcomes suitable for telecommunications engineers.',
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        const lines = data.result
          .split('\n')
          .map((l: string) => l.replace(/^[-*•\d.]+\s*/, '').trim())
          .filter((l: string) => l.length > 5)
          .slice(0, 4);

        if (lines.length > 0) {
          handleUpdateModule(mod.id, { learning_outcomes: lines });
        }
      }
    } catch (e) {
      console.error('Module AI error:', e);
    } finally {
      setEnhancingModuleId(null);
    }
  };

  const totalDuration = modules.reduce((acc, m) => acc + (m.duration_minutes || 30), 0);
  const totalSlides = modules.reduce((acc, m) => acc + (m.slides || m.slides_data || []).length, 0);
  const totalQuizzes = modules.filter((m) => m.has_quiz).length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Step 2 of 7 • Curriculum Roadmap</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
            Curriculum Structure & Modules
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Sequence your course curriculum into focused modules with defined learning outcomes and milestone assessments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddModule}
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider hover:opacity-90 transition active:scale-95 shadow-md shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Module</span>
        </button>
      </div>

      {/* Curriculum Summary Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
          <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Total Modules</div>
          <div className="text-xl font-black font-mono mt-1 text-black dark:text-white">{modules.length}</div>
        </div>
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
          <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Est. Duration</div>
          <div className="text-xl font-black font-mono mt-1 text-black dark:text-white">{totalDuration}m</div>
        </div>
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
          <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Total Slides</div>
          <div className="text-xl font-black font-mono mt-1 text-black dark:text-white">{totalSlides}</div>
        </div>
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
          <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Module Quizzes</div>
          <div className="text-xl font-black font-mono mt-1 text-black dark:text-white">{totalQuizzes}</div>
        </div>
      </div>

      {/* Module Timeline Cards List */}
      <div className="space-y-4">
        {modules.map((mod, index) => {
          const isExpanded = editingModuleId === mod.id;
          const slideCount = (mod.slides || mod.slides_data || []).length;
          const formattedIndex = String(index + 1).padStart(2, '0');

          return (
            <div
              key={mod.id}
              className={`rounded-3xl border transition-all duration-200 shadow-xs overflow-hidden ${
                isExpanded
                  ? isLight
                    ? 'border-black bg-white shadow-lg ring-4 ring-black/5'
                    : 'border-white bg-zinc-950 shadow-lg ring-4 ring-white/5'
                  : isLight
                  ? 'border-zinc-200 bg-white hover:border-zinc-300'
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              {/* Module Header Bar */}
              <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Sequence Number */}
                  <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black flex items-center justify-center text-sm shrink-0 font-mono shadow-xs">
                    {formattedIndex}
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="text-sm sm:text-base font-black truncate">{mod.title}</h3>
                      {mod.is_free_preview && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Free Preview
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-zinc-400 mt-1 font-medium">
                      <span>{slideCount} {slideCount === 1 ? 'Slide' : 'Slides'}</span>
                      <span>•</span>
                      <span>{mod.duration_minutes || 30} mins</span>
                      {mod.has_quiz && (
                        <>
                          <span>•</span>
                          <span className="text-sky-500 font-bold flex items-center space-x-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Assessment Included</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center space-x-1 shrink-0">
                  {/* Move Up/Down */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveModule(index, 'up')}
                    className="p-2 rounded-xl text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 cursor-pointer"
                    title="Move Module Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === modules.length - 1}
                    onClick={() => handleMoveModule(index, 'down')}
                    className="p-2 rounded-xl text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 cursor-pointer"
                    title="Move Module Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => handleDuplicateModule(mod, index)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Duplicate Module"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteModule(mod.id)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                    title="Delete Module"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Edit Toggle */}
                  <button
                    type="button"
                    onClick={() => setEditingModuleId(isExpanded ? null : mod.id)}
                    className={`ml-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
                      isExpanded
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : isLight
                        ? 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                        : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isExpanded ? 'Collapse' : 'Configure'}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Edit Details Panel */}
              {isExpanded && (
                <div className="p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800/80 mt-2 space-y-5 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        Module Title
                      </label>
                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) => handleUpdateModule(mod.id, { title: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-bold outline-none transition ${
                          isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        Est. Duration (mins)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={mod.duration_minutes || 30}
                          onChange={(e) =>
                            handleUpdateModule(mod.id, { duration_minutes: parseInt(e.target.value, 10) || 30 })
                          }
                          className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-mono outline-none transition ${
                            isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                          }`}
                        />
                        <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Module Description & Scope
                    </label>
                    <textarea
                      rows={2}
                      value={mod.description || ''}
                      onChange={(e) => handleUpdateModule(mod.id, { description: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-2xl border text-sm outline-none transition resize-none ${
                        isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                      }`}
                    />
                  </div>

                  {/* Learning Objectives List with AI Enhancer */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        Key Learning Objectives
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAIEnhanceModule(mod)}
                        disabled={enhancingModuleId === mod.id}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-sky-500 hover:text-sky-600 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{enhancingModuleId === mod.id ? 'Synthesizing...' : '✨ AI Suggest Objectives'}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Add objective (e.g. Analyze 5G RAN fronthaul latency)..."
                        value={objectiveInput[mod.id] || ''}
                        onChange={(e) => setObjectiveInput({ ...objectiveInput, [mod.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddObjective(mod.id);
                          }
                        }}
                        className={`flex-1 px-4 py-2 rounded-2xl border text-xs outline-none transition ${
                          isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddObjective(mod.id)}
                        className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {(mod.learning_outcomes || []).map((outcome, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between text-xs py-2 px-3.5 rounded-xl border ${
                            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="font-medium">{outcome}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveObjective(mod.id, idx)}
                            className="text-zinc-400 hover:text-red-500 font-bold ml-2 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Access & Assessment Toggles */}
                  <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mod.has_quiz ?? true}
                        onChange={(e) => handleUpdateModule(mod.id, { has_quiz: e.target.checked })}
                        className="w-4 h-4 rounded text-black dark:text-white"
                      />
                      <span>Include Module Quiz at end</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mod.is_free_preview ?? false}
                        onChange={(e) => handleUpdateModule(mod.id, { is_free_preview: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-500"
                      />
                      <span>Free Preview (Students can view without enrolling)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg ${
        isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
      }`}>
        <button
          type="button"
          onClick={onPrev}
          className={`inline-flex items-center space-x-2 px-5 py-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            isLight ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700' : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course Info</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-8 py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider hover:opacity-90 transition active:scale-95 shadow-md flex items-center justify-center space-x-2 cursor-pointer"
        >
          <span>Continue to Content Studio (Step 3)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
