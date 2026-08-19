'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { 
  Signal, Award, BookOpen, CheckCircle2, ShieldCheck, 
  Sparkles, ArrowRight, Linkedin, Mail, Globe, Users, 
  Radio, Cpu, Layers, Star, DollarSign, PieChart, Lock, 
  UserCheck, Laptop, PlayCircle, FileText, Check, Workflow, RefreshCw
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function AboutPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="space-y-12 w-full max-w-6xl mx-auto font-sans pb-16 px-4 sm:px-6">
      {/* BREADCRUMBS */}
      <Breadcrumbs items={[{ label: 'About Us' }]} />

      {/* HERO SECTION */}
      <div className={`p-8 sm:p-12 rounded-3xl border-2 space-y-6 text-center relative overflow-hidden shadow-xl ${
        isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-950 border-zinc-800 text-white'
      }`}>
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-xs font-mono font-bold uppercase tracking-wider">
          <Signal className="w-4 h-4 text-emerald-500" />
          <span>Building Global Telecom Talent</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
          Why Telecom Guruji is the Future of Engineering E-Learning
        </h1>

        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed">
          Traditional telecom & software education relies on passive textbook reading without practical output. Telecom Guruji transforms e-learning into an interactive, hands-on workspace with live engagement verification, distraction-free lab views, and transparent educator payouts.
        </p>

        {/* HERO QUICK STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 max-w-3xl mx-auto">
          <div className={`p-4 rounded-2xl border text-center ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
            <p className="text-2xl sm:text-3xl font-black">50,000+</p>
            <p className="text-xs font-mono text-zinc-500 uppercase font-bold mt-1">Engineers Trained</p>
          </div>
          <div className={`p-4 rounded-2xl border text-center ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
            <p className="text-2xl sm:text-3xl font-black">80 / 20</p>
            <p className="text-xs font-mono text-zinc-500 uppercase font-bold mt-1">Instructor Payout</p>
          </div>
          <div className={`p-4 rounded-2xl border text-center ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
            <p className="text-2xl sm:text-3xl font-black">Minimal</p>
            <p className="text-xs font-mono text-zinc-500 uppercase font-bold mt-1">Course Prices</p>
          </div>
          <div className={`p-4 rounded-2xl border text-center ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
            <p className="text-2xl sm:text-3xl font-black">Verified</p>
            <p className="text-xs font-mono text-zinc-500 uppercase font-bold mt-1">Proof of Mastery</p>
          </div>
        </div>
      </div>

      {/* FOUNDER & LEAD ARCHITECT SPOTLIGHT CARD */}
      <div className={`p-8 sm:p-10 rounded-3xl border-2 space-y-8 relative overflow-hidden shadow-2xl ${
        isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-800 text-white'
      }`}>
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
          
          {/* FOUNDER AVATAR & BADGE */}
          <div className="flex flex-col items-center text-center space-y-4 shrink-0">
            <div className="relative">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-tr from-black to-zinc-700 dark:from-white dark:to-zinc-300 text-white dark:text-black flex items-center justify-center font-black text-4xl shadow-2xl border-4 border-white dark:border-black overflow-hidden">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-wider">GKS</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg border-2 border-white dark:border-black" title="Verified Founder & Leader">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Gaurav Kr. Sinha</h2>
              <p className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
                Founder & Chief Educator
              </p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                Telecom Guruji
              </p>
            </div>
          </div>

          {/* FOUNDER BIO & MISSION */}
          <div className="space-y-5 flex-1">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase font-bold text-zinc-500 tracking-widest block">
                Meet The Founder
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Pioneering Practical Telecommunications & AI Education
              </h3>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300 font-normal">
              <strong>Gaurav Kr. Sinha</strong> is the Founder & Chief Educator of <strong>Telecom Guruji</strong>. With deep domain expertise in 5G cellular core network design, VoLTE, SIP signaling, and cloud telecom infrastructure, Gaurav created Telecom Guruji to democratize practical engineering skills across India and worldwide.
            </p>

            <p className="text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300 font-normal">
              Alongside Lead Architect & Developer <strong>Ayush Anupam</strong>, Gaurav engineered Telecom Guruji to bridge the gap between academic theory and real-world industry execution through hands-on labs, sequential module verification, and fair educator economics.
            </p>

            {/* QUOTE BOX */}
            <div className={`p-5 rounded-2xl border-l-4 border-black dark:border-white italic text-xs sm:text-sm font-medium leading-relaxed ${
              isLight ? 'bg-white border-zinc-300 text-zinc-800' : 'bg-zinc-950 border-zinc-700 text-zinc-200'
            }`}>
              "Our goal at Telecom Guruji is simple: provide an ultra-smooth learning flow where students acquire genuine skills at minimal cost, and top educators are rewarded fairly with 80% of revenue."
              <p className="not-italic font-bold text-right text-xs mt-2 text-zinc-500 font-mono">— Gaurav Kr. Sinha</p>
            </div>

            {/* HIGHLIGHT BADGES */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-mono font-bold">
                5G & VoLTE Core
              </span>
              <span className="px-3 py-1 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-mono font-bold">
                Sequential Quiz Gatekeeping
              </span>
              <span className="px-3 py-1 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-mono font-bold">
                Transparent 80/20 Revenue Split
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* WHY CHOOSE THIS PLATFORM - SMOOTH FLOW FOR STUDENTS & INSTRUCTORS */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase font-bold text-zinc-500 tracking-widest block">Seamless Architecture</span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">End-to-End Smooth Flow for Everyone</h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-2xl mx-auto">
            Whether you are a student learner giving output or an expert instructor publishing courses, Telecom Guruji makes every step frictionless.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* STUDENT LEARNER FLOW */}
          <div className={`p-7 rounded-3xl border-2 space-y-5 ${
            isLight ? 'bg-white border-zinc-300 shadow-md text-black' : 'bg-zinc-950 border-zinc-800 text-white shadow-xl'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold shadow-md shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight">Smooth Student Learner Flow</h3>
                <p className="text-xs text-zinc-500 font-mono">Frictionless, Output-Driven Learning Journey</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs font-normal leading-relaxed pt-2">
              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="font-bold text-sm text-black dark:text-white">Browse & Instant Free/Minimal Access</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Access foundational courses for 100% free or minimal cost (₹299–₹499) without hidden fees.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="font-bold text-sm text-black dark:text-white">Distraction-Free Lab Viewer & Full Screen</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Study via our Qwiklabs 2-column workspace, collapsible sidebars, and 1-click desktop Full Screen mode.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="font-bold text-sm text-black dark:text-white">Sequential Quiz Gate & Output Verification</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Finish all slides, clear pop-up verification checks, and pass the Module Quiz to unlock the next module.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                <div>
                  <h4 className="font-bold text-sm text-black dark:text-white">Final Exam & Verified Proof of Mastery</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Complete the Final Certification Exam and receive an instant, shareable verified credential.</p>
                </div>
              </div>
            </div>
          </div>

          {/* INSTRUCTOR FLOW */}
          <div className={`p-7 rounded-3xl border-2 space-y-5 ${
            isLight ? 'bg-white border-zinc-300 shadow-md text-black' : 'bg-zinc-950 border-zinc-800 text-white shadow-xl'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold shadow-md shrink-0">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight">Smooth Instructor Studio Flow</h3>
                <p className="text-xs text-zinc-500 font-mono">Empowering Educators with 80% Revenue Split</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs font-normal leading-relaxed pt-2">
              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="font-bold text-sm text-black dark:text-white">1-Click Course Builder</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Create structured courses, modules, slide decks, video links, and code snippets inside Instructor Studio.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="font-bold text-sm text-black dark:text-white">Automated Quiz & Assessment Setup</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Attach randomized multiple-choice questions, passing score thresholds, and explanations effortlessly.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="font-bold text-sm text-black dark:text-white">Real-Time Student Progress Tracking</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Monitor active student enrollments, module completion rates, and quiz scores live on Supabase DB.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                <div>
                  <h4 className="font-bold text-sm text-black dark:text-white">Automated 80% Revenue Payout</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">Earn 80% of all course fees directly into your account with complete financial transparency.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PRICING PHILOSOPHY & TRANSPARENT 80/20 REVENUE SPLIT MODEL */}
      <div className={`p-8 sm:p-10 rounded-3xl border-2 space-y-6 shadow-xl ${
        isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-950 border-zinc-800 text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase font-bold text-zinc-500 tracking-wider">Fair Educator Economics</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Pricing Philosophy & Transparent 80/20 Split</h2>
          </div>
          <span className="px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold uppercase self-start md:self-auto">
            Affordable & Sustainable
          </span>
        </div>

        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Telecom Guruji believes high-quality telecom engineering education must be accessible to every student without financial barriers. That is why core foundation courses are <strong>100% Free</strong>, while specialized hands-on certification courses are kept at <strong>minimal, highly affordable costs</strong> (e.g., ₹299 – ₹499).
        </p>

        {/* 80 / 20 REVENUE BREAKDOWN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* 80% INSTRUCTOR SHARE */}
          <div className={`p-6 rounded-2xl border-2 space-y-3 ${
            isLight ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950' : 'bg-emerald-950/20 border-emerald-800/80 text-emerald-100'
          }`}>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                80%
              </div>
              <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-full bg-emerald-600 text-white">
                Instructor Share
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-emerald-900 dark:text-emerald-300">
              Direct Reward to Course Educators
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium">
              80% of every paid course enrollment goes directly to the course creator/instructor. This empowers top telecom engineers and educators to monetize their expert knowledge fairly.
            </p>
          </div>

          {/* 20% DEVELOPER & FOUNDER SHARE */}
          <div className={`p-6 rounded-2xl border-2 space-y-3 ${
            isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-800 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-xl shadow-md">
                20%
              </div>
              <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white">
                Platform & Dev Share
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tight">
              Developer & Founder Infrastructure
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              20% is allocated to 24/7 AI platform cloud servers, Supabase database storage, Lead Developer (Ayush Anupam), and Founder (Gaurav Kr. Sinha) for continuous technology updates.
            </p>
          </div>

        </div>
      </div>

      {/* CALL TO ACTION */}
      <div className={`p-8 rounded-3xl border-2 text-center space-y-4 ${
        isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white'
      }`}>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Ready to Experience Telecom Guruji?</h2>
        <p className="text-xs sm:text-sm opacity-80 max-w-xl mx-auto font-medium">
          Join thousands of student learners and instructors building the future of telecommunications.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/courses"
            className={`px-6 py-3 rounded-2xl font-black text-xs transition-all flex items-center space-x-2 cursor-pointer shadow-md ${
              isLight ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
            }`}
          >
            <span>Browse All Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth"
            className={`px-6 py-3 rounded-2xl font-black text-xs transition-all flex items-center space-x-2 cursor-pointer border ${
              isLight ? 'border-white text-white hover:bg-white/10' : 'border-black text-black hover:bg-black/10'
            }`}
          >
            <span>Sign In / Join Platform</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
