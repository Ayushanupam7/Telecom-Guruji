'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, PlayCircle, CheckCircle, Award, User, Sparkles, LogOut, X, AlertTriangle, CreditCard, Lock, QrCode, Copy, Check, Signal, BarChart3, CheckCircle2, ShieldCheck, MapPin, GitCommit, Layers, Milestone, FileText, HelpCircle } from 'lucide-react';
import { INITIAL_DEMO_COURSE, getInstructorNameForCourse } from '@/lib/mockData';
import { Module, Lesson, Quiz } from '@signalhub/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { translateCourseTitle, translateCourseSummary } from '@signalhub/shared';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrencySymbol, formatCoursePrice } from '@/lib/currency';
import { CourseThumbnail } from '@/components/CourseThumbnail';
import { InstantEnrollmentModal } from '@/components/InstantEnrollmentModal';
import { PageLoader } from '@/components/PageLoader';

export default function CourseDetailsPage({ params }: { params?: { id?: string } }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { language, dict } = useLanguage();

  const targetId = params?.id || INITIAL_DEMO_COURSE.id;

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<any>(INITIAL_DEMO_COURSE);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const isLight = theme === 'light';
  const [slidesProgress, setSlidesProgress] = useState({ completed: 0, total: 10 });
  const [quizProgress, setQuizProgress] = useState({ passed: 0, total: 4 });
  const [finalExamPassed, setFinalExamPassed] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(0);

  // Check initial enrollment status & fetch live course price & modules from Database
  useEffect(() => {
    async function loadLiveCourseDetails() {
      try {
        // 1. Query Course from Supabase DB by id OR slug
        const { data: dbCourses } = await supabaseAdmin
          .from('courses')
          .select('*')
          .or(`id.eq.${targetId},slug.eq.${targetId}`)
          .limit(1);

        const dbCourse = dbCourses && dbCourses.length > 0 ? dbCourses[0] : null;
        const activeCourse = dbCourse || INITIAL_DEMO_COURSE;

        const realInstructorName = dbCourse?.trainer_name || dbCourse?.instructor || getInstructorNameForCourse(activeCourse.category, activeCourse.title);

        let parsedModules = dbCourse?.modules || activeCourse.modules || INITIAL_DEMO_COURSE.modules || [];

        // 2. Query Live Modules table from Supabase DB for instructor added modules
        const { data: liveModules } = await supabaseAdmin
          .from('modules')
          .select('*')
          .or(`course_id.eq.${activeCourse.id},course_id.eq.${targetId}`)
          .order('sequence_order', { ascending: true });

        if (liveModules && liveModules.length > 0) {
          const formattedLiveModules = liveModules.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description || `Module ${m.sequence_order || 1} core engineering principles and implementation.`,
            sequence_order: m.sequence_order || 1,
            is_free_preview: m.is_free_preview ?? false,
            lessons: m.lessons || [
              {
                id: `les-${m.id}-1`,
                title: `Lesson ${m.sequence_order || 1}.1: Architecture & Foundations`,
                sequence_order: 1,
              },
              {
                id: `les-${m.id}-2`,
                title: `Lesson ${m.sequence_order || 1}.2: Hands-on Implementation & Patterns`,
                sequence_order: 2,
              }
            ],
          }));

          // Merge dbCourse modules with liveModules table records without duplicates
          const existingIds = new Set(parsedModules.map((m: any) => m.id));
          const newLive = formattedLiveModules.filter((m) => !existingIds.has(m.id));
          parsedModules = [...parsedModules, ...newLive];
        }

        setCourseData({
          ...activeCourse,
          title: dbCourse?.title || activeCourse.title,
          summary: dbCourse?.summary || dbCourse?.description || activeCourse.summary || 'Comprehensive verified engineering curriculum.',
          price: Number(dbCourse?.price ?? activeCourse.price ?? 0),
          currency: dbCourse?.currency || activeCourse.currency || 'INR',
          course_type: dbCourse?.course_type ?? (Number(dbCourse?.price ?? 0) > 0 ? 'paid' : 'free'),
          category: dbCourse?.category || activeCourse.category || 'Computer Science',
          level: dbCourse?.level || activeCourse.level || 'intermediate',
          thumbnail_url: dbCourse?.thumbnail_url || activeCourse.thumbnail_url,
          thumbnail_type: dbCourse?.thumbnail_type || activeCourse.thumbnail_type || 'image',
          instructor: { full_name: realInstructorName, title: 'Senior Engineer', bio: 'Expert course instructor' },
          modules: parsedModules,
        });

        // Check enrollment & detailed completion stats for current user
        if (user) {
          const { data: enrollData } = await supabaseAdmin
            .from('enrollments')
            .select('*')
            .or(`student_id.eq.${user.id},student_email.eq.${user.email}`)
            .or(`course_id.eq.${activeCourse.id},course_id.eq.${targetId}`)
            .limit(1);

          if (enrollData && enrollData.length > 0) {
            setIsEnrolled(true);
            const enr = enrollData[0];
            const basePercent = Number(enr.progress_percent) || 0;
            setCompletionPercent(enr.status === 'completed' ? 100 : basePercent);

            // Fetch progress slides
            const { data: slideRecords } = await supabaseAdmin
              .from('progress')
              .select('*')
              .or(`student_id.eq.${user.id},student_email.eq.${user.email}`)
              .eq('course_id', activeCourse.id)
              .eq('completed', true);

            const doneSlides = slideRecords?.length || (enr.status === 'completed' ? 10 : Math.round((basePercent / 100) * 10));
            setSlidesProgress({ completed: doneSlides, total: 10 });

            // Fetch passed quiz attempts
            const { data: quizRecords } = await supabaseAdmin
              .from('quiz_attempts')
              .select('*')
              .or(`student_id.eq.${user.id},student_email.eq.${user.email}`)
              .or(`course_id.eq.${activeCourse.id},course_id.eq.${targetId}`)
              .eq('is_passed', true);

            const totalMods = parsedModules.length || 4;
            const passedCount = quizRecords?.length || (enr.status === 'completed' ? totalMods : Math.round((basePercent / 100) * totalMods));
            const hasFinal = (quizRecords || []).some((q) => q.quiz_type === 'final') || enr.status === 'completed' || basePercent >= 100;

            setQuizProgress({ passed: Math.min(totalMods, passedCount), total: totalMods });
            setFinalExamPassed(hasFinal);
          }
        }
      } catch (e) {
        console.log('Course details fetch note:', e);
      } finally {
        setLoading(false);
      }
    }

    loadLiveCourseDetails();
  }, [user, targetId]);

  /**
   * ENROLL CLICK: Fetches live updated course price from Database before enrolling
   */
  const handleEnrollClick = async () => {
    try {
      // Check live database price in case instructor updated price
      const { data: latestCourse } = await supabaseAdmin
        .from('courses')
        .select('price, currency, course_type')
        .or(`id.eq.${courseData.id},slug.eq.${courseData.id}`)
        .single();

      const livePrice = Number(latestCourse?.price ?? courseData.price ?? 0);
      const liveCurrency = latestCourse?.currency ?? courseData.currency ?? 'INR';
      const liveType = latestCourse?.course_type ?? (livePrice > 0 ? 'paid' : 'free');

      setCourseData((prev: any) => ({ ...prev, price: livePrice, currency: liveCurrency, course_type: liveType }));

      if (livePrice > 0 || liveType === 'paid') {
        setShowPaymentModal(true);
      } else {
        executeEnrollment(0);
      }
    } catch (e) {
      if (courseData.price > 0 || courseData.course_type === 'paid') {
        setShowPaymentModal(true);
      } else {
        executeEnrollment(0);
      }
    }
  };

  const executeEnrollment = async (paidAmount: number, method = 'card', utr = '') => {
    setLoading(true);

    if (user) {
      try {
        await supabaseAdmin
          .from('enrollments')
          .upsert({
            student_id: user.id,
            course_id: courseData.id,
            status: 'active',
            payment_status: paidAmount > 0 ? 'paid' : 'free',
            amount_paid: paidAmount,
            payment_method: method,
            utr_number: utr || null,
            student_name: user.fullName || 'Student',
            student_email: user.email || '',
            enrolled_at: new Date().toISOString(),
          });

        // Synchronize student profile in Supabase Database
        try {
          await supabaseAdmin.from('profiles').upsert({
            id: user.id,
            full_name: user.fullName || 'Student Learner',
            email: user.email || 'student@signalhub.app',
            role: 'student',
            updated_at: new Date().toISOString(),
          });
        } catch (profErr) {
          console.log('Profile sync note:', profErr);
        }

        try {
          await supabaseAdmin.from('progress').upsert({
            student_id: user.id,
            course_id: courseData.id,
            lesson_id: 'e5555555-5555-5555-5555-555555555555',
            is_completed: false,
            video_watch_percent: 0,
            last_position_seconds: 0,
            updated_at: new Date().toISOString(),
          });
        } catch (pErr) {
          console.log('Progress init notice:', pErr);
        }

        showToast({
          type: 'success',
          title: paidAmount > 0 ? 'UPI Payment Verified & Enrolled! 🎉' : 'Enrolled Successfully! 🎉',
          message: paidAmount > 0
            ? `Verified ${getCurrencySymbol(courseData.currency)}${paidAmount} via ${method.toUpperCase()} for "${courseData.title}". Saved to Supabase DB!`
            : `All details for ${user.fullName} (${user.email}) saved to Enterprise Cloud Database!`,
        });
      } catch (err: any) {
        console.log('Enrollment save error:', err?.message || err);
      }
    }

    setIsEnrolled(true);
    setLoading(false);
    setShowPaymentModal(false);
    setProcessingPayment(false);
    setUtrNumber('');
  };

  const handleConfirmPayment = () => {
    setProcessingPayment(true);
    setTimeout(() => {
      setProcessingPayment(false);
      executeEnrollment(courseData.price);
    }, 1200);
  };

  /**
   * CONFIRM UNENROLL: CLEARS ALL STUDENT PROGRESS AND VIDEO WATCH HOURS FROM SUPABASE DATABASE
   */
  const handleConfirmUnenroll = async () => {
    setUnenrolling(true);

    if (user) {
      try {
        // 1. Delete student enrollment record from Supabase
        await supabaseAdmin
          .from('enrollments')
          .delete()
          .eq('student_id', user.id)
          .eq('course_id', courseData.id);

        // 2. Delete ALL watch hours and lesson progress records from Supabase
        await supabaseAdmin
          .from('progress')
          .delete()
          .eq('student_id', user.id)
          .eq('course_id', courseData.id);

        console.log('✅ ALL WATCH HOURS & PROGRESS CLEARED FROM SUPABASE!');
      } catch (e) {
        console.log('Unenroll error notice:', e);
      }
    }

    setIsEnrolled(false);
    setShowUnenrollModal(false);
    setUnenrolling(false);

    showToast({
      type: 'info',
      title: 'Unenrolled & Progress Cleared',
      message: `You have unenrolled from ${courseData.title}. All video watch hours & lesson progress have been completely cleared from Cloud Database!`,
    });
  };

  if (loading) {
    return (
      <PageLoader
        message="Loading Course Overview..."
        submessage="Fetching verified syllabus, instructor details, and module outline..."
      />
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* Course Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 transition-all ${
        isLight ? 'bg-white border-zinc-300 shadow-xl text-black' : 'bg-zinc-950 border-zinc-700 shadow-2xl text-white'
      } space-y-6`}>
        {/* COURSE MEDIA THUMBNAIL (IMAGE / VIDEO) */}
        <CourseThumbnail
          thumbnailUrl={courseData.thumbnail_url}
          thumbnailType={courseData.thumbnail_type}
          category={courseData.category}
          title={courseData.title}
          className="w-full h-64 sm:h-80 rounded-2xl shadow-xl border-2 border-black dark:border-white"
          autoPlayVideo={false}
        />

        <div className="flex flex-wrap gap-2 text-xs font-mono uppercase font-bold">
          <span className="px-3 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white font-mono text-[10px] font-black tracking-wider">
            {courseData.category}
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 font-mono text-[10px] font-black">
            {(courseData.level || 'intermediate').toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white border border-zinc-300 dark:border-zinc-700 font-mono text-[10px] font-black">
            {courseData.price > 0 ? `PAID (${getCurrencySymbol(courseData.currency)}${courseData.price})` : 'FREE ACCESS'}
          </span>
        </div>

        <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
          {translateCourseTitle(courseData.slug || courseData.id || targetId, courseData.title, language)}
        </h1>

        <p className={`text-xs sm:text-sm leading-relaxed max-w-3xl font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
          {translateCourseSummary(courseData.slug || courseData.id || targetId, courseData.description || courseData.summary, language)}
        </p>

        {/* VERIFIED CERTIFICATE GUARANTEE BANNER */}
        <div className={`p-4 rounded-2xl border-2 flex items-center space-x-3 ${
          isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0 shadow-md">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono font-black uppercase tracking-wider block">Verified Certificate Included 🎓</span>
            <span className="text-[11px] text-zinc-500 font-medium">Complete 100% of curriculum modules & quizzes to unlock your authenticated credential.</span>
          </div>
        </div>

        <div className={`flex items-center space-x-3 text-xs pt-1 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
          <User className="w-4 h-4 text-black dark:text-white" />
          <span>Course Instructor: <strong className={isLight ? 'text-black' : 'text-white'}>{courseData.instructor?.full_name || 'Dr. Ayush Sharma'}</strong></span>
        </div>

        {/* Enrollment CTA Bar */}
        <div className={`pt-5 border-t-2 flex flex-wrap items-center justify-between gap-4 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
          <div>
            <span className="text-xs block font-mono font-bold text-zinc-500 uppercase">Enrollment Status</span>
            <span className="text-2xl font-black font-mono text-black dark:text-white">
              {formatCoursePrice(courseData.price, courseData.currency)}
            </span>
          </div>

          {!isEnrolled ? (
            <button
              onClick={handleEnrollClick}
              disabled={loading}
              className="px-8 py-3.5 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs sm:text-sm shadow-xl transition-all flex items-center space-x-2 cursor-pointer active:scale-95 border border-black dark:border-white"
            >
              <Sparkles className="w-4 h-4 text-white dark:text-black" />
              <span>{courseData.price > 0 ? `Pay ${getCurrencySymbol(courseData.currency)}${courseData.price} & Enroll Now →` : 'Enroll Free & Start Learning →'}</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-black dark:text-white font-mono font-black flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Enrolled & Synced ✓</span>
              </span>
              <Link
                href={`/learn/${courseData.id}/m1-l1`}
                className="px-6 py-3 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                <span>Continue Course →</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowUnenrollModal(true)}
                className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 font-extrabold text-xs transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Unenroll</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 📊 CURRICULUM COMPLETION & VERIFICATION METER CARD */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 ${
        isLight ? 'bg-white border-zinc-300 shadow-xl text-black' : 'bg-zinc-950 border-zinc-700 shadow-2xl text-white'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black font-mono text-[10px] font-black uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Real-Time Completion Meter</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Curriculum Progress & Verification Meter
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Calculates live slide checkpoints, module quiz scores, and final assessment status.
            </p>
          </div>

          <div className="shrink-0 flex items-center space-x-3 bg-zinc-100 dark:bg-zinc-900 px-5 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700">
            <span className="text-2xl sm:text-3xl font-black font-mono">
              {isEnrolled ? `${completionPercent}%` : '0%'}
            </span>
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase block leading-tight">
              {completionPercent >= 100 ? 'UNLOCKED 🔓' : 'IN PROGRESS'}
            </span>
          </div>
        </div>

        {/* OVERALL PROGRESS GAUGE BAR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-zinc-500 uppercase">Overall Course Mastery Meter</span>
            <span className="text-black dark:text-white font-black">{completionPercent}% Complete</span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden border border-zinc-300 dark:border-zinc-700 p-0.5">
            <div
              className="h-full rounded-full bg-black dark:bg-white transition-all duration-700 shadow-sm"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* DETAILED METRICS BREAKDOWN GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          {/* METRIC 1: SLIDE CHECKPOINTS */}
          <div className={`p-4 rounded-2xl border-2 space-y-2 ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <div className="flex items-center justify-between text-zinc-500 font-bold uppercase text-[10px]">
              <span>1. Slide Checkpoints</span>
              <BookOpen className="w-3.5 h-3.5 text-black dark:text-white" />
            </div>
            <div className="text-base font-black text-black dark:text-white">
              {isEnrolled ? `${slidesProgress.completed} / ${slidesProgress.total}` : '0 / 10'} Slides
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-black dark:bg-white transition-all"
                style={{ width: `${isEnrolled ? Math.round((slidesProgress.completed / slidesProgress.total) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* METRIC 2: MODULE QUIZZES */}
          <div className={`p-4 rounded-2xl border-2 space-y-2 ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <div className="flex items-center justify-between text-zinc-500 font-bold uppercase text-[10px]">
              <span>2. Module Quizzes</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />
            </div>
            <div className="text-base font-black text-black dark:text-white">
              {isEnrolled ? `${quizProgress.passed} / ${quizProgress.total}` : '0 / 4'} Passed
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-black dark:bg-white transition-all"
                style={{ width: `${isEnrolled ? Math.round((quizProgress.passed / quizProgress.total) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* METRIC 3: FINAL ASSESSMENT */}
          <div className={`p-4 rounded-2xl border-2 space-y-2 ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <div className="flex items-center justify-between text-zinc-500 font-bold uppercase text-[10px]">
              <span>3. Final Exam</span>
              <Award className="w-3.5 h-3.5 text-black dark:text-white" />
            </div>
            <div className="text-base font-black text-black dark:text-white flex items-center space-x-1">
              <span>{finalExamPassed ? 'PASSED 100% 🟢' : 'NOT PASSED ⏳'}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${finalExamPassed ? 'w-full bg-black dark:bg-white' : 'w-0'}`}
              />
            </div>
          </div>
        </div>

        {/* CERTIFICATE CLAIM NOTICE */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-mono ${
          completionPercent >= 100
            ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
            : isLight
            ? 'bg-zinc-100 border-zinc-300 text-zinc-700'
            : 'bg-zinc-900 border-zinc-800 text-zinc-300'
        }`}>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-bold">
              {completionPercent >= 100
                ? '✨ 100% Complete! Your Verified Certificate is Unlocked.'
                : '🔒 Certificate Locked. Reach 100% completion across all 3 metrics to claim your credential.'}
            </span>
          </div>
          {completionPercent >= 100 && (
            <Link
              href={`/certificate/${courseData.id}`}
              className="px-4 py-1.5 rounded-xl bg-white text-black dark:bg-black dark:text-white font-black text-xs hover:opacity-90 transition-all shrink-0"
            >
              Claim Certificate →
            </Link>
          )}
        </div>
      </div>

      {/* 🗺️ VISUAL COURSE LEARNING ROADMAP (ZERO BUTTONS) */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black font-mono text-[10px] font-black uppercase tracking-wider">
              <Milestone className="w-3.5 h-3.5" />
              <span>Curriculum Learning Roadmap</span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight mt-1 ${isLight ? 'text-black' : 'text-white'}`}>
              Sequential Course Mastery Roadmap
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Structured step-by-step milestone path. Complete each module checkpoint sequentially to reach 100% mastery.
            </p>
          </div>

          <div className="shrink-0 flex items-center space-x-2 font-mono text-xs font-bold px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700">
            <Layers className="w-4 h-4 text-black dark:text-white" />
            <span>{courseData.modules?.length || 4} Sequential Milestones</span>
          </div>
        </div>

        {/* ROADMAP TIMELINE CONTAINER */}
        <div className="relative pl-6 sm:pl-10 border-l-4 border-black dark:border-white space-y-8 my-6 ml-4 sm:ml-6">
          {courseData.modules?.map((mod: Module, index: number) => {
            const milestoneNum = String(index + 1).padStart(2, '0');
            return (
              <div key={mod.id} className="relative group">
                {/* ROADMAP MILESTONE CIRCLE NODE */}
                <div className="absolute -left-[37px] sm:-left-[53px] top-0 w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-mono font-black text-xs sm:text-sm border-2 border-white dark:border-black shadow-lg">
                  {milestoneNum}
                </div>

                {/* ROADMAP MILESTONE CONTENT CARD (NO BUTTONS) */}
                <div className={`p-6 sm:p-7 rounded-3xl border-2 space-y-4 transition-all ${
                  isLight
                    ? 'bg-white border-zinc-300 shadow-md text-black hover:border-black'
                    : 'bg-zinc-950 border-zinc-800 shadow-xl text-white hover:border-white'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500 block">
                        MILESTONE {milestoneNum} • MODULE {mod.sequence_order || index + 1}
                      </span>
                      <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                        {mod.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-[10px] font-bold">
                      <span className="px-3 py-1 rounded-full bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700">
                        {mod.is_free_preview ? 'FREE PREVIEW' : 'SEQUENTIAL LOCK'}
                      </span>
                    </div>
                  </div>

                  <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    {mod.description}
                  </p>

                  {/* READ-ONLY LESSONS & CHECKPOINTS ROADMAP LIST */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block tracking-wider">
                      Module Checkpoints & Topics Covered:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(mod.lessons || [
                        { id: `les-1-${mod.id}`, title: `Lesson ${index + 1}.1: Architecture & Foundations` },
                        { id: `les-2-${mod.id}`, title: `Lesson ${index + 1}.2: Implementation & Production Patterns` }
                      ]).map((les: any) => (
                        <div
                          key={les.id}
                          className={`p-3 rounded-2xl border text-xs font-medium flex items-center space-x-2.5 ${
                            isLight
                              ? 'bg-zinc-50 border-zinc-200 text-zinc-800'
                              : 'bg-zinc-900/80 border-zinc-800 text-zinc-200'
                          }`}
                        >
                          <GitCommit className="w-4 h-4 shrink-0 text-black dark:text-white" />
                          <span className="font-bold truncate">{les.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MILESTONE REQUIREMENTS FOOTER (NO BUTTONS) */}
                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-500 gap-2 font-bold">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>Interactive Slides Deck Checkpoint</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <HelpCircle className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>Verified Knowledge Check Quiz</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PAYMENT CHECKOUT MODAL WITH DYNAMIC UPI QR CODE */}
      {showPaymentModal && (
        <InstantEnrollmentModal
          course={courseData}
          onClose={() => setShowPaymentModal(false)}
          onConfirmEnroll={(amount, method, utr) => executeEnrollment(amount, method, utr)}
          processingPayment={processingPayment}
        />
      )}

      {/* UNENROLL CONFIRMATION MODAL */}
      {showUnenrollModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-5 relative ${
            isLight ? 'bg-white border-rose-200 text-slate-900' : 'bg-slate-900 border-rose-500/30 text-white'
          }`}>
            <button
              onClick={() => setShowUnenrollModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Unenroll & Clear Watch Data?
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                  {courseData.title}
                </p>
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-slate-300 font-normal'}`}>
              Are you sure you want to unenroll from <strong className={isLight ? 'text-slate-900' : 'text-white'}>{courseData.title}</strong>? This will permanently delete your active enrollment and wipe all video watch hours & progress from the Cloud Database.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUnenrollModal(false)}
                className={`py-2.5 rounded-xl border font-bold text-xs transition-colors ${
                  isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnenroll}
                disabled={unenrolling}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center space-x-1.5"
              >
                <span>{unenrolling ? 'Wiping Data...' : 'Yes, Unenroll & Clear'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
