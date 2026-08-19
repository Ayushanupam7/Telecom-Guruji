'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  HelpCircle,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Sliders
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Module, FinalAssessment, Question, QuestionType } from '@signalhub/types';

interface Step4AssessmentBuilderProps {
  courseTitle: string;
  modules: Module[];
  finalAssessment?: FinalAssessment;
  onUpdateModules: (modules: Module[]) => void;
  onUpdateFinalAssessment: (assessment: FinalAssessment) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step4AssessmentBuilder({
  courseTitle,
  modules,
  finalAssessment,
  onUpdateModules,
  onUpdateFinalAssessment,
  onNext,
  onPrev,
}: Step4AssessmentBuilderProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'module_quizzes' | 'final_assessment'>('module_quizzes');
  const [selectedModIdx, setSelectedModIdx] = useState(0);
  const [generatingAI, setGeneratingAI] = useState(false);

  const activeModule = modules[selectedModIdx] || modules[0];
  const activeQuiz = activeModule?.quiz || {
    id: `quiz-${activeModule?.id || 'default'}`,
    title: `${activeModule?.title || 'Module'} Assessment Quiz`,
    passing_score_percent: 80,
    time_limit_minutes: 10,
    max_attempts: 3,
    questions: [],
  };

  const activeFinalAssessment: FinalAssessment = finalAssessment || {
    id: `fa-${Date.now()}`,
    title: `${courseTitle || 'Telecom Mastery'} Final Certification Assessment`,
    description: 'Comprehensive evaluation covering all modules. Passing awards verified certificate.',
    passing_score_percent: 80,
    time_limit_minutes: 30,
    max_attempts: 3,
    questions: [
      {
        id: `fq-1`,
        question_text: 'Which technology enables sub-1ms latency in 5G standalone networks?',
        question_type: 'single_choice',
        difficulty: 'medium',
        explanation: '5G URLLC (Ultra-Reliable Low-Latency Communication) combined with Multi-access Edge Computing (MEC) enables sub-millisecond round-trip latency.',
        options: [
          { id: 'fo-1', option_text: '5G URLLC and Multi-access Edge Computing (MEC)', is_correct: true, sequence_order: 1 },
          { id: 'fo-2', option_text: 'Higher GSM 2G modulation indices', is_correct: false, sequence_order: 2 },
          { id: 'fo-3', option_text: 'Single-channel copper cabling', is_correct: false, sequence_order: 3 },
        ],
      },
    ],
  };

  // Update current module quiz
  const handleUpdateQuiz = (updates: any) => {
    const updatedModules = [...modules];
    const mod = { ...updatedModules[selectedModIdx] };
    mod.quiz = {
      ...activeQuiz,
      ...updates,
    };
    updatedModules[selectedModIdx] = mod;
    onUpdateModules(updatedModules);
  };

  // Add question to active quiz or final assessment
  const handleAddQuestion = (isFinal = false) => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      question_text: 'New technical assessment question?',
      question_type: 'single_choice',
      difficulty: 'medium',
      explanation: 'Detailed technical explanation of the correct choice.',
      options: [
        { id: `opt-${Date.now()}-1`, option_text: 'Correct Option', is_correct: true, sequence_order: 1 },
        { id: `opt-${Date.now()}-2`, option_text: 'Distractor Option 1', is_correct: false, sequence_order: 2 },
        { id: `opt-${Date.now()}-3`, option_text: 'Distractor Option 2', is_correct: false, sequence_order: 3 },
        { id: `opt-${Date.now()}-4`, option_text: 'Distractor Option 3', is_correct: false, sequence_order: 4 },
      ],
    };

