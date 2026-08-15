'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Award, RotateCcw, Sparkles } from 'lucide-react';
import { Quiz } from '@signalhub/types';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

interface QuestionItem {
  questionId: string;
  questionText: string;
  explanation: string;
  options: Array<{ optionId: string; optionText: string; isCorrect: boolean }>;
}

interface QuizRunnerProps {
  quiz: Quiz;
  questions: QuestionItem[];
  onPass?: () => void;
}

export function QuizRunner({ quiz, questions, onPass }: QuizRunnerProps) {
  const { dict } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [scorePercent, setScorePercent] = useState(0);
  const [isPassed, setIsPassed] = useState(false);

  const handleOptionSelect = (qId: string, optId: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optId }));
  };

  const handleSubmit = () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    let correctCount = 0;
    questions.forEach((q) => {
      const selected = selectedAnswers[q.questionId];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (correctOpt && selected === correctOpt.optionId) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= quiz.passing_score_percent;

    setScorePercent(score);
    setIsPassed(passed);
    setSubmitted(true);

    if (passed) {
      onPass?.();
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setScorePercent(0);
    setIsPassed(false);
  };

  return (
    <div className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 max-w-3xl mx-auto transition-all ${
      isLight
        ? 'bg-white border-zinc-300 shadow-md text-black'
        : 'bg-zinc-950 border-zinc-400 text-white shadow-xl'
    }`}>
      {/* Quiz Header (Black & White) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{quiz.quiz_type === 'module_quiz' ? (dict.moduleQuiz || 'Module Quiz') : (dict.surpriseQuiz || 'Assessment Exam')}</span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-black mt-1 ${isLight ? 'text-black' : 'text-white'}`}>{quiz.title}</h2>
        </div>
        <div className="sm:text-right shrink-0">
          <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">Passing Threshold</span>
          <span className="px-3.5 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-mono font-black border border-zinc-800 dark:border-zinc-200 inline-block mt-0.5">
            {quiz.passing_score_percent}% Required
          </span>
        </div>
      </div>

      {/* Result Banner (Post-submission Monochrome) */}
      {submitted && (
        <div
          className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${
            isPassed
              ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
              : 'bg-zinc-100 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 text-black dark:text-white'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            {isPassed ? (
              <Award className="w-8 h-8 shrink-0 text-white dark:text-black" />
            ) : (
              <XCircle className="w-8 h-8 shrink-0 text-black dark:text-white" />
            )}
            <div>
              <p className="font-black text-base">
                {isPassed ? 'Congratulations! Quiz Passed 🎉' : 'Assessment Threshold Not Met'}
              </p>
              <p className="text-xs font-mono font-medium opacity-90 mt-0.5">
                Your Score: <strong className="font-black">{scorePercent}%</strong> (Required: {quiz.passing_score_percent}%)
              </p>
            </div>
          </div>
          {!isPassed && (
            <button
              onClick={handleRetry}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-black hover:opacity-90 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Quiz</span>
            </button>
          )}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.questionId} className={`p-5 rounded-2xl border space-y-3.5 ${
            isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-800 text-white'
          }`}>
            <h3 className="text-sm font-black flex items-start space-x-2">
              <span className="font-mono text-zinc-500">Q{idx + 1}.</span>
              <span className={isLight ? 'text-black' : 'text-white'}>{q.questionText}</span>
            </h3>

            {/* Options */}
            <div className="space-y-2.5 pt-1">
              {q.options.map((opt) => {
                const isSelected = selectedAnswers[q.questionId] === opt.optionId;
                let optionStyle = isLight
                  ? 'bg-white border-zinc-300 text-black hover:border-black'
                  : 'bg-zinc-950 border-zinc-800 text-white hover:border-zinc-400';

                if (submitted) {
                  if (opt.isCorrect) {
                    optionStyle = 'bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white font-black shadow-md';
                  } else if (isSelected && !opt.isCorrect) {
                    optionStyle = 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-400 line-through';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white font-black shadow-md';
                }

                return (
                  <button
                    key={opt.optionId}
                    disabled={submitted}
                    onClick={() => handleOptionSelect(q.questionId, opt.optionId)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${optionStyle}`}
                  >
                    <span>{opt.optionText}</span>
                    {submitted && opt.isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-white dark:text-black shrink-0" />
                    )}
                    {submitted && isSelected && !opt.isCorrect && (
                      <XCircle className="w-4 h-4 text-zinc-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation box after submission */}
            {submitted && (
              <div className="mt-3 p-3.5 bg-white dark:bg-black rounded-xl border border-zinc-300 dark:border-zinc-800 text-xs space-y-1">
                <p className="font-mono font-bold text-zinc-500 flex items-center space-x-1 uppercase text-[10px]">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Explanation:</span>
                </p>
                <p className="font-medium text-black dark:text-white leading-relaxed">{q.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs shadow-md border border-black dark:border-white transition-all cursor-pointer active:scale-95"
          >
            Submit Quiz for Verification
          </button>
        </div>
      )}
    </div>
  );
}

export default QuizRunner;
