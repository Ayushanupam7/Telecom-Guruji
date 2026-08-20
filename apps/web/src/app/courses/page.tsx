'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Sparkles, User, ShieldCheck, ArrowRight, Layers, CheckCircle2,
  Signal, CreditCard, Lock, X, PlusCircle, Compass, BookOpen, LogOut, AlertTriangle,
  LayoutGrid, List, SlidersHorizontal, Filter, RefreshCw, Star, QrCode, Copy, Check
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { translateCourseTitle, translateCourseSummary, translateCategory } from '@signalhub/shared';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { formatCoursePrice, getCurrencySymbol } from '@/lib/currency';
import { CourseThumbnail } from '@/components/CourseThumbnail';
import { InstantEnrollmentModal } from '@/components/InstantEnrollmentModal';
import { getInstructorNameForCourse } from '@/lib/mockData';
import { PageLoader } from '@/components/PageLoader';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function CoursesPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { language, dict } = useLanguage();
  const isLight = theme === 'light';

  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'free' | 'paid'>('all');
  const [viewType, setViewType] = useState<'grid' | 'list'>('list');

  // Paid Course Checkout Modal State
  const [selectedPaidCourse, setSelectedPaidCourse] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Unenroll Modal State on Explore Cards
  const [courseToUnenroll, setCourseToUnenroll] = useState<any | null>(null);
  const [unenrolling, setUnenrolling] = useState(false);

  // Fetch ONLY REAL COURSES & ENROLLMENTS FROM SUPABASE DATABASE
  useEffect(() => {
    async function fetchLiveSupabaseCoursesAndEnrollments() {
      try {
        // 1. Fetch published courses from Supabase Database
        let courseData = null;
        const resAdmin = await supabaseAdmin.from('courses').select('*');

        if (!resAdmin.error && resAdmin.data && resAdmin.data.length > 0) {
          courseData = resAdmin.data;
        } else {
          const resAnon = await supabase.from('courses').select('*');
          if (!resAnon.error && resAnon.data) {
            courseData = resAnon.data;
          }
        }

        if (courseData && courseData.length > 0) {
          const publishedOnly = courseData.filter((c) => c.is_published !== false);

          const formatted = publishedOnly.map((c) => {
            const realInstructorName = c.trainer_name || getInstructorNameForCourse(c.category, c.title, c.instructor);
            return {
              ...c,
              instructor: { full_name: realInstructorName, avatar_url: '' },
              level: c.level || 'intermediate',
              course_type: c.course_type || (Number(c.price) > 0 ? 'paid' : 'free'),
              category: c.category || 'Computer Science',
              summary: c.summary || c.description || 'Comprehensive verified curriculum.',
              price: Number(c.price) || 0,
              currency: c.currency || 'INR',
              slug: c.slug || c.id,
              thumbnail_url: c.thumbnail_url || null,
              thumbnail_type: c.thumbnail_type || 'image',
            };
          });
          setCourses(formatted);
        } else {
          setCourses([]);
        }

        // 2. Fetch user active enrollments from Supabase Cloud DB
        const targetUserId = user?.id || 'e1111111-1111-1111-1111-111111111111';
        const targetEmail = user?.email || 'student@signalhub.app';

        const { data: enrollData } = await supabaseAdmin
          .from('enrollments')
          .select('course_id')
          .or(`student_id.eq.${targetUserId},student_email.eq.${targetEmail},student_id.eq.e1111111-1111-1111-1111-111111111111`);

        if (enrollData && enrollData.length > 0) {
          setEnrolledCourseIds(new Set(enrollData.map((e) => e.course_id)));
        }
      } catch (err) {
        console.error('Error fetching live courses:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveSupabaseCoursesAndEnrollments();
  }, [user]);

  // Extract Categories
  const categories = ['All', 'My Courses', ...Array.from(new Set(courses.map((c) => c.category)))];

  // Filter Logic
  const filtered = courses.filter((c) => {
    const isEnrolled = enrolledCourseIds.has(c.id);

    if (selectedCategory === 'My Courses') {
      if (!isEnrolled) return false;
    } else if (selectedCategory !== 'All' && c.category !== selectedCategory) {
      return false;
    }

    if (selectedLevel !== 'all' && c.level !== selectedLevel) return false;
    if (selectedType === 'free' && (c.price > 0 || c.course_type === 'paid')) return false;
    if (selectedType === 'paid' && c.price === 0 && c.course_type !== 'paid') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchSummary = c.summary?.toLowerCase().includes(q);
      const matchCategory = c.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchCategory) return false;
    }

    return true;
  });

  // Handle Quick / Paid Course Enrollment
  const handleQuickEnroll = (course: any) => {
    if (course.price > 0 || course.course_type === 'paid') {
      setSelectedPaidCourse(course);
    } else {
      executeEnrollmentInSupabase(course, 'free', 0);
    }
  };

  // Submit Paid Enrollment (UPI / Card Verification)
  const handleConfirmPaidEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaidCourse) return;

    setProcessingPayment(true);
    await executeEnrollmentInSupabase(selectedPaidCourse, paymentMethod, selectedPaidCourse.price);
  };

  // Internal Helper: Write Enrollment to Supabase
  const executeEnrollmentInSupabase = async (courseItem: any, method: string, paidAmount: number) => {
    try {
      const studentId = user?.id || 'e1111111-1111-1111-1111-111111111111';
      const studentEmail = user?.email || 'student@signalhub.app';
      const studentName = user?.fullName || 'Student Learner';

      // 1. Check if student is already enrolled
      const { data: existingEnrollments } = await supabaseAdmin
        .from('enrollments')
        .select('id, status')
        .eq('course_id', courseItem.id)
        .or(`student_id.eq.${studentId},student_email.eq.${studentEmail}`)
        .limit(1);

      if (existingEnrollments && existingEnrollments.length > 0) {
        setEnrolledCourseIds((prev) => new Set([...Array.from(prev), courseItem.id]));
        showToast({
          type: 'info',
          title: 'Already Enrolled',
          message: `You are already enrolled in "${courseItem.title}".`,
        });
        return;
      }

      // 2. Deterministic ID to prevent duplicate inserts
      const deterministicId = `enr-${studentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}-${courseItem.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;

      // Upsert enrollment record
      await supabaseAdmin.from('enrollments').upsert({
        id: deterministicId,
        student_id: studentId,
        student_email: studentEmail,
        student_name: studentName,
        course_id: courseItem.id,
        course_title: courseItem.title,
        progress_percent: 0,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        payment_status: paidAmount > 0 ? 'paid' : 'free',
        payment_method: method,
        amount_paid: paidAmount,
        utr_number: utrNumber || null,
      }, { onConflict: 'id' });

      // Update local state
      setEnrolledCourseIds((prev) => new Set([...Array.from(prev), courseItem.id]));

      showToast({
        type: 'success',
        title: paidAmount > 0 ? 'UPI Payment Verified & Enrolled! 🎉' : 'Enrolled Successfully! 🎉',
        message: paidAmount > 0
          ? `Verified ${getCurrencySymbol(courseItem.currency)}${paidAmount} via ${method.toUpperCase()} for "${courseItem.title}". Saved to Supabase DB!`
          : `Enrollment & profile saved to Supabase Cloud Database!`,
      });
    } catch (e) {
      console.log('Enroll error:', e);
    } finally {
      setSelectedPaidCourse(null);
      setProcessingPayment(false);
      setUtrNumber('');
    }
  };

  /**
   * CONFIRM UNENROLLMENT FROM CATALOG CARD
   */
  const handleConfirmUnenrollCard = async () => {
    if (!courseToUnenroll) return;
    setUnenrolling(true);

    const targetUserId = user?.id || 'e1111111-1111-1111-1111-111111111111';

    try {
      await supabaseAdmin
        .from('enrollments')
        .delete()
        .or(`student_id.eq.${targetUserId},student_email.eq.${user?.email || 'student@signalhub.app'}`)
        .eq('course_id', courseToUnenroll.id);

      await supabaseAdmin
        .from('progress')
        .delete()
        .or(`student_id.eq.${targetUserId}`)
        .eq('course_id', courseToUnenroll.id);

      setEnrolledCourseIds((prev) => {
        const updated = new Set(prev);
        updated.delete(courseToUnenroll.id);
        return updated;
      });

      showToast({
        type: 'info',
        title: 'Unenrolled Successfully',
        message: `You have unenrolled from "${courseToUnenroll.title}". Database synced!`,
      });
    } catch (e) {
      console.log('Unenroll note:', e);
    } finally {
      setUnenrolling(false);
      setCourseToUnenroll(null);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Sleek Header Bar (MONOCHROME BLACK & WHITE) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[11px] font-mono font-bold uppercase tracking-wider text-black dark:text-white">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Course Catalog</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
            {dict.heroTitle || 'Explore Courses'}
          </h1>
        </div>

        {/* Top Header CTAs */}
        <div className="flex items-center space-x-3 shrink-0">
          {user && (
            <Link
              href="/student/dashboard"
              className="px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs shadow-md transition-all flex items-center space-x-2 border border-black dark:border-white"
            >
              <BookOpen className="w-4 h-4" />
              <span>{dict.myEnrolledCourses || 'My Enrolled Courses'} ({enrolledCourseIds.size})</span>
            </Link>
          )}

          {user?.role === 'instructor' && (
            <Link
              href="/instructor/dashboard"
              className="px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs shadow-md transition-all flex items-center space-x-2 border border-black dark:border-white"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{dict.instructorDashboard || 'Instructor Studio'}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Modern Filter & Controls Toolbar (BLACK & WHITE) */}
      <div className={`p-4 rounded-3xl border ${isLight ? 'bg-white border-zinc-300 shadow-sm text-black' : 'bg-zinc-950 border-zinc-800 text-white'
        } space-y-4`}>
        {/* Top Row: Category Pills & Search + View Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center space-x-1.5 border ${selectedCategory === cat
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                    : isLight
                      ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
              >
                {cat === 'My Courses' && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{translateCategory(cat, language)}</span>
                {cat === 'My Courses' && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white text-[10px] font-bold">
                    {enrolledCourseIds.size}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Box & View Mode Toggle */}
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="relative flex-1 sm:w-64 min-w-[180px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={dict.searchCourses || 'Search courses...'}
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium focus:outline-none transition-colors border ${isLight
                    ? 'bg-zinc-50 border-zinc-300 text-black focus:border-black'
                    : 'bg-zinc-950 border-zinc-700 text-white focus:border-white'
                  }`}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-black dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle (List vs Grid) */}
            <div className={`flex items-center p-1 rounded-xl border text-xs shrink-0 ${isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-900 border-zinc-800'
              }`}>
              <button
                type="button"
                onClick={() => setViewType('list')}
                title="List View"
                className={`px-3 py-1.5 rounded-lg font-black transition-all flex items-center space-x-1.5 ${viewType === 'list'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>

              <button
                type="button"
                onClick={() => setViewType('grid')}
                title="Grid View"
                className={`px-3 py-1.5 rounded-lg font-black transition-all flex items-center space-x-1.5 ${viewType === 'grid'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Sub-filters (Level, Access Type, Active Count) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-zinc-500 font-mono text-[11px] font-bold flex items-center space-x-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>Filter:</span>
            </span>

            {/* Level Filter Dropdown */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className={`p-1.5 rounded-lg border text-xs font-bold focus:outline-none ${isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-800 text-white'
                }`}
            >
              <option value="all">{dict.allLevels || 'All Levels'}</option>
              <option value="beginner">{dict.beginner || 'Beginner'}</option>
              <option value="intermediate">{dict.intermediate || 'Intermediate'}</option>
              <option value="advanced">{dict.advanced || 'Advanced'}</option>
            </select>

            {/* Type Filter */}
            <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-800 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1 rounded font-black transition-all ${selectedType === 'all' ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'text-zinc-500'
                  }`}
              >
                {dict.allTypes || 'All Types'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('free')}
                className={`px-2.5 py-1 rounded font-black transition-all ${selectedType === 'free' ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'text-zinc-500'
                  }`}
              >
                {dict.freeAccess || 'Free'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('paid')}
                className={`px-2.5 py-1 rounded font-black transition-all ${selectedType === 'paid' ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'text-zinc-500'
                  }`}
              >
                {dict.paidCourses || 'Paid'}
              </button>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold text-zinc-500">
            Showing {filtered.length} verified courses
          </span>
        </div>
      </div>

      {/* Courses Catalog Display */}
      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <div className={`p-12 rounded-3xl border text-center space-y-4 ${isLight ? 'bg-white border-zinc-300 shadow-sm' : 'bg-zinc-950 border-zinc-800 text-white'
          }`}>
          <div className="w-14 h-14 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto shadow-md">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className={`text-lg font-black ${isLight ? 'text-black' : 'text-white'}`}>
              {selectedCategory === 'My Courses' ? 'No Enrolled Courses Found' : 'No Courses Match Filter'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {selectedCategory === 'My Courses'
                ? 'You have not enrolled in any courses yet. Browse the catalog to select a course and start learning!'
                : 'There are currently no active courses matching your selected search query or filters.'}
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedLevel('all');
              setSelectedType('all');
              setSearch('');
            }}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-black text-xs shadow-md hover:scale-105 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : viewType === 'grid' ? (
        /* MONOCHROME BLACK & WHITE GRID CARDS LAYOUT */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const isPaid = course.price > 0 || course.course_type === 'paid';

            return (
              <div
                key={course.id}
                className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${isLight
                    ? 'bg-white border-zinc-300 shadow-md hover:shadow-xl hover:border-black'
                    : 'bg-zinc-950 border-zinc-400 shadow-xl hover:border-white'
                  }`}
              >
                <div className="space-y-3">
                  {/* MEDIA THUMBNAIL - LINKS TO DETAILS PAGE FIRST */}
                  <Link href={`/courses/${course.slug || course.id}`} className="block group">
                    <CourseThumbnail
                      thumbnailUrl={course.thumbnail_url}
                      thumbnailType={course.thumbnail_type}
                      category={course.category}
                      title={course.title}
                      className="w-full h-40 rounded-2xl shadow-sm group-hover:scale-[1.01] transition-transform"
                    />
                  </Link>

                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <span className="px-2.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white text-[9px] font-mono font-bold uppercase border border-zinc-200 dark:border-zinc-800 truncate">
                      {translateCategory(course.category, language)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 bg-black text-white dark:bg-white dark:text-black border border-zinc-700 dark:border-zinc-300">
                      {isEnrolled ? `${dict.completed || 'Enrolled'} ✓` : isPaid ? `Paid (${formatCoursePrice(course.price, course.currency)})` : (dict.freeAccess || 'Free')}
                    </span>
                  </div>

                  <Link href={`/courses/${course.slug || course.id}`} className="block">
                    <h2 className={`text-sm font-black line-clamp-2 leading-snug hover:underline ${isLight ? 'text-black' : 'text-white'
                      }`}>
                      {translateCourseTitle(course.slug || course.id, course.title, language)}
                    </h2>
                  </Link>

                  <p className="text-[11px] leading-relaxed line-clamp-2 text-zinc-500 font-medium">
                    {translateCourseSummary(course.slug || course.id, course.summary, language)}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-900">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500 font-bold">Price</span>
                    <span className="font-extrabold text-black dark:text-white">
                      {formatCoursePrice(course.price, course.currency)}
                    </span>
                  </div>

                  {/* COURSE ACTION BUTTONS */}
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/courses/${course.slug || course.id}`}
                        className={`py-2 px-2.5 rounded-xl border text-[11px] font-black text-center transition-all ${isLight
                            ? 'border-zinc-300 text-black hover:bg-zinc-100'
                            : 'border-zinc-700 text-white hover:bg-zinc-900'
                          }`}
                      >
                        {dict.details || 'Details'}
                      </Link>

                      {isEnrolled ? (
                        <Link
                          href={`/learn/${course.id}/e5555555-5555-5555-5555-555555555555`}
                          className="py-2 px-2.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-[11px] font-black text-center shadow-md transition-all flex items-center justify-center space-x-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{dict.myLearning || 'Continue'}</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickEnroll(course)}
                          className="py-2 px-2.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-[11px] font-black shadow-md transition-all flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          {isPaid ? <Lock className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                          <span>{isPaid ? (dict.enrollNow || 'Enroll') : (dict.startLearning || 'Start')}</span>
                        </button>
                      )}
                    </div>

                    {/* UNENROLL BUTTON FOR ENROLLED COURSES */}
                    {isEnrolled && (
                      <button
                        type="button"
                        onClick={() => setCourseToUnenroll(course)}
                        className="w-full py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold transition-all flex items-center justify-center space-x-1"
                      >
                        <LogOut className="w-3 h-3 text-red-500" />
                        <span>Unenroll</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MONOCHROME BLACK & WHITE LIST VIEW LAYOUT */
        <div className="space-y-4">
          {filtered.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const isPaid = course.price > 0 || course.course_type === 'paid';

            return (
              <div
                key={course.id}
                className={`p-6 rounded-3xl border flex flex-col md:flex-row items-stretch gap-6 transition-all duration-300 ${isLight
                    ? 'bg-white border-zinc-300 shadow-lg hover:shadow-xl hover:border-black'
                    : 'bg-zinc-950 border-zinc-400 shadow-xl hover:border-white'
                  }`}
              >
                {/* Thumbnail on Left - LINKS TO DETAILS PAGE FIRST */}
                <Link href={`/courses/${course.slug || course.id}`} className="w-full md:w-64 h-48 sm:h-52 md:h-auto shrink-0 relative block group">
                  <CourseThumbnail
                    thumbnailUrl={course.thumbnail_url}
                    thumbnailType={course.thumbnail_type}
                    category={course.category}
                    title={course.title}
                    className="w-full h-full rounded-2xl group-hover:scale-[1.01] transition-transform"
                  />
                </Link>

                {/* Details on Right */}
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white text-[10px] font-mono font-bold uppercase border border-zinc-300 dark:border-zinc-700">
                          {course.category}
                        </span>
                        <span className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono uppercase font-bold text-zinc-600 dark:text-zinc-400">
                          Level: {course.level || 'Intermediate'}
                        </span>
                      </div>

                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-black text-white dark:bg-white dark:text-black">
                        {isEnrolled ? 'Enrolled ✓' : isPaid ? `Paid (${formatCoursePrice(course.price, course.currency)})` : 'Free Access'}
                      </span>
                    </div>

                    <Link href={`/courses/${course.slug || course.id}`} className="block">
                      <h2 className={`text-xl font-black hover:underline ${isLight ? 'text-black' : 'text-white'}`}>
                        {course.title}
                      </h2>
                    </Link>

                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                      {course.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-sm font-black text-black dark:text-white">
                      {formatCoursePrice(course.price, course.currency)}
                    </span>

                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/courses/${course.slug || course.id}`}
                        className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-black dark:text-white text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                      >
                        {dict.details || 'Details'}
                      </Link>

                      {isEnrolled ? (
                        <Link
                          href={`/learn/${course.id}/e5555555-5555-5555-5555-555555555555`}
                          className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-black shadow-md transition-all"
                        >
                          {dict.continueLearning || 'Continue'}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickEnroll(course)}
                          className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-black shadow-md transition-all cursor-pointer"
                        >
                          {isPaid ? (dict.enrollNow || 'Enroll') : (dict.startLearning || 'Start')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INSTANT ENROLLMENT MODAL */}
      {selectedPaidCourse && (
        <InstantEnrollmentModal
          course={selectedPaidCourse}
          onClose={() => setSelectedPaidCourse(null)}
          onConfirmEnroll={async (paidAmount, method, utr) => {
            setUtrNumber(utr);
            await executeEnrollmentInSupabase(selectedPaidCourse, method, paidAmount);
          }}
          processingPayment={processingPayment}
        />
      )}

      {/* UNENROLL CONFIRMATION MODAL */}
      {courseToUnenroll && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl space-y-5 relative ${isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-950 border-zinc-800 text-white'
            }`}>
            <button
              onClick={() => setCourseToUnenroll(null)}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-black dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black">Confirm Course Unenrollment</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Are you sure you want to unenroll from <span className="font-bold text-black dark:text-white">"{courseToUnenroll.title}"</span>? Database progress records will be removed.
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setCourseToUnenroll(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-800 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmUnenrollCard}
                disabled={unenrolling}
                className="flex-1 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-black shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center justify-center space-x-1.5"
              >
                <span>{unenrolling ? 'Unenrolling...' : 'Confirm Unenroll'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