    if (isFinal) {
      onUpdateFinalAssessment({
        ...activeFinalAssessment,
        questions: [...(activeFinalAssessment.questions || []), newQ],
      });
    } else {
      handleUpdateQuiz({
        questions: [...(activeQuiz.questions || []), newQ],
      });
    }
  };

  // Update question
  const handleUpdateQuestion = (qIndex: number, updates: Partial<Question>, isFinal = false) => {
    if (isFinal) {
      const qList = [...(activeFinalAssessment.questions || [])];
      qList[qIndex] = { ...qList[qIndex], ...updates };
      onUpdateFinalAssessment({ ...activeFinalAssessment, questions: qList });
    } else {
      const qList = [...(activeQuiz.questions || [])];
      qList[qIndex] = { ...qList[qIndex], ...updates };
      handleUpdateQuiz({ questions: qList });
    }
  };

  // Delete question
  const handleDeleteQuestion = (qIndex: number, isFinal = false) => {
    if (isFinal) {
      const qList = (activeFinalAssessment.questions || []).filter((_, i) => i !== qIndex);
      onUpdateFinalAssessment({ ...activeFinalAssessment, questions: qList });
    } else {
      const qList = (activeQuiz.questions || []).filter((_, i) => i !== qIndex);
      handleUpdateQuiz({ questions: qList });
    }
  };

  // Generate Questions via AI
  const handleGenerateQuestionsAI = async (isFinal = false) => {
    try {
      setGeneratingAI(true);
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle,
          moduleTitle: isFinal ? 'Comprehensive Final Assessment' : activeModule?.title,
          count: isFinal ? 5 : 3,
          difficulty: 'medium',
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.questions) {
        if (isFinal) {
          onUpdateFinalAssessment({
            ...activeFinalAssessment,
            questions: [...(activeFinalAssessment.questions || []), ...data.data.questions],
          });
        } else {
          handleUpdateQuiz({
            questions: [...(activeQuiz.questions || []), ...data.data.questions],
          });
        }
      }
    } catch (err) {
      console.error('AI Quiz Generation failed:', err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const renderQuestionCard = (q: Question, qIdx: number, isFinal = false) => (
    <div
      key={q.id || qIdx}
      className={`p-5 rounded-2xl border space-y-4 ${
        isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-wider text-sky-500 font-mono">
          Question {qIdx + 1}
        </span>
        <div className="flex items-center space-x-2">
          <select
            value={q.question_type || 'single_choice'}
            onChange={(e) =>
              handleUpdateQuestion(qIdx, { question_type: e.target.value as QuestionType }, isFinal)
            }
            className={`text-xs px-2.5 py-1 rounded-lg border font-bold ${
              isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
            }`}
          >
            <option value="single_choice">Single Choice</option>
            <option value="multiple_choice">Multiple Answers</option>
            <option value="true_false">True / False</option>
          </select>

          <button
            type="button"
            onClick={() => handleDeleteQuestion(qIdx, isFinal)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
            title="Delete Question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Text */}
      <textarea
        rows={2}
        value={q.question_text || ''}
        onChange={(e) => handleUpdateQuestion(qIdx, { question_text: e.target.value }, isFinal)}
        placeholder="Enter technical question text..."
        className={`w-full p-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 ${
          isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
        }`}
      />

      {/* Options List */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
          Answer Options (Select the correct answer)
        </label>
        {(q.options || []).map((opt, optIdx) => (
          <div
            key={opt.id || optIdx}
            className={`flex items-center space-x-2.5 p-2 rounded-xl border transition ${
              opt.is_correct
                ? isLight
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-emerald-500/80 bg-emerald-950/20'
                : isLight
                ? 'border-zinc-200 bg-zinc-50'
                : 'border-zinc-800 bg-zinc-900/60'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                const newOpts = (q.options || []).map((o, idx) => ({
                  ...o,
                  is_correct: q.question_type === 'multiple_choice' ? (idx === optIdx ? !o.is_correct : o.is_correct) : idx === optIdx,
                }));
                handleUpdateQuestion(qIdx, { options: newOpts }, isFinal);
              }}
              className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition ${
                opt.is_correct
                  ? 'bg-emerald-500 text-white border-transparent'
                  : 'border-zinc-400 dark:border-zinc-600'
              }`}
            >
              {opt.is_correct && <Check className="w-3.5 h-3.5" />}
            </button>

            <input
              type="text"
              value={opt.option_text || ''}
              onChange={(e) => {
                const newOpts = [...(q.options || [])];
                newOpts[optIdx] = { ...newOpts[optIdx], option_text: e.target.value };
                handleUpdateQuestion(qIdx, { options: newOpts }, isFinal);
              }}
              placeholder={`Option ${optIdx + 1}...`}
              className="flex-1 text-xs sm:text-sm bg-transparent border-0 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => {
                const newOpts = (q.options || []).filter((_, idx) => idx !== optIdx);
                handleUpdateQuestion(qIdx, { options: newOpts }, isFinal);
              }}
              className="text-zinc-400 hover:text-red-500 px-1 text-xs"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            const newOpts = [
              ...(q.options || []),
              {
                id: `opt-${Date.now()}-${(q.options || []).length + 1}`,
                option_text: 'New Option',
                is_correct: false,
                sequence_order: (q.options || []).length + 1,
              },
            ];
            handleUpdateQuestion(qIdx, { options: newOpts }, isFinal);
          }}
          className="text-xs text-sky-500 font-bold hover:underline pt-1"
        >
          + Add Option
        </button>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
          Explanation for Learner (Shown upon completion)
        </label>
        <input
          type="text"
          value={q.explanation || ''}
          onChange={(e) => handleUpdateQuestion(qIdx, { explanation: e.target.value }, isFinal)}
          placeholder="Explain why this answer is technically accurate..."
          className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
            isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
          }`}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sky-500 mb-1">
            <span>Step 4 of 7</span>
            <span>•</span>
            <span>Evaluations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
            Quizzes & Final Assessment Builder
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Build per-module quizzes and comprehensive final certification assessments with AI question generation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('module_quizzes')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'module_quizzes'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                : 'text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Module Quizzes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('final_assessment')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'final_assessment'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                : 'text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Final Assessment
          </button>
        </div>
      </div>

      {/* MODULE QUIZZES TAB */}
      {activeTab === 'module_quizzes' && (
        <div className="space-y-6">
          {/* Module Selector Bar */}
          <div className="overflow-x-auto scrollbar-none flex items-center space-x-2 py-1">
            {modules.map((mod, idx) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => setSelectedModIdx(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  selectedModIdx === idx
                    ? 'bg-sky-500 text-white shadow-sm'
                    : isLight
                    ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                Module {idx + 1} Quiz ({(mod.quiz?.questions || []).length}q)
              </button>
            ))}
          </div>

          {/* Quiz Settings Header */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-black flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-sky-500" />
                <span>{activeModule?.title} Assessment</span>
              </h3>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleGenerateQuestionsAI(false)}
                  disabled={generatingAI}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs hover:opacity-90 transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generatingAI ? 'Generating...' : '✨ Generate Questions with AI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddQuestion(false)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={activeQuiz.passing_score_percent || 80}
                  onChange={(e) =>
                    handleUpdateQuiz({ passing_score_percent: parseInt(e.target.value, 10) || 80 })
                  }
                  className={`w-full px-3 py-1.5 rounded-lg border text-sm font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Time Limit (Mins)
                </label>
                <input
                  type="number"
                  min="2"
                  value={activeQuiz.time_limit_minutes || 10}
                  onChange={(e) =>
                    handleUpdateQuiz({ time_limit_minutes: parseInt(e.target.value, 10) || 10 })
                  }
                  className={`w-full px-3 py-1.5 rounded-lg border text-sm font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Allowed Retries
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={activeQuiz.max_attempts || 3}
                  onChange={(e) =>
                    handleUpdateQuiz({ max_attempts: parseInt(e.target.value, 10) || 3 })
                  }
                  className={`w-full px-3 py-1.5 rounded-lg border text-sm font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Question Cards List */}
          <div className="space-y-4">
            {(activeQuiz.questions || []).length === 0 ? (
              <div className="py-12 text-center text-zinc-400 border-2 border-dashed rounded-2xl p-6">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-sky-500" />
                <p className="text-sm font-bold">No questions added yet for this module</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Click "Generate Questions with AI" or "Add Question" to build your quiz.
                </p>
              </div>
            ) : (
              (activeQuiz.questions || []).map((q, idx) => renderQuestionCard(q, idx, false))
            )}
          </div>
        </div>
      )}

      {/* FINAL ASSESSMENT TAB */}
      {activeTab === 'final_assessment' && (
        <div className="space-y-6">
          <div className={`p-5 rounded-2xl border space-y-4 ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Course Final Certification Exam</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Graded comprehensive assessment. Students must pass this to unlock their verified digital certificate.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleGenerateQuestionsAI(true)}
                  disabled={generatingAI}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs hover:opacity-90 transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generatingAI ? 'Generating...' : '✨ Generate Exam Questions with AI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddQuestion(true)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Passing Threshold (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={activeFinalAssessment.passing_score_percent || 80}
                  onChange={(e) =>
                    onUpdateFinalAssessment({
                      ...activeFinalAssessment,
                      passing_score_percent: parseInt(e.target.value, 10) || 80,
                    })
                  }
                  className={`w-full px-3 py-1.5 rounded-lg border text-sm font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Time Limit (Mins)
                </label>
                <input
                  type="number"
                  min="5"
                  value={activeFinalAssessment.time_limit_minutes || 30}
                  onChange={(e) =>
                    onUpdateFinalAssessment({
                      ...activeFinalAssessment,
                      time_limit_minutes: parseInt(e.target.value, 10) || 30,
                    })
                  }
                  className={`w-full px-3 py-1.5 rounded-lg border text-sm font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Exam Attempts Allowed
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={activeFinalAssessment.max_attempts || 3}
                  onChange={(e) =>
                    onUpdateFinalAssessment({
                      ...activeFinalAssessment,
                      max_attempts: parseInt(e.target.value, 10) || 3,
                    })
                  }
                  className={`w-full px-3 py-1.5 rounded-lg border text-sm font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {(activeFinalAssessment.questions || []).length === 0 ? (
              <div className="py-12 text-center text-zinc-400 border-2 border-dashed rounded-2xl p-6">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-50 text-amber-500" />
                <p className="text-sm font-bold">No final assessment questions added yet</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Click "Generate Exam Questions with AI" to generate a comprehensive 5-question starter test.
                </p>
              </div>
            ) : (
              (activeFinalAssessment.questions || []).map((q, idx) => renderQuestionCard(q, idx, true))
            )}
          </div>
        </div>
      )}

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
          <span>Back to Slide Studio</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center space-x-2 px-8 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition shadow-sm"
        >
          <span>Continue to Certificate Builder →</span>
        </button>
      </div>
    </div>
  );
}
