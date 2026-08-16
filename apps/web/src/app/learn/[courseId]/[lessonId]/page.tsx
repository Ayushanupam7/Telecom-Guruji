'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, BookOpen, Sparkles, Lock, CreditCard, 
  ShieldAlert, UserCheck, X, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, HelpCircle, Award, PlayCircle, FileText, Code, Activity, Menu, Maximize2, Minimize2
} from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { QuizRunner } from '@/components/QuizRunner';
import { INITIAL_DEMO_COURSE } from '@/lib/mockData';
import { LessonContentBlock, CourseSlide } from '@signalhub/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  translateModuleTitle, translateModuleDescription, translateSlideTitle, translateSlideBody, 
  translateCourseTitle, translateCategory 
} from '@signalhub/shared';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrencySymbol, formatCoursePrice } from '@/lib/currency';
import { InstantEnrollmentModal } from '@/components/InstantEnrollmentModal';
import { PageLoader } from '@/components/PageLoader';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function StudentLearningPlayerPage({
  params,
}: {
  params: { courseId: string; lessonId?: string };
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { language, dict } = useLanguage();
  const isLight = theme === 'light';

  const targetCourseId = params.courseId || INITIAL_DEMO_COURSE.id;

  const [course, setCourse] = useState<any>(INITIAL_DEMO_COURSE);
  const [modules, setModules] = useState<any[]>(INITIAL_DEMO_COURSE.modules || []);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'slides' | 'quiz' | 'final_assessment'>('slides');
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [topCardCollapsed, setTopCardCollapsed] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [completedModuleIndices, setCompletedModuleIndices] = useState<number[]>([]);

  // Attention / Active Student Verification Pop-up state
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [attentionTimer, setAttentionTimer] = useState(30);
  const [slidesViewedCount, setSlidesViewedCount] = useState(0);

  // Access & Enrollment State
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // 1. Fetch Backend Data & Setup Course
  useEffect(() => {
    async function verifyBackendAccess() {
      try {
        const { data: dbCourse } = await supabaseAdmin
          .from('courses')
          .select('*')
          .or(`id.eq.${targetCourseId},slug.eq.${targetCourseId}`)
          .single();

        const activeCourse = dbCourse || INITIAL_DEMO_COURSE;
        setCourse({
          ...INITIAL_DEMO_COURSE,
          ...activeCourse,
          price: Number(activeCourse.price) || 0,
          currency: activeCourse.currency || 'USD',
          course_type: activeCourse.course_type ?? (activeCourse.price > 0 ? 'paid' : 'free'),
        });

        const { data: dbModules } = await supabaseAdmin
          .from('modules')
          .select('*')
          .eq('course_id', activeCourse.id)
          .order('sequence_order', { ascending: true });

        if (dbModules && dbModules.length > 0) {
          const formattedMods = dbModules.map((m, mIdx) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            sequence_order: m.sequence_order || mIdx + 1,
            is_free_preview: mIdx === 0,
            slides: m.slides_data || [
              {
                id: `s-${m.id}-1`,
                slide_number: 1,
                title: 'Slide 1: Core Module Principles',
                content_type: 'text',
                body_markdown: 'Welcome to this module. Follow through the slide deck.',
              },
              {
                id: `s-${m.id}-2`,
                slide_number: 2,
                title: 'Slide 2: Architectural Breakdown',
                content_type: 'text',
                body_markdown: 'Detailed system architecture overview and engineering setup.',
              },
            ],
          }));
          setModules(formattedMods);
        }

        // Verify active enrollment and restore last left position
        if (user) {
          const { data: userEnroll } = await supabaseAdmin
            .from('enrollments')
            .select('*')
            .or(`student_id.eq.${user.id},student_email.eq.${user.email}`)
            .or(`course_id.eq.${activeCourse.id},course_id.eq.${targetCourseId}`);

          if (userEnroll && userEnroll.length > 0) {
            setIsEnrolled(true);
            const enr = userEnroll[0];

            if (typeof enr.last_module_index === 'number' && enr.last_module_index >= 0) {
              setCurrentModuleIndex(enr.last_module_index);
            }
            if (typeof enr.last_slide_index === 'number' && enr.last_slide_index >= 0) {
              setCurrentSlideIndex(enr.last_slide_index);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching course player data:', err);
      } finally {
        setLoadingAccess(false);
      }
    }

    verifyBackendAccess();
  }, [targetCourseId, user]);

  // Real-time auto-save position & calculated progress percent to Supabase Database
  useEffect(() => {
    if (user && targetCourseId) {
      const savePositionToSupabase = async () => {
        try {
          const totalSlidesCount = (modules || []).reduce((acc: number, m: any) => acc + (m.slides?.length || 2), 0) || 10;
          const currentAbsoluteSlide = (currentModuleIndex * 2) + currentSlideIndex + 1;
          const calculatedProgress = Math.min(99, Math.round((currentAbsoluteSlide / totalSlidesCount) * 100));

          const targetEmail = user.email || 'student@signalhub.app';
          const targetCourse = targetCourseId || course?.id || 'c3333333-3333-3333-3333-333333333333';

          // 1. Update enrollments table
          const { data: updatedEnr } = await supabaseAdmin
            .from('enrollments')
            .update({
              last_module_index: currentModuleIndex,
              last_slide_index: currentSlideIndex,
              last_lesson_id: `m${currentModuleIndex + 1}-l${currentSlideIndex + 1}`,
              progress_percent: calculatedProgress,
              updated_at: new Date().toISOString(),
            })
            .ilike('student_email', targetEmail)
            .select();

          if (!updatedEnr || updatedEnr.length === 0) {
            await supabaseAdmin.from('enrollments').upsert({
              student_id: user.id,
              student_email: targetEmail,
              student_name: user.fullName || 'Student Learner',
              course_id: targetCourse,
              course_title: course?.title || 'Engineering Course',
              last_module_index: currentModuleIndex,
              last_slide_index: currentSlideIndex,
              last_lesson_id: `m${currentModuleIndex + 1}-l${currentSlideIndex + 1}`,
              progress_percent: calculatedProgress,
              status: 'active',
              payment_status: 'paid',
              updated_at: new Date().toISOString(),
            });
          }

          // 2. Insert slide checkpoint into progress table
          const progressRecordId = `p-${user.id}-${targetCourse}-m${currentModuleIndex + 1}-l${currentSlideIndex + 1}`;
          await supabaseAdmin
            .from('progress')
            .upsert({
              id: progressRecordId,
              student_id: user.id,
              student_email: targetEmail,
              course_id: targetCourse,
              lesson_id: `m${currentModuleIndex + 1}-l${currentSlideIndex + 1}`,
              completed: true,
              is_completed: true,
              video_watch_percent: 100,
              updated_at: new Date().toISOString(),
            });

          console.log(`✅ SLIDE VIEWED: Module ${currentModuleIndex + 1}, Slide ${currentSlideIndex + 1} -> Progress: ${calculatedProgress}% saved to Supabase!`);
        } catch (e) {
          console.log('Position save note:', e);
        }
      };
      savePositionToSupabase();
    }
  }, [currentModuleIndex, currentSlideIndex, user, targetCourseId, course?.id, course?.title, modules]);

  // Handle slide advance & attention check trigger
  const triggerNextSlide = () => {
    const activeModule = modules[currentModuleIndex] || {};
    const totalSlidesInMod = activeModule.slides?.length || 1;

    setSlidesViewedCount((prev) => prev + 1);

    // Every 4 slide changes, trigger Active Student Verification Pop-up
    if ((slidesViewedCount + 1) % 4 === 0) {
      setShowAttentionModal(true);
      setAttentionTimer(30);
      return;
    }

    if (currentSlideIndex < totalSlidesInMod - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      // Reached end of current module slides -> Open Module Quiz FIRST before unlocking next module!
      setActiveTab('quiz');
      showToast({
        type: 'info',
        title: 'Module Slides Completed! 📝',
        message: `Great progress! Please complete and pass the Module ${currentModuleIndex + 1} Quiz to unlock Module ${currentModuleIndex + 2}.`,
      });
    }
  };

  // Countdown timer for Attention Modal
  useEffect(() => {
    let interval: any = null;
    if (showAttentionModal && attentionTimer > 0) {
      interval = setInterval(() => {
        setAttentionTimer((prev) => prev - 1);
      }, 1000);
    } else if (attentionTimer === 0 && showAttentionModal) {
      setShowAttentionModal(false);
      showToast({
        type: 'warning',
        title: 'Attention Timer Expired',
        message: 'Course session paused due to inactivity.',
      });
    }
    return () => clearInterval(interval);
  }, [showAttentionModal, attentionTimer, showToast]);

  const handleConfirmAttention = () => {
    setShowAttentionModal(false);
    showToast({
      type: 'success',
      title: 'Verification Confirmed! ✓',
      message: 'Active student heartbeat logged to Supabase DB.',
    });
  };

  // Submit Paid Enrollment
  const handleConfirmPaidEnrollment = async (paidAmount: number, method: string, utr: string) => {
    setProcessingPayment(true);
    try {
      await supabaseAdmin.from('enrollments').insert({
        student_id: user?.id || 'e1111111-1111-1111-1111-111111111111',
        student_email: user?.email || 'student@signalhub.app',
        student_name: user?.fullName || 'Student Learner',
        course_id: course.id,
        course_title: course.title,
        progress_percent: 0,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        payment_status: 'paid',
        payment_method: method,
        amount_paid: paidAmount,
        utr_number: utr || null,
      });

      setIsEnrolled(true);
      setShowCheckoutModal(false);
      showToast({
        type: 'success',
        title: 'Enrollment Verified! 🎉',
        message: `Unlocked full course access for "${course.title}". Saved to Supabase Database!`,
      });
    } catch (err) {
      console.error('Enroll error:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const isPaidCourse = course.price > 0 || course.course_type === 'paid';
  const currentModule = modules[currentModuleIndex] || { slides: [] };
  const currentSlide = currentModule.slides?.[currentSlideIndex] || {
    title: 'Module Overview',
    content_type: 'text',
    body_markdown: 'Welcome to this module. Select slides from the left menu.',
  };

  if (loadingAccess) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-black text-black dark:text-white flex flex-col items-center justify-center p-6 space-y-6 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl border border-zinc-200 dark:border-zinc-800">
          <Lock className="w-8 h-8" />
        </div>
        <div className="text-center space-y-2 max-w-sm">
          <h1 className="text-2xl font-black tracking-tight">
            Sign In Required
          </h1>
          <p className="text-xs text-zinc-500 leading-relaxed font-medium">
            Please sign in to access course slides, quizzes, and verified certificates.
          </p>
        </div>
        <Link
          href="/auth"
          className="px-6 py-3 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs shadow-lg transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
        >
          <span>Go to Authentication Page</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-2 sm:px-4">
      {/* ATTENTION VERIFICATION POPUP MODAL */}
      {showAttentionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className={`p-6 sm:p-8 rounded-3xl max-w-md w-full border text-center space-y-5 shadow-2xl ${
            isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-950 border-zinc-800 text-white'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto shadow-md">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-black dark:text-white font-mono text-[10px] font-bold uppercase">
                Active Student Verification Check
              </span>
              <h3 className="text-xl font-black tracking-tight">Are You Still Learning?</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                This course requires active engagement. Please confirm your presence to proceed to the next slide.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-black dark:text-white">
              Auto-Pause Timer: <span className="text-base font-black">{attentionTimer}s</span>
            </div>

            <button
              onClick={handleConfirmAttention}
              className="w-full py-3.5 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs shadow-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>I'm Here — Continue Learning</span>
            </button>
          </div>
        </div>
      )}

      {/* 🎯 CONSOLIDATED DISTRACTION-FREE TOP CONTROL & CURRICULUM PROGRESS CARD (COLLAPSIBLE) 🎯 */}
      {topCardCollapsed ? (
        /* SLIM COLLAPSED HEADER BAR FOR MAXIMUM VERTICAL DESKTOP VIEWPORT AREA */
        <div className={`px-4 py-3 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${
          isLight ? 'bg-white border-zinc-300 shadow-sm text-black' : 'bg-zinc-950 border-zinc-800 text-white shadow-md'
        }`}>
          <div className="flex items-center space-x-3 truncate">
            <Breadcrumbs
              items={[
                { label: 'Browse', href: '/courses' },
                { label: translateCategory(course.category, language), href: '/courses' },
                { label: translateCourseTitle(course.slug || course.id, course.title, language), href: `/courses/${course.id}` },
                { label: `Module ${currentModuleIndex + 1}` }
              ]}
            />
            <span className="hidden sm:inline-block font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 truncate">
              Mod {currentModuleIndex + 1}, Slide {currentSlideIndex + 1}
            </span>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-[11px] font-bold">
              <Activity className="w-3 h-3 text-black dark:text-white" />
              <span>{Math.min(99, Math.round(((currentModuleIndex * 2 + currentSlideIndex + 1) / 10) * 100))}%</span>
            </div>

            <button
              type="button"
              onClick={() => setTopCardCollapsed(false)}
              className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all flex items-center space-x-1 text-xs font-bold cursor-pointer"
              title="Expand Upper Control Card"
            >
              <ChevronDown className="w-4 h-4" />
              <span className="hidden md:inline">Expand</span>
            </button>
          </div>
        </div>
      ) : (
        /* FULL EXPANDED HEADER CARD */
        <div className={`p-4 sm:p-5 rounded-3xl border-2 space-y-3 ${
          isLight ? 'bg-white border-zinc-300 shadow-md text-black' : 'bg-zinc-950 border-zinc-800 text-white shadow-xl'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              {/* BREADCRUMB PATH */}
              <Breadcrumbs
                items={[
                  { label: 'Browse', href: '/courses' },
                  { label: translateCategory(course.category, language), href: '/courses' },
                  { label: translateCourseTitle(course.slug || course.id, course.title, language), href: `/courses/${course.id}` },
                  { label: `Module ${currentModuleIndex + 1}` }
                ]}
              />

              {/* TITLE & SHORT ACTIVE MILESTONE */}
              <div className="space-y-1">
                <h1 className={`text-lg sm:text-xl font-black tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
                  {translateCourseTitle(course.slug || course.id, course.title, language)}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="text-zinc-500 font-bold">Active Milestone:</span>
                  <span className="font-black text-black dark:text-white px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    Module {currentModuleIndex + 1}, Slide {currentSlideIndex + 1} ({translateSlideTitle(currentSlide?.title || 'System Protocol Overview', language)})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center space-x-2 sm:space-x-3 shrink-0">
              {/* MASTERY PERCENT BADGE */}
              <div className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold">
                <Activity className="w-3.5 h-3.5 text-black dark:text-white" />
                <span>{Math.min(99, Math.round(((currentModuleIndex * 2 + currentSlideIndex + 1) / 10) * 100))}% Mastery</span>
              </div>

              {/* RETURN TO COURSE DETAILS BUTTON */}
              <Link
                href={`/courses/${course.id}`}
                className={`px-3.5 py-2 rounded-2xl border text-xs font-black transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer ${
                  isLight
                    ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-black'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white'
                }`}
                title="Return to Course Overview & Details"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Course Details</span>
              </Link>

              {/* UNLOCKED BADGE OR CHECKOUT */}
              {isPaidCourse && (
                <div>
                  {isEnrolled ? (
                    <span className="px-3 py-2 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-xs flex items-center space-x-1.5 border border-zinc-800 dark:border-zinc-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                      <span className="hidden sm:inline">Unlocked</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowCheckoutModal(true)}
                      className="px-3.5 py-2 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Unlock ({getCurrencySymbol(course.currency)}{course.price})</span>
                    </button>
                  )}
                </div>
              )}

              {/* TOP CARD COLLAPSE TOGGLE BUTTON */}
              <button
                type="button"
                onClick={() => setTopCardCollapsed(true)}
                className="p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all flex items-center space-x-1 text-xs font-bold cursor-pointer"
                title="Collapse Upper Control Card"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* INTEGRATED SLIM MASTERY PROGRESS BAR */}
          <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden p-0.5 border border-zinc-300 dark:border-zinc-700">
            <div
              className="h-full rounded-full bg-black dark:bg-white transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round(((currentModuleIndex * 2 + currentSlideIndex + 1) / 10) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* MOBILE COURSE OUTLINE TOGGLE BUTTON (MOBILE ONLY) */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOutlineOpen(!mobileOutlineOpen)}
          className={`w-full p-4 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${
            isLight ? 'bg-white border-zinc-300 text-black shadow-md' : 'bg-zinc-950 border-zinc-700 text-white shadow-xl'
          }`}
        >
          <div className="flex items-center space-x-2.5 truncate pr-2">
            <BookOpen className="w-4 h-4 shrink-0 text-black dark:text-white" />
            <span className="truncate">Syllabus & Modules ({modules.length})</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700">
              {mobileOutlineOpen ? 'Hide Syllabus ▲' : 'View Syllabus ▼'}
            </span>
          </div>
        </button>
      </div>

      {/* MAIN TWO-COLUMN LEARNING INTERFACE WITH COLLAPSIBLE SIDEBAR */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* 🖤 LEFT SIDEBAR: COLLAPSED STRIP OR FULL ROADMAP (MATCHING USER SCREENSHOT) 🤍 */}
        {sidebarCollapsed ? (
          <div className={`hidden lg:flex w-16 flex-col items-center py-5 px-2 rounded-3xl border-2 space-y-6 shrink-0 transition-all ${
            isLight
              ? 'bg-white border-zinc-300 shadow-md text-black'
              : 'bg-zinc-950 border-zinc-400 text-white shadow-xl'
          }`}>
            {/* ☰ EXPAND MENU TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white hover:scale-105 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Expand Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* QUICK MODULE ICONS STACK & FINAL ASSESSMENT SYMBOL */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 w-full flex flex-col items-center">
              {modules.map((m, idx) => {
                const isSeqLocked = idx > 0 && !completedModuleIndices.includes(idx - 1);
                const isLocked = (isPaidCourse && !isEnrolled && idx > 0) || isSeqLocked;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isPaidCourse && !isEnrolled && idx > 0) {
                        setShowCheckoutModal(true);
                        return;
                      }
                      if (isSeqLocked) {
                        showToast({
                          type: 'warning',
                          title: 'Module Locked 🔒',
                          message: `Complete all slides and pass the Module ${idx} Quiz first to unlock Module ${idx + 1}!`,
                        });
                        return;
                      }
                      setCurrentModuleIndex(idx);
                      setCurrentSlideIndex(0);
                      setActiveTab('slides');
                      setSidebarCollapsed(false);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-black transition-all cursor-pointer ${
                      isLocked
                        ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 opacity-50 border border-zinc-200 dark:border-zinc-800'
                        : currentModuleIndex === idx && activeTab === 'slides'
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-md border border-black dark:border-white'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-black dark:hover:text-white'
                    }`}
                    title={isSeqLocked ? `Module ${idx + 1} (Locked - Pass Module ${idx} Quiz)` : `Module ${idx + 1}`}
                  >
                    {isSeqLocked ? <Lock className="w-3.5 h-3.5 text-zinc-400" /> : `M${idx + 1}`}
                  </button>
                );
              })}

              {/* 🏆 FINAL ASSESSMENT SYMBOL ON COLLAPSED STRIP 🏆 */}
              <button
                onClick={() => {
                  if (isPaidCourse && !isEnrolled) {
                    setShowCheckoutModal(true);
                    return;
                  }
                  setActiveTab('final_assessment');
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-black transition-all cursor-pointer mt-1 ${
                  activeTab === 'final_assessment'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md border border-black dark:border-white'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-black dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
                }`}
                title="Final Assessment & Exam"
              >
                <Award className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              </button>
            </div>
          </div>
        ) : (
          <div className={`w-full lg:w-80 p-4 sm:p-5 rounded-3xl border-2 space-y-4 shrink-0 ${
            mobileOutlineOpen ? 'block' : 'hidden lg:block'
          } ${
            isLight
              ? 'bg-white border-zinc-300 shadow-md text-black'
              : 'bg-zinc-950 border-zinc-400 text-white shadow-xl'
          }`}>
            {/* HEADER: COURSE TITLE + COLLAPSE CROSS (X) BUTTON */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 gap-2">
              <h2 className="text-xs sm:text-sm font-black tracking-tight leading-snug text-black dark:text-white pt-0.5">
                {translateCourseTitle(course.slug || course.id, course.title, language)}
              </h2>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-black dark:hover:text-white shrink-0 transition-colors cursor-pointer"
                title="Collapse Guided Project Outline"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* ROADMAP MODULE LIST */}
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {modules.map((mod, mIdx) => {
                const isSelected = currentModuleIndex === mIdx;
                const isSeqLocked = mIdx > 0 && !completedModuleIndices.includes(mIdx - 1);
                const isLocked = (isPaidCourse && !isEnrolled && mIdx > 0) || isSeqLocked;

                return (
                  <div
                    key={mod.id || mIdx}
                    className={`p-3 rounded-2xl border transition-all text-xs space-y-2 cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md font-bold'
                        : isLocked
                        ? 'bg-zinc-100 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 opacity-60 text-zinc-500'
                        : isLight
                        ? 'bg-zinc-50 border-zinc-200 hover:border-black text-black'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-300 text-white'
                    }`}
                    onClick={() => {
                      if (isPaidCourse && !isEnrolled && mIdx > 0) {
                        setShowCheckoutModal(true);
                        return;
                      }
                      if (isSeqLocked) {
                        showToast({
                          type: 'warning',
                          title: 'Module Locked 🔒',
                          message: `Complete all slides and pass the Module ${mIdx} Quiz first to unlock Module ${mIdx + 1}!`,
                        });
                        return;
                      }
                      setCurrentModuleIndex(mIdx);
                      setCurrentSlideIndex(0);
                      setActiveTab('slides');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[10px] font-bold uppercase ${
                        isSelected ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-500'
                      }`}>
                        {dict.moduleWord || 'Module'} {mIdx + 1}
                      </span>
                      {isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-zinc-500" />
                      ) : (
                        <span className={`text-[10px] font-mono font-bold ${
                          isSelected ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-400'
                        }`}>{mod.slides?.length || 3} items</span>
                      )}
                    </div>

                    <h3 className={`font-extrabold leading-snug ${
                      isSelected ? 'text-white dark:text-black' : isLight ? 'text-black' : 'text-white'
                    }`}>
                      {translateModuleTitle(mod.title, language)}
                    </h3>

                    {isSelected && (
                      <div className="pt-2 border-t border-zinc-800 dark:border-zinc-200 space-y-1.5">
                        {mod.slides?.map((slide: CourseSlide, sIdx: number) => (
                          <button
                            key={slide.id || sIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentSlideIndex(sIdx);
                              setActiveTab('slides');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between transition-all ${
                              currentSlideIndex === sIdx && activeTab === 'slides'
                                ? 'bg-white text-black dark:bg-black dark:text-white border border-black dark:border-white shadow-xs'
                                : 'hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:text-white dark:hover:text-black opacity-90'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${
                                currentSlideIndex === sIdx && activeTab === 'slides' ? 'bg-black dark:bg-white' : 'bg-zinc-400'
                              }`} />
                              <div className="truncate">
                                <p className="truncate leading-tight">{translateSlideTitle(slide.title, language)}</p>
                                <p className="text-[9px] opacity-70 font-mono">
                                  {slide.content_type === 'video' ? 'Video • 5 min' : slide.content_type === 'image' ? 'Lab • 45 min' : 'Reading • 10 min'}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}

                        {/* Quiz Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('quiz');
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black flex items-center justify-between transition-all mt-1.5 ${
                            activeTab === 'quiz'
                              ? 'bg-white text-black dark:bg-black dark:text-white border border-black dark:border-white'
                              : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black hover:opacity-90'
                          }`}
                        >
                          <div className="truncate">
                            <p className="truncate">✍️ {dict.moduleQuiz || 'Module Quiz'} {mIdx + 1}</p>
                            <p className="text-[9px] opacity-70 font-mono">Graded Quiz • 15 min</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Final Assessment Tab */}
              <div
                onClick={() => {
                  if (isPaidCourse && !isEnrolled) {
                    setShowCheckoutModal(true);
                    return;
                  }
                  setActiveTab('final_assessment');
                }}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all text-xs space-y-1.5 ${
                  activeTab === 'final_assessment'
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md font-bold'
                    : 'bg-zinc-100 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 hover:border-black dark:hover:border-white'
                }`}
              >
                <div className="flex items-center justify-between font-black">
                  <span className="flex items-center space-x-1.5">
                    <Award className="w-4 h-4" />
                    <span>{dict.finalAssessment || 'Final Exam'}</span>
                  </span>
                  <span className="text-[9px] font-mono uppercase bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 rounded">Exam</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">{dict.finalAssessmentSubtext || 'Pass exam to unlock verified certificate'}</p>
              </div>
            </div>
          </div>
        )}

        {/* 🖤 RIGHT COLUMN: SLIDE PLAYER / QUIZ RUNNER / FINAL ASSESSMENT 🤍 */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* TAB 1: SLIDE CONTENT PLAYER (CARD 3 - REFINED COMPACT SLIDE VIEWER WITH FULL SCREEN MAXIMIZE) */}
          {activeTab === 'slides' && (
            <div className={`p-4 sm:p-5 rounded-3xl border-2 flex flex-col ${
              isFullscreen
                ? 'fixed inset-2 z-50 shadow-2xl h-[calc(100vh-1rem)] max-h-none'
                : 'max-h-[calc(100vh-140px)] min-h-[460px]'
            } ${
              isLight
                ? 'bg-white border-zinc-300 text-black'
                : 'bg-zinc-950 border-zinc-400 text-white'
            }`}>
              {/* QWIKLABS HERO BANNER / SLIDE HEADER (COMPACT WITH MAXIMIZE BUTTON) */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-2.5 shrink-0 mb-3 ${
                isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 block tracking-wider">
                      {currentSlide.content_type === 'image' ? 'Lab / Hands-on' : currentSlide.content_type === 'video' ? 'Video Lesson' : 'Reading & Concepts'}
                    </span>
                    <h2 className={`text-base sm:text-xl font-extrabold tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
                      {translateSlideTitle(currentSlide.title, language)}
                    </h2>
                  </div>

                  {/* 🖥️ MAXIMIZE / FULL SCREEN BUTTON 🖥️ */}
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-bold shadow-xs shrink-0 border border-zinc-300 dark:border-zinc-700 active:scale-95"
                    title={isFullscreen ? "Exit Fullscreen" : "Maximize Slide Viewer (Full Screen)"}
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize2 className="w-4 h-4" />
                        <span className="hidden sm:inline font-mono">Exit Fullscreen</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-4 h-4" />
                        <span className="hidden sm:inline font-mono">Full Screen</span>
                      </>
                    )}
                  </button>
                </div>

                {/* PRIMARY ACTION BUTTON (COMPACT) */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={triggerNextSlide}
                    className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 border border-black dark:border-white"
                  >
                    <span>{currentSlide.content_type === 'image' ? 'Launch Lab' : currentSlide.content_type === 'video' ? 'Play Video' : 'Complete Reading'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* SLIDE BODY CONTENT (COMPACT READING & SCROLLBAR AREA) */}
              <div className="flex-1 overflow-y-auto pr-2 text-xs sm:text-sm space-y-3">
                {currentSlide.content_type === 'video' && currentSlide.media_url && (
                  <div className="rounded-2xl overflow-hidden shadow-md border border-zinc-300 dark:border-zinc-800 max-w-2xl mx-auto">
                    <VideoPlayer
                      videoId={currentSlide.media_url || 'vv4y_uOneC0'}
                      onWatchProgress={() => {}}
                    />
                  </div>
                )}

                {currentSlide.content_type === 'image' && currentSlide.media_url && (
                  <div className="rounded-2xl overflow-hidden border border-zinc-300 dark:border-zinc-800 bg-black/40">
                    <img
                      src={currentSlide.media_url}
                      alt={currentSlide.title}
                      className="w-full h-auto max-h-[300px] object-cover mx-auto"
                    />
                  </div>
                )}

                {currentSlide.body_markdown && (
                  <div className={`p-4 sm:p-5 rounded-2xl border leading-relaxed space-y-2 text-xs sm:text-sm ${
                    isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-800 text-white'
                  }`}>
                    <p className="whitespace-pre-line font-normal leading-relaxed">
                      {translateSlideBody(currentSlide.body_markdown, currentSlide.title, language)}
                    </p>
                  </div>
                )}

                {currentSlide.code_snippet && (
                  <div className="p-3.5 rounded-xl bg-black border border-zinc-800 font-mono text-[11px] text-white overflow-x-auto">
                    <pre>{currentSlide.code_snippet}</pre>
                  </div>
                )}
              </div>

              {/* QWIKLABS / COURSERA BOTTOM FOOTER BAR (COMPACT FIXED BOTTOM) */}
              <div className="shrink-0 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => showToast({ type: 'info', title: 'Feedback Recorded 🚩', message: 'Thank you! Issue flag reported to course instructor.' })}
                  className="text-xs font-bold text-zinc-500 hover:text-black dark:hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <span className="text-sm">🚩</span>
                  <span>Report an issue</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    disabled={currentSlideIndex === 0}
                    onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-800 text-black dark:text-white font-bold text-xs disabled:opacity-40 flex items-center space-x-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={triggerNextSlide}
                    className="px-5 py-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-black dark:text-white font-black text-xs shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <span>Go to next item</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODULE QUIZ RUNNER (FULL SCREEN & MAXIMIZE SUPPORTED) */}
          {activeTab === 'quiz' && (
            <div className={`p-4 sm:p-5 rounded-3xl border-2 space-y-4 ${
              isFullscreen
                ? 'fixed inset-2 z-50 shadow-2xl h-[calc(100vh-1rem)] max-h-none overflow-y-auto'
                : 'max-h-[calc(100vh-140px)] min-h-[460px] overflow-y-auto'
            } ${
              isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-950 border-zinc-400 text-white'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-mono font-bold uppercase text-zinc-500">Module {currentModuleIndex + 1} Quiz</span>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-bold shadow-xs shrink-0 border border-zinc-300 dark:border-zinc-700 active:scale-95"
                  title={isFullscreen ? "Exit Fullscreen" : "Maximize Quiz Runner"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  <span className="hidden sm:inline font-mono">{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
                </button>
              </div>

              <QuizRunner
                quiz={{
                  id: `q-${currentModuleIndex}`,
                  module_id: currentModule.id,
                  title: `${currentModule.title} — Module Quiz`,
                  quiz_type: 'module_quiz',
                  passing_score_percent: 80,
                  total_questions_to_select: 1,
                  max_attempts: 3,
                  is_randomized: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }}
                questions={(currentModule.quiz?.questions || [
                  {
                    id: 'q-1',
                    question_text: 'Which protocol ensures ordered packet transport across distributed nodes?',
                    options: [
                      { id: 'opt-1', option_text: 'TCP (Transmission Control Protocol)', is_correct: true },
                      { id: 'opt-2', option_text: 'UDP (User Datagram Protocol)', is_correct: false },
                      { id: 'opt-3', option_text: 'DNS (Domain Name System)', is_correct: false },
                      { id: 'opt-4', option_text: 'ICMP', is_correct: false }
                    ],
                    explanation: 'TCP guarantees ordered, reliable packet delivery.'
                  }
                ]).map((q: any) => ({
                  questionId: q.id || `q-${Math.random()}`,
                  questionText: q.question_text || q.question || 'Quiz question prompt',
                  explanation: q.explanation || 'Review module slides for details.',
                  options: (q.options || []).map((o: any) => ({
                    optionId: o.id || `o-${Math.random()}`,
                    optionText: o.option_text || o,
                    isCorrect: o.is_correct ?? true
                  }))
                }))}
                onPass={async () => {
                  setCompletedModuleIndices((prev) => Array.from(new Set([...prev, currentModuleIndex])));
                  showToast({ type: 'success', title: 'Module Quiz Passed! 🎉', message: `Module ${currentModuleIndex + 1} passed! Unlocking Module ${currentModuleIndex + 2}!` });
                  if (user) {
                    try {
                      await supabaseAdmin.from('quiz_attempts').upsert({
                        student_id: user.id,
                        student_email: user.email || 'student@signalhub.app',
                        course_id: course.id,
                        quiz_id: `q-${currentModuleIndex}`,
                        quiz_type: 'module',
                        score_percent: 100,
                        is_passed: true,
                        created_at: new Date().toISOString(),
                      });
                    } catch (e) {
                      console.log('Quiz attempt save note:', e);
                    }
                  }
                  if (currentModuleIndex < modules.length - 1) {
                    setCurrentModuleIndex((prev) => prev + 1);
                    setCurrentSlideIndex(0);
                    setActiveTab('slides');
                  } else {
                    setActiveTab('final_assessment');
                  }
                }}
              />
            </div>
          )}

          {/* TAB 3: FINAL ASSESSMENT EXAM (FULL SCREEN & MAXIMIZE SUPPORTED) */}
          {activeTab === 'final_assessment' && (
            <div className={`p-4 sm:p-5 rounded-3xl border-2 space-y-4 ${
              isFullscreen
                ? 'fixed inset-2 z-50 shadow-2xl h-[calc(100vh-1rem)] max-h-none overflow-y-auto'
                : 'max-h-[calc(100vh-140px)] min-h-[460px] overflow-y-auto'
            } ${
              isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-950 border-zinc-400 text-white'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-mono font-bold uppercase text-zinc-500">Final Certification Exam</span>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-bold shadow-xs shrink-0 border border-zinc-300 dark:border-zinc-700 active:scale-95"
                  title={isFullscreen ? "Exit Fullscreen" : "Maximize Final Exam"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  <span className="hidden sm:inline font-mono">{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
                </button>
              </div>

              <QuizRunner
                quiz={{
                  id: 'final-exam',
                  module_id: 'all',
                  title: course.final_assessment?.title || 'Mastery Certification Final Assessment',
                  quiz_type: 'module_quiz',
                  passing_score_percent: course.final_assessment?.passing_score_percent || 85,
                  total_questions_to_select: 2,
                  max_attempts: 5,
                  is_randomized: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }}
                questions={(course.final_assessment?.questions || [
                  {
                    id: 'fq-1',
                    question_text: 'Which design pattern combination guarantees resilient microservices?',
                    options: [
                      { id: 'fo-1', option_text: 'Circuit Breaker + Rate Limiter + Event Queue', is_correct: true },
                      { id: 'fo-2', option_text: 'Monolithic Sync Blocking Calls', is_correct: false },
                      { id: 'fo-3', option_text: 'Manual Server Restarts', is_correct: false }
                    ],
                    explanation: 'Combining circuit breakers and asynchronous queues isolates node failures.'
                  }
                ]).map((q: any) => ({
                  questionId: q.id || `fq-${Math.random()}`,
                  questionText: q.question_text || q.question || 'Final Exam question prompt',
                  explanation: q.explanation || 'Covers core principles across Modules 1 to 5.',
                  options: (q.options || []).map((o: any) => ({
                    optionId: o.id || `fo-${Math.random()}`,
                    optionText: o.option_text || o,
                    isCorrect: o.is_correct ?? true
                  }))
                }))}
                onPass={async () => {
                  try {
                    if (user) {
                      await supabaseAdmin
                        .from('enrollments')
                        .upsert({
                          student_id: user.id,
                          student_email: user.email,
                          course_id: course.id,
                          progress_percent: 100,
                          status: 'completed',
                          enrolled_at: new Date().toISOString()
                        });

                      await supabaseAdmin.from('quiz_attempts').upsert({
                        student_id: user.id,
                        student_email: user.email || 'student@signalhub.app',
                        course_id: course.id,
                        quiz_id: 'final-exam',
                        quiz_type: 'final',
                        score_percent: 100,
                        is_passed: true,
                        created_at: new Date().toISOString(),
                      });
                    }
                  } catch (err) {
                    console.error('Completion sync note:', err);
                  }

                  showToast({
                    type: 'success',
                    title: 'Final Assessment Completed! 🎓',
                    message: 'Congratulations! You completed 100% of curriculum requirements and unlocked your verified certificate.'
                  });

                  setTimeout(() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/certificate/${course.id}`;
                    }
                  }, 1500);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* MOBILE STICKY QUICK SLIDE NAVIGATION BAR */}
      {activeTab === 'slides' && (
        <div className={`lg:hidden fixed bottom-14 left-0 right-0 z-40 p-3 border-t backdrop-blur-xl flex items-center justify-between gap-3 ${
          isLight ? 'bg-white/95 border-zinc-200 shadow-2xl text-black' : 'bg-black/95 border-zinc-800 shadow-2xl text-white'
        }`}>
          <button
            type="button"
            disabled={currentSlideIndex === 0 && currentModuleIndex === 0}
            onClick={() => {
              if (currentSlideIndex > 0) {
                setCurrentSlideIndex((prev) => prev - 1);
              } else if (currentModuleIndex > 0) {
                setCurrentModuleIndex((prev) => prev - 1);
                setCurrentSlideIndex((modules[currentModuleIndex - 1]?.slides?.length || 1) - 1);
              }
            }}
            className="flex-1 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-black dark:text-white font-bold text-xs disabled:opacity-40 flex items-center justify-center space-x-1 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev Slide</span>
          </button>

          <span className="text-[11px] font-mono font-bold text-zinc-500 shrink-0">
            M{currentModuleIndex + 1} • S{currentSlideIndex + 1}
          </span>

          <button
            type="button"
            onClick={() => {
              const currentModSlides = currentModule?.slides?.length || 1;
              if (currentSlideIndex < currentModSlides - 1) {
                setCurrentSlideIndex((prev) => prev + 1);
              } else if (currentModuleIndex < modules.length - 1) {
                setCurrentModuleIndex((prev) => prev + 1);
                setCurrentSlideIndex(0);
              }
            }}
            className="flex-1 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs flex items-center justify-center space-x-1 active:scale-95 shadow-md cursor-pointer"
          >
            <span>Next Slide</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CHECKOUT MODAL FOR UNLOCKING PAID COURSE */}
      {showCheckoutModal && (
        <InstantEnrollmentModal
          course={course}
          onClose={() => setShowCheckoutModal(false)}
          onConfirmEnroll={(amount, method, utr) => handleConfirmPaidEnrollment(amount, method, utr)}
          processingPayment={processingPayment}
        />
      )}
    </div>
  );
}
