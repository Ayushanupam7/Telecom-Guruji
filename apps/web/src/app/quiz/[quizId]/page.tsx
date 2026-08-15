'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { QuizRunner } from '@/components/QuizRunner';
import { DEMO_QUIZ_DATA } from '@/lib/mockData';
import { Award } from 'lucide-react';

export default function QuizPage({ params }: { params: { quizId: string } }) {
  const quizData = DEMO_QUIZ_DATA[params.quizId] || DEMO_QUIZ_DATA['1c111111-1111-1111-1111-111111111111'];
  const [passed, setPassed] = useState(false);

  return (
    <div className="space-y-6 py-4">
      <QuizRunner
        quiz={quizData.quiz}
        questions={quizData.questions}
        onPass={() => setPassed(true)}
      />

      {passed && (
        <div className="glass-panel p-6 rounded-xl border border-emerald-500/40 bg-emerald-950/20 max-w-3xl mx-auto text-center space-y-4">
          <Award className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Module 1 Completed & Verified!</h2>
          <p className="text-xs text-slate-300">
            You have satisfied all lesson engagement requirements and passed the module assessment.
          </p>
          <div className="pt-2">
            <a
              href="/certificates/cert-demo-777"
              className="glass-button px-6 py-2.5 rounded-lg text-white font-bold text-xs inline-block"
            >
              Generate Verified Certificate
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
