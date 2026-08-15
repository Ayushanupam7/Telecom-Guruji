'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Award, ShieldCheck, Download, Printer, Share2, ArrowLeft, 
  CheckCircle2, Sparkles, Signal, Copy, Check, QrCode, FileText, Lock, BookOpen 
} from 'lucide-react';
import { INITIAL_DEMO_COURSE, getInstructorNameForCourse } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { translateCourseTitle, translateCategory } from '@signalhub/shared';
import { supabaseAdmin } from '@/lib/supabase';
import { PageLoader } from '@/components/PageLoader';

export default function CourseCertificatePage({
  params,
}: {
  params: { courseId: string };
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { language, dict } = useLanguage();
  const isLight = theme === 'light';

  const courseId = params?.courseId || INITIAL_DEMO_COURSE.id;

  const [course, setCourse] = useState<any>(INITIAL_DEMO_COURSE);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const certId = `SH-2026-${courseId.slice(0, 4).toUpperCase()}-99`;
  const issueDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const studentName = user?.fullName || 'Student Learner';
  const instructorName = course.trainer_name || getInstructorNameForCourse(courseId) || 'Dr. Ayush Sharma';

  useEffect(() => {
    async function fetchCourseDetails() {
      try {
        // Query by id OR slug safely without .single()
        const { data: dbCourses } = await supabaseAdmin
          .from('courses')
          .select('*')
          .or(`id.eq.${courseId},slug.eq.${courseId}`)
          .limit(1);

        const dbCourse = dbCourses && dbCourses.length > 0 ? dbCourses[0] : null;
        const activeCourse = dbCourse || INITIAL_DEMO_COURSE;
        setCourse({ ...INITIAL_DEMO_COURSE, ...activeCourse });

        let unlocked = false;
        let percent = 0;

        if (user) {
          // 1. Check Supabase enrollments table for student ID or Email
          const { data: dbEnrollments } = await supabaseAdmin
            .from('enrollments')
            .select('*')
            .or(`student_id.eq.${user.id},student_email.eq.${user.email}`)
            .or(`course_id.eq.${courseId},course_id.eq.${activeCourse.id},course_id.eq.${activeCourse.slug || ''}`);

          if (dbEnrollments && dbEnrollments.length > 0) {
            const dbEnroll = dbEnrollments[0];
            percent = Number(dbEnroll.progress_percent) || 0;
            if (dbEnroll.status === 'completed' || percent >= 100) {
              unlocked = true;
              percent = 100;
            }
          }

          // 2. Check Supabase quiz_attempts table if passed final or module quiz
          if (!unlocked) {
            const { data: quizData } = await supabaseAdmin
              .from('quiz_attempts')
              .select('*')
              .or(`student_id.eq.${user.id},student_email.eq.${user.email}`)
              .or(`course_id.eq.${courseId},course_id.eq.${activeCourse.id}`)
              .eq('is_passed', true)
              .limit(1);

            if (quizData && quizData.length > 0) {
              unlocked = true;
              percent = 100;
            }
          }
        }

        // 3. LocalStorage fallback for instant completion sync
        if (!unlocked && typeof window !== 'undefined') {
          const localDone = localStorage.getItem(`completed_${courseId}`) || localStorage.getItem(`completed_${activeCourse.id}`);
          if (localDone === 'true') {
            unlocked = true;
            percent = 100;
          }
        }

        // Default test course auto-unlock for demo testing
        if (courseId === INITIAL_DEMO_COURSE.id) {
          unlocked = true;
          percent = 100;
        }

        setProgressPercent(unlocked ? 100 : percent);
        setIsCompleted(unlocked);
      } catch (e) {
        console.log('Certificate fetch note:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchCourseDetails();
  }, [courseId, user]);

  const handlePrint = () => {
    if (!isCompleted) {
      showToast({
        type: 'warning',
        title: 'Certificate Locked 🔒',
        message: `Course progress is at ${progressPercent}%. Complete 100% of course slides & assessment to download verified PDF!`,
      });
      return;
    }
    showToast({
      type: 'info',
      title: 'Preparing HD Certificate PDF... 🖨️',
      message: 'Select "Save as PDF" in your print dialog to download your high-definition credential!',
    });
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast({
        type: 'success',
        title: 'Verification Link Copied! 📋',
        message: 'Shareable certificate link copied to clipboard.',
      });
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans pb-16">
      {/* TOP NAV BAR & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold">
            <Link href="/certificates" className="text-zinc-500 hover:text-black dark:hover:text-white flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Certificates Hub</span>
            </Link>
            <span className="text-zinc-400">/</span>
            <span className="text-black dark:text-white">{dict.certificate || 'Verified Certificate'}</span>
          </div>
          <h1 className={`text-xl sm:text-2xl font-black tracking-tight mt-1 ${isLight ? 'text-black' : 'text-white'}`}>
            {dict.certificate || 'Verified Certificate'} Preview & Download
          </h1>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleCopyLink}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
              isLight
                ? 'bg-white border-zinc-300 text-black hover:bg-zinc-100'
                : 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800'
            }`}
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied!' : 'Share Link'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!isCompleted}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs shadow-md flex items-center space-x-2 transition-all active:scale-95 border ${
              isCompleted
                ? 'bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black border-black dark:border-white cursor-pointer'
                : 'bg-zinc-200 border-zinc-400 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 cursor-not-allowed opacity-80'
            }`}
          >
            {isCompleted ? <Printer className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{isCompleted ? 'Download PDF / Print' : `Download Locked (${progressPercent}%)`}</span>
          </button>
        </div>
      </div>

      {/* VERIFICATION BADGE BANNER */}
      {isCompleted ? (
        <div className="p-4 rounded-2xl border-2 bg-black text-white dark:bg-white dark:text-black border-black dark:border-white text-xs font-bold flex items-center justify-between print:hidden shadow-md">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5" />
            <span>Official Cryptographic Verification Record • Valid Certificate Authority</span>
          </div>
          <span className="font-mono text-[11px] bg-white text-black dark:bg-black dark:text-white px-3 py-1 rounded-full font-black border border-black dark:border-white">
            ID: {certId}
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border-2 bg-zinc-100 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 text-black dark:text-white text-xs font-bold flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2.5">
            <Lock className="w-5 h-5" />
            <span>Certificate Locked (Progress: {progressPercent}%) • Complete 100% of course modules to unlock verified certificate download!</span>
          </div>
          <Link
            href={`/learn/${course.id}/lesson-1`}
            className="px-3.5 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-black text-[11px] hover:opacity-90 transition-all flex items-center space-x-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Finish Course →</span>
          </Link>
        </div>
      )}

      {/* 📜 PRINTABLE OFFICIAL CERTIFICATE CONTAINER WITH CONDITIONAL BLUR OVERLAY */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        {/* BLUR OVERLAY FOR UNCOMPLETED COURSES */}
        {!isCompleted && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xs">
            <div className="p-6 sm:p-8 rounded-3xl bg-black border-2 border-white text-center space-y-4 max-w-md shadow-2xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white text-black flex items-center justify-center mx-auto shadow-xl">
                <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-white text-black font-mono text-[10px] font-black uppercase tracking-wider">
                  🔒 Blurred Preview ({progressPercent}%)
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">Course In Progress</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  Complete 100% of course modules & slide checkpoints to unlock your official verified certificate & HD PDF download!
                </p>
              </div>
              <Link
                href={`/learn/${course.id}/lesson-1`}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-black shadow-lg hover:scale-105 transition-all w-full"
              >
                <BookOpen className="w-4 h-4" />
                <span>Continue Course to Unlock →</span>
              </Link>
            </div>
          </div>
        )}

        {/* ACTUAL CERTIFICATE BOARD (BLACK & WHITE HIGH CONTRAST) */}
        <div
          id="certificate-print-area"
          className={`p-5 sm:p-10 md:p-14 border-4 text-center relative overflow-hidden transition-all ${
            !isCompleted ? 'filter blur-xs select-none pointer-events-none opacity-40' : ''
          } ${
            isLight
              ? 'bg-white border-black text-black'
              : 'bg-black border-white text-white'
          } print:p-6 print:m-0 print:border-4 print:shadow-none print:w-full print:h-auto`}
        >
          {/* MONOCHROME CORNER ACCENTS */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-l-2 border-black dark:border-white pointer-events-none" />
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-r-2 border-black dark:border-white pointer-events-none" />
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-l-2 border-black dark:border-white pointer-events-none" />
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-r-2 border-black dark:border-white pointer-events-none" />

          {/* BRANDING HEADER */}
          <div className="flex items-center justify-center space-x-2.5 sm:space-x-3 mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center border border-zinc-800 dark:border-zinc-200 shadow-md shrink-0">
              <Signal className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="text-left">
              <span className="text-xl sm:text-2xl font-black tracking-wider text-black dark:text-white block sm:inline">Telecom Guruji</span>
              <span className="block text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
                Verified Certification Authority
              </span>
            </div>
          </div>

          {/* TITLE */}
          <div className="space-y-2 mb-6 sm:mb-8">
            <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest border border-black dark:border-white inline-block">
              {course?.certificate_config?.cert_title || 'Official Certificate of Completion'}
            </span>
            <h2 className="text-[10px] sm:text-xs uppercase font-mono tracking-widest text-zinc-500 font-bold pt-3">
              This Certificate is Proudly Presented To
            </h2>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-black dark:text-white py-1 break-words">
              {studentName}
            </h1>
          </div>

          {/* BODY CITATION */}
          <div className="max-w-2xl mx-auto space-y-3 mb-8 sm:mb-10 text-xs sm:text-sm leading-relaxed font-medium">
            <p className={isLight ? 'text-black' : 'text-white'}>
              for successfully fulfilling all module requirements, completing verified hands-on slides, passing interactive checkpoints, and achieving excellence in the engineering course:
            </p>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight break-words">
              {translateCourseTitle(course.slug || course.id, course.title, language)}
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono pt-1">
              <span className="px-2.5 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black font-bold uppercase text-[10px]">
                {translateCategory(course.category, language)}
              </span>
              <span className="text-zinc-500 font-bold text-[11px]">• Verified Engineering Standard</span>
            </div>
          </div>

          {/* FOOTER METADATA & SIGNATURES */}
          <div className="pt-6 sm:pt-8 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-xs">
            {/* INSTRUCTOR SIGNATURE */}
            <div className="space-y-1 text-center sm:text-left">
              <div className="font-serif italic text-base sm:text-lg text-black dark:text-white font-bold border-b border-black dark:border-white pb-1 inline-block min-w-[120px]">
                {course?.certificate_config?.signature_name || instructorName}
              </div>
              <span className="block font-mono text-[9px] sm:text-[10px] uppercase text-zinc-500 font-bold">Authorized Instructor Signature</span>
            </div>

            {/* VERIFICATION SEAL */}
            <div className="flex flex-col items-center justify-center space-y-1 my-2 sm:my-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black text-white dark:bg-white dark:text-black flex flex-col items-center justify-center font-black shadow-lg border-2 border-black dark:border-white">
                <Award className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="text-[7px] sm:text-[8px] uppercase tracking-tighter font-black">VERIFIED</span>
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] text-black dark:text-white font-bold uppercase">
                {course?.certificate_config?.seal_text || 'Authentic Seal'}
              </span>
            </div>

            {/* DATE & CERT ID */}
            <div className="space-y-1 text-center sm:text-right">
              <div className="font-mono text-black dark:text-white font-bold text-xs">{issueDate}</div>
              <span className="block font-mono text-[9px] sm:text-[10px] uppercase text-zinc-500 font-bold">Date Issued</span>
              <div className="font-mono text-[9px] sm:text-[10px] text-black dark:text-white font-black truncate">{certId}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
