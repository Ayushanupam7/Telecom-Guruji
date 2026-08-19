'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Award, ShieldCheck, Lock, BookOpen, Download, ArrowRight, 
  Sparkles, CheckCircle2, Compass, Layers, Signal, Eye 
} from 'lucide-react';
import { INITIAL_DEMO_COURSE, getInstructorNameForCourse } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translateCourseTitle, translateCategory } from '@signalhub/shared';
import { supabaseAdmin } from '@/lib/supabase';
import { PageLoader } from '@/components/PageLoader';

interface EnrolledCertificateCard {
  course_id: string;
  title: string;
  category: string;
  thumbnail_url?: string;
  thumbnail_type?: string;
  instructor_name: string;
  progress_percent: number;
  is_completed: boolean;
  enrolled_at?: string;
}

export default function CertificatesHubPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { language, dict } = useLanguage();
  const isLight = theme === 'light';

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<EnrolledCertificateCard[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'completed' | 'in_progress'>('all');

  useEffect(() => {
    async function loadEnrolledCertificates() {
      try {
        let items: EnrolledCertificateCard[] = [];

        if (user) {
          const { data: dbEnrollments } = await supabaseAdmin
            .from('enrollments')
            .select(`
              course_id,
              progress_percent,
              status,
              enrolled_at
            `)
            .or(`student_id.eq.${user.id},student_email.eq.${user.email}`);

          if (dbEnrollments && dbEnrollments.length > 0) {
            const courseIds = dbEnrollments.map((e) => e.course_id);

            const { data: dbCourses } = await supabaseAdmin
              .from('courses')
              .select('*')
              .in('id', courseIds);

            const { data: dbProgress } = await supabaseAdmin
              .from('progress')
              .select('*')
              .eq('student_id', user.id)
              .in('course_id', courseIds);

            const { data: dbCerts } = await supabaseAdmin
              .from('certificates')
              .select('*')
              .or(`student_id.eq.${user.id},student_name.eq.${user.fullName || ''}`);

            const { data: dbQuizzes } = await supabaseAdmin
              .from('quiz_attempts')
              .select('*')
              .or(`student_id.eq.${user.id},student_email.eq.${user.email}`)
              .eq('is_passed', true);

            const coursesMap = new Map((dbCourses || []).map((c) => [c.id, c]));

            items = dbEnrollments.map((enr) => {
              const cObj = coursesMap.get(enr.course_id);

              const userProgressList = (dbProgress || []).filter(
                (p) => (p.course_id === enr.course_id || p.course_id === cObj?.id) && (p.is_completed === true || p.completed === true)
              );

              const hasCert = (dbCerts || []).some(
                (cert) => cert.course_id === enr.course_id || cert.course_id === cObj?.id
              );

              const hasFinalExam = (dbQuizzes || []).some(
                (q) => (q.course_id === enr.course_id || q.course_id === cObj?.id) && (q.quiz_id === 'final-exam' || q.quiz_id?.includes('final'))
              );

              const totalModules = cObj?.modules?.length || 4;
              const completedCount = userProgressList.length;
              let calcPercent = Math.min(
                100,
                Math.round((completedCount / totalModules) * 100) || Number(enr.progress_percent) || 0
              );

              const isDone = hasCert || hasFinalExam || enr.status === 'completed' || Number(enr.progress_percent) >= 100 || calcPercent >= 100;
              if (isDone) {
                calcPercent = 100;
              }

              return {
                course_id: enr.course_id,
                title: cObj?.title || 'Verified Course',
                category: cObj?.category || 'Computer Science',
                thumbnail_url: cObj?.thumbnail_url || undefined,
                thumbnail_type: (cObj as any)?.thumbnail_type || 'image',
                instructor_name: cObj?.trainer_name || getInstructorNameForCourse(enr.course_id) || 'Dr. Ayush Sharma',
                progress_percent: calcPercent,
                is_completed: isDone,
                enrolled_at: enr.enrolled_at,
              };
            });
          }
        }

        setCourses(items);
      } catch (err) {
        console.error('Certificates loading error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadEnrolledCertificates();
  }, [user]);

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
            Please sign in to access your SignalHub student dashboard, enrolled courses, and verified certificates.
          </p>
        </div>
        <Link
          href="/auth"
          className="px-6 py-3 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs shadow-lg transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
        >
          <span>Go to Authentication Page</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (loading) {
    return <PageLoader />;
  }

  const filteredCourses = courses.filter((c) => {
    if (filterTab === 'completed') return c.is_completed;
    if (filterTab === 'in_progress') return !c.is_completed;
    return true;
  });

  const completedCount = courses.filter((c) => c.is_completed).length;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto font-sans pb-16 px-3 sm:px-6">
      {/* HEADER SECTION (MONOCHROME BLACK & WHITE) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1.5 sm:space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-mono font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Verified Credentials Hub</span>
          </div>
          <h1 className={`text-xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
            My Verified Certificates
          </h1>
          <p className="text-xs text-zinc-500 max-w-xl font-medium leading-relaxed">
            View, preview, and download HD printable certificates for all your enrolled courses. Complete courses to 100% to unlock download!
          </p>
        </div>

        {/* STATS BADGE */}
        <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 flex items-center space-x-3.5 sm:space-x-4 shrink-0 transition-all ${
          isLight ? 'bg-white border-zinc-300 text-black shadow-md' : 'bg-zinc-950 border-zinc-400 text-white shadow-xl'
        }`}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-md shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-black text-black dark:text-white block">{completedCount} / {courses.length}</span>
            <span className="text-[10px] sm:text-[11px] font-mono text-zinc-500 uppercase font-bold">Certificates Unlocked</span>
          </div>
        </div>
      </div>

      {/* FILTER TABS (MONOCHROME BLACK & WHITE) */}
      <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 border cursor-pointer ${
            filterTab === 'all'
              ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
              : 'text-zinc-500 hover:text-black dark:hover:text-white border-transparent'
          }`}
        >
          All Enrolled ({courses.length})
        </button>

        <button
          onClick={() => setFilterTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center space-x-1.5 border ${
            filterTab === 'completed'
              ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
              : 'text-zinc-500 hover:text-black dark:hover:text-white border-transparent'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Unlocked ({completedCount})</span>
        </button>

        <button
          onClick={() => setFilterTab('in_progress')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center space-x-1.5 border ${
            filterTab === 'in_progress'
              ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
              : 'text-zinc-500 hover:text-black dark:hover:text-white border-transparent'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>In Progress ({courses.length - completedCount})</span>
        </button>
      </div>

      {/* GRID OF ENROLLED COURSE CERTIFICATE CARDS */}
      {filteredCourses.length === 0 ? (
        <div className={`p-12 rounded-3xl border text-center space-y-4 ${
          isLight ? 'bg-white border-zinc-300 shadow-sm' : 'bg-zinc-950 border-zinc-800 text-white'
        }`}>
          <div className="w-14 h-14 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto shadow-md">
            <Award className="w-7 h-7" />
          </div>
          <h3 className={`text-base font-black ${isLight ? 'text-black' : 'text-white'}`}>
            No Certificates In This Category
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto font-medium">
            Browse the course catalog to enroll in courses and start earning verified certificates!
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-black text-xs shadow-md hover:scale-105 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Courses</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => (
            <div
              key={c.course_id}
              className={`rounded-3xl border-2 transition-all overflow-hidden flex flex-col justify-between ${
                isLight
                  ? 'bg-white border-zinc-300 shadow-lg hover:shadow-xl hover:border-black text-black'
                  : 'bg-zinc-950 border-zinc-400 shadow-xl hover:border-white text-white'
              }`}
            >
              {/* MINI CERTIFICATE CANVAS HEADER (BLURRED IF INCOMPLETE) */}
              <div className="relative p-6 border-b border-zinc-200 dark:border-zinc-800 bg-black text-white text-center overflow-hidden">
                {/* BLUR OVERLAY IF NOT COMPLETED */}
                {!c.is_completed && (
                  <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-md">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="px-3 py-0.5 rounded-full bg-white text-black font-mono text-[9px] font-black uppercase">
                      🔒 Blurred Preview ({c.progress_percent}%)
                    </span>
                    <span className="text-[10px] text-zinc-300 font-medium">
                      Complete 100% of course to unlock
                    </span>
                  </div>
                )}

                {/* CERTIFICATE MINI DISPLAY BOARD */}
                <div className={`space-y-2.5 ${!c.is_completed ? 'filter blur-xs opacity-40' : ''}`}>
                  <div className="flex items-center justify-center space-x-1.5">
                    <Signal className="w-4 h-4 text-white" />
                    <span className="text-xs font-black tracking-wider text-white">SignalHub</span>
                  </div>
                  <span className="block font-mono text-[8px] uppercase tracking-widest text-zinc-400">
                    Official Certificate of Completion
                  </span>
                  <div className="font-serif italic text-sm text-white font-bold truncate max-w-[200px] mx-auto">
                    {user?.fullName || 'Student Learner'}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white text-black mx-auto flex items-center justify-center shadow-md">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* CARD DETAILS BODY */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white text-[10px] font-mono font-bold uppercase border border-zinc-200 dark:border-zinc-800">
                      {translateCategory(c.category, language)}
                    </span>
                    {c.is_completed ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 dark:text-emerald-600" />
                        <span>UNLOCKED & ISSUED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white border border-zinc-300 dark:border-zinc-700">
                        <Lock className="w-3 h-3 text-zinc-500" />
                        <span>IN PROGRESS ({c.progress_percent}%)</span>
                      </span>
                    )}
                  </div>

                  <h3 className={`text-base font-black line-clamp-2 ${isLight ? 'text-black' : 'text-white'}`}>
                    {translateCourseTitle(c.course_id, c.title, language)}
                  </h3>

                  <p className="text-xs text-zinc-500 font-medium">
                    {dict.instructor || 'Instructor'}: <span className="text-black dark:text-white font-bold">{c.instructor_name}</span>
                  </p>
                </div>

                {/* VERIFIED CERTIFICATE INCLUSION NOTICE BOX */}
                <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                  c.is_completed
                    ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-black dark:text-white'
                    : isLight
                    ? 'bg-zinc-50 border-zinc-200 text-zinc-800'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                }`}>
                  <div className="flex items-center space-x-1.5 font-mono text-[10px] font-black uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                    <span>{c.is_completed ? 'Official Credential Issued' : 'Verified Certificate Included'}</span>
                  </div>
                  <p className="text-[11px] leading-snug font-medium text-zinc-500">
                    {c.is_completed
                      ? 'Congratulations! You have completed 100% of curriculum requirements and your official authenticated credential is generated.'
                      : 'You are enrolled in this course. Complete 100% of all curriculum modules and quizzes to issue and claim your verified certificate.'}
                  </p>
                </div>

                {/* PROGRESS BAR */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500 font-bold">Curriculum Completion</span>
                    <span className="font-black text-black dark:text-white">
                      {c.progress_percent}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden border border-zinc-300 dark:border-zinc-700">
                    <div
                      className="h-full rounded-full bg-black dark:bg-white transition-all duration-500"
                      style={{ width: `${c.progress_percent}%` }}
                    />
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-2 space-y-2">
                  {c.is_completed ? (
                    <Link
                      href={`/certificate/${c.course_id}`}
                      className="w-full py-3 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs shadow-md flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer border border-black dark:border-white"
                    >
                      <Award className="w-4 h-4" />
                      <span>View & Print Official HD Certificate →</span>
                    </Link>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Link
                        href={`/learn/${c.course_id}/m1-l1`}
                        className="py-2.5 px-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black text-xs flex items-center justify-center space-x-1.5 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 cursor-pointer text-center"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Continue Course →</span>
                      </Link>

                      <Link
                        href={`/certificate/${c.course_id}`}
                        className="py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-black dark:text-white font-bold text-xs flex items-center justify-center space-x-1 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800 text-center"
                      >
                        <Eye className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Preview Format</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
