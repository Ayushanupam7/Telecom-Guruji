'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Award,
  User,
  Sparkles,
  ShieldCheck,
  Star,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  CreditCard,
  QrCode,
  Check,
  X,
  Lock,
  ArrowRight,
  HelpCircle,
  Share2,
  LogOut,
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  Edit3,
  Send
} from 'lucide-react';
import { INITIAL_DEMO_COURSE } from '@/lib/mockData';
import { Course, Module } from '@signalhub/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrencySymbol, formatCoursePrice } from '@/lib/currency';
import { InstantEnrollmentModal } from '@/components/InstantEnrollmentModal';
import { PageLoader } from '@/components/PageLoader';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CourseReview {
  id: string;
  course_id: string;
  student_id: string;
  student_name: string;
  student_email?: string;
  rating: number;
  title?: string;
  body?: string;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Star Rating Display Component ────────────────────────────────────────────
function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sizeClass} ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`}
        />
      ))}
    </div>
  );
}

// ─── Interactive Star Picker ───────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="p-0.5 transition-transform hover:scale-110 active:scale-95"
          aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              s <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-zinc-300 dark:text-zinc-600'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-bold text-zinc-500 dark:text-zinc-400 min-w-[80px]">
        {hovered || value
          ? ['', 'Terrible 😞', 'Poor 😕', 'Average 😐', 'Good 😊', 'Excellent 🌟'][hovered || value]
          : 'Tap to rate'}
      </span>
    </div>
  );
}

// ─── Rating Distribution Bar ──────────────────────────────────────────────────
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1 shrink-0 w-10">
        <span className="font-mono font-bold">{star}</span>
        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      </div>
      <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-zinc-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Format review date ────────────────────────────────────────────────────────
function formatReviewDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function RedesignedCourseDetailsPage({ params }: { params?: { id?: string } }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const isLight = theme === 'light';

  const targetId = params?.id || INITIAL_DEMO_COURSE.id;

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course>(INITIAL_DEMO_COURSE);
  const [modules, setModules] = useState<Module[]>(INITIAL_DEMO_COURSE.modules || []);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<{ [id: string]: boolean }>({});

  // ─── Reviews State ────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myReview, setMyReview] = useState<CourseReview | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // ─── Instructor Profile State ─────────────────────────────────────────────
  const [instructorProfile, setInstructorProfile] = useState<{
    id: string;
    full_name: string;
    title?: string;
    specialization?: string;
    avatar_url?: string;
  } | null>(null);

  // Computed stats
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  useEffect(() => {
    async function loadLiveCourse() {
      try {
        setLoading(true);

        // 1. Fetch Course from Supabase
        const { data: dbCourses } = await supabaseAdmin
          .from('courses')
          .select('*')
          .or(`id.eq.${targetId},slug.eq.${targetId}`)
          .limit(1);

        const activeCourse = dbCourses && dbCourses.length > 0 ? dbCourses[0] : INITIAL_DEMO_COURSE;

        // 2. Fetch Modules from Supabase
        const { data: dbModules } = await supabaseAdmin
          .from('modules')
          .select('*')
          .or(`course_id.eq.${activeCourse.id},course_id.eq.${targetId}`)
          .order('sequence_order', { ascending: true });

        let parsedModules: Module[] = [];
        if (dbModules && dbModules.length > 0) {
          parsedModules = dbModules.map((m) => ({
            ...m,
            slides: m.slides_data || m.slides || [],
            quiz: m.quiz_data || m.quiz || undefined,
          }));
        } else if (activeCourse.modules && activeCourse.modules.length > 0) {
          parsedModules = activeCourse.modules;
        } else {
          parsedModules = INITIAL_DEMO_COURSE.modules || [];
        }

        setCourse({
          ...INITIAL_DEMO_COURSE,
          ...activeCourse,
          price: Number(activeCourse.price) || 0,
        });
        setModules(parsedModules);

        // Expand first module by default
        if (parsedModules[0]) {
          setExpandedModules({ [parsedModules[0].id]: true });
        }

        // 3b. Fetch Instructor Profile
        if (activeCourse.instructor_id) {
          const { data: profileData } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, title, specialization, avatar_url')
            .eq('id', activeCourse.instructor_id)
            .limit(1);
          if (profileData && profileData.length > 0) {
            setInstructorProfile(profileData[0]);
          }
        }

        // 3. Check Enrollment Status
        if (user) {
          const { data: enrolls } = await supabaseAdmin
            .from('enrollments')
            .select('id, status')
            .eq('course_id', activeCourse.id)
            .or(`student_id.eq.${user.id},student_email.eq.${user.email}`)
            .limit(1);

          if (enrolls && enrolls.length > 0 && enrolls[0].status === 'active') {
            setIsEnrolled(true);
          }
        }
      } catch (err) {
        console.error('Error loading course details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLiveCourse();
  }, [targetId, user]);

  // ─── Load Reviews ─────────────────────────────────────────────────────────
  const loadReviews = useCallback(async (courseId: string) => {
    try {
      setReviewsLoading(true);
      const { data, error } = await supabaseAdmin
        .from('course_reviews')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Reviews load error:', error.message);
        return;
      }

      const allReviews = data || [];
      setReviews(allReviews);

      // Find current user's review
      if (user) {
        const mine = allReviews.find(
          (r) => r.student_id === user.id || r.student_email === user.email
        );
        if (mine) {
          setMyReview(mine);
          setReviewRating(mine.rating);
          setReviewTitle(mine.title || '');
          setReviewBody(mine.body || '');
        }
      }
    } catch (err) {
      console.warn('Reviews fetch failed:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (course.id && course.id !== INITIAL_DEMO_COURSE.id) {
      loadReviews(course.id);
    }
  }, [course.id, loadReviews]);

  // ─── Submit Review ────────────────────────────────────────────────────────
  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      showToast({ type: 'error', title: 'Rating Required', message: 'Please select a star rating before submitting.' });
      return;
    }
    if (!reviewBody.trim()) {
      showToast({ type: 'error', title: 'Review Required', message: 'Please write your review before submitting.' });
      return;
    }

    try {
      setSubmittingReview(true);
      const studentId = user?.id || 'anonymous';
      const studentName = user?.fullName || 'Anonymous Student';
      const studentEmail = user?.email;

      const reviewData = {
        course_id: course.id,
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail,
        rating: reviewRating,
        title: reviewTitle.trim() || null,
        body: reviewBody.trim(),
        is_verified_purchase: isEnrolled,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('course_reviews')
        .upsert(reviewData, { onConflict: 'student_id,course_id' })
        .select()
        .single();

      if (error) throw error;

      showToast({
        type: 'success',
        title: myReview ? 'Review Updated! ✨' : 'Review Submitted! 🎉',
        message: 'Thank you for your feedback. The instructor has been notified.',
      });

      setMyReview(data);
      setShowReviewForm(false);
      await loadReviews(course.id);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Submission Failed', message: err.message });
    } finally {
      setSubmittingReview(false);
    }
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [processingPayment, setProcessingPayment] = useState(false);

  const handleConfirmEnroll = async (paidAmount: number, method: string, utr: string) => {
    try {
      setProcessingPayment(true);
      const studentId = user?.id || 'e1111111-1111-1111-1111-111111111111';
      const studentName = user?.fullName || 'Student Learner';
      const studentEmail = user?.email || 'student@signalhub.app';

      // 1. Check if student is already enrolled in this course
      const { data: existingEnrollments } = await supabaseAdmin
        .from('enrollments')
        .select('id, status')
        .eq('course_id', course.id)
        .or(`student_id.eq.${studentId},student_email.eq.${studentEmail}`)
        .limit(1);

      if (existingEnrollments && existingEnrollments.length > 0) {
        setIsEnrolled(true);
        setShowEnrollModal(false);
        showToast({
          type: 'info',
          title: 'Already Enrolled! 📚',
          message: 'You already have active access to this course. Redirecting to player...',
        });
        router.push(`/learn/${course.id}/m1-l1`);
        return;
      }

      // 2. Deterministic ID to prevent race condition duplicates
      const deterministicId = `enr-${studentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}-${course.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;

      const { error } = await supabaseAdmin.from('enrollments').upsert({
        id: deterministicId,
        student_id: studentId,
        course_id: course.id,
        status: 'active',
        payment_status: course.price > 0 ? 'paid' : 'free',
        amount_paid: paidAmount || course.price || 0,
        payment_method: method || 'upi_qr',
        utr_number: utr || undefined,
        student_name: studentName,
        student_email: studentEmail,
        enrolled_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) console.warn('Enrollment insert note:', error.message);

      setIsEnrolled(true);
      setShowEnrollModal(false);
      showToast({
        type: 'success',
        title: 'Enrolled Successfully! 🎉',
        message: 'Welcome to the course. You can begin learning immediately.',
      });
      router.push(`/learn/${course.id}/m1-l1`);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Enrollment Error', message: err.message });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleConfirmUnenroll = async () => {
    try {
      setUnenrolling(true);
      const targetUserId = user?.id || 'e1111111-1111-1111-1111-111111111111';

      await supabaseAdmin
        .from('enrollments')
        .delete()
        .or(`student_id.eq.${targetUserId},student_email.eq.${user?.email || 'student@signalhub.app'}`)
        .eq('course_id', course.id);

      await supabaseAdmin
        .from('progress')
        .delete()
        .or(`student_id.eq.${targetUserId}`)
        .eq('course_id', course.id);

      setIsEnrolled(false);
      setShowUnenrollModal(false);
      showToast({
        type: 'info',
        title: 'Unenrolled Successfully',
        message: `You have successfully unenrolled from "${course.title}".`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Unenroll Error', message: err.message });
    } finally {
      setUnenrolling(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const template = course.template_config || {
    theme: 'telecom_classic',
    primaryColor: '#0284c7',
    secondaryColor: '#6366f1',
    backgroundColor: '#000000',
    typography: 'roboto',
    cardStyle: 'bordered',
    slideLayout: 'standard',
    certificateDesign: 'classic',
  };

  const totalLessons = modules.reduce(
    (acc, m) => acc + (m.slides || m.slides_data || []).length,
    0
  );

  const displayRating = avgRating > 0 ? avgRating.toFixed(1) : '—';
  const displayReviewCount = reviews.length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white pb-20">
      {/* Instant Enrollment Modal */}
      {showEnrollModal && (
        <InstantEnrollmentModal
          course={course}
          onClose={() => setShowEnrollModal(false)}
          onConfirmEnroll={handleConfirmEnroll}
          processingPayment={processingPayment}
        />
      )}

      {/* Unenroll Confirmation Modal */}
      {showUnenrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-5 animate-in zoom-in-95 ${
              isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black">Unenroll from Course?</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Are you sure you want to unenroll from <strong>{course.title}</strong>? Your completed slides and quiz progress will be removed.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={unenrolling}
                onClick={() => setShowUnenrollModal(false)}
                className="flex-1 py-3 rounded-xl border text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Keep Enrolled
              </button>

              <button
                type="button"
                disabled={unenrolling}
                onClick={handleConfirmUnenroll}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg transition flex items-center justify-center space-x-1.5"
              >
                {unenrolling ? (
                  <span>Unenrolling...</span>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Yes, Unenroll</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <div
        className={`relative border-b overflow-hidden pt-12 pb-16 ${
          isLight ? 'bg-gradient-to-b from-white via-zinc-50 to-zinc-100 border-zinc-200' : 'bg-gradient-to-b from-zinc-950 via-black to-zinc-950 border-zinc-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Category & Rating Badges */}
              <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                <span
                  className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-sm"
                  style={{ backgroundColor: template.primaryColor || '#0284c7' }}
                >
                  {course.category || 'Telecommunications'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {course.level || 'Intermediate'}
                </span>
                {/* Live rating badge */}
                <div className="flex items-center space-x-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  {avgRating > 0 ? (
                    <span>{avgRating.toFixed(1)} ({displayReviewCount} Review{displayReviewCount !== 1 ? 's' : ''})</span>
                  ) : (
                    <span>No reviews yet</span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                {course.title}
              </h1>

              {/* Summary */}
              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
                {course.summary || course.description}
              </p>

              {/* Instructor Credentials — clickable link to public profile */}
              {(() => {
                const instructorName = instructorProfile?.full_name || course.trainer_name || 'Dr. Ayush Sharma';
                const instructorTitle = instructorProfile?.title || 'Lead Telecom Systems Architect';
                const instructorSpec = instructorProfile?.specialization;
                const profileId = instructorProfile?.id || course.instructor_id;
                const avatarInitial = instructorName.charAt(0);

                const avatarEl = (
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-md shrink-0 overflow-hidden"
                    style={{ backgroundColor: template.secondaryColor || '#6366f1' }}
                  >
                    {instructorProfile?.avatar_url ? (
                      <img src={instructorProfile.avatar_url} alt={instructorName} className="w-full h-full object-cover" />
                    ) : avatarInitial}
                  </div>
                );

                const infoEl = (
                  <div>
                    <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Course Instructor</div>
                    <div className="text-base font-bold group-hover:underline underline-offset-2 decoration-2" style={{ textDecorationColor: template.primaryColor || '#0284c7' }}>
                      {instructorName}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {instructorSpec || instructorTitle}
                    </div>
                  </div>
                );

                if (profileId) {
                  return (
                    <Link href={`/instructor/${profileId}`} className="group flex items-center space-x-3 pt-2 hover:opacity-90 transition">
                      {avatarEl}
                      {infoEl}
                    </Link>
                  );
                }
                return (
                  <div className="flex items-center space-x-3 pt-2">
                    {avatarEl}
                    {infoEl}
                  </div>
                );
              })()}

              {/* Quick Specs Bar */}
              <div className="grid grid-cols-3 gap-4 pt-4 max-w-md">
                <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                  <div className="text-lg font-black font-mono">{modules.length}</div>
                  <div className="text-xs text-zinc-400">Modules</div>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                  <div className="text-lg font-black font-mono">{totalLessons}</div>
                  <div className="text-xs text-zinc-400">Lessons / Slides</div>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                  <div className="text-lg font-black font-mono">{course.course_duration || 90}m</div>
                  <div className="text-xs text-zinc-400">Total Duration</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                {isEnrolled ? (
                  <>
                    <Link
                      href={`/learn/${course.id}/m1-l1`}
                      className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider flex items-center space-x-2 shadow-lg transition"
                    >
                      <PlayCircle className="w-5 h-5" />
                      <span>Continue Learning →</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setShowUnenrollModal(true)}
                      className="px-6 py-4 rounded-2xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold text-sm transition flex items-center space-x-2 shadow-xs"
                      title="Unenroll from this course"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Unenroll</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="px-9 py-4 rounded-2xl text-white font-black text-sm uppercase tracking-wider flex items-center space-x-2 shadow-xl hover:opacity-90 transition"
                    style={{ backgroundColor: template.primaryColor || '#0284c7' }}
                  >
                    <span>Enroll Now • {course.price && course.price > 0 ? `${getCurrencySymbol(course.currency || 'INR')} ${course.price}` : 'Free'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {!isEnrolled && (
                  <Link
                    href={`/learn/${course.id}/m1-l1`}
                    className="px-6 py-4 rounded-2xl border font-bold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
                  >
                    Free Preview
                  </Link>
                )}
              </div>
            </div>

            {/* Right Card / Thumbnail (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 aspect-video lg:aspect-square">
                <img
                  src={
                    course.thumbnail_url ||
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                  <div className="text-white space-y-2">
                    <span className="text-xs uppercase font-mono font-bold text-sky-400">Includes Verified Certificate</span>
                    <h3 className="text-xl font-bold">{course.title}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN DETAILS & ROADMAP BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Main (8 cols) */}
          <div className="lg:col-span-8 space-y-12">
            {/* 1. What You'll Learn Grid */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight">What You'll Learn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  course.content_overview?.learning_outcomes || [
                    'Telecom fundamentals and wireless cellular network architecture',
                    '2G, 3G, 4G LTE and 5G New Radio core signalling protocols',
                    '5G Service-Based Architecture (SBA) and HTTP/2 microservices',
                    'Massive MIMO beamforming, mmWave, and OFDMA modulation',
                    'End-to-end network slicing and edge computing (MEC) deployment',
                    'Hands-on interactive module quizzes & certified final assessment',
                  ]
                ).map((outcome, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                      isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium leading-relaxed">{outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Detailed Description */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight">About this Course</h2>
              <div
                className={`p-6 rounded-3xl border text-sm leading-relaxed whitespace-pre-line ${
                  isLight ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                }`}
              >
                {course.detailed_description || course.description || course.summary}
              </div>
            </div>

            {/* 3. Comprehensive Interactive Curriculum Roadmap */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Course Curriculum & Roadmap</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {modules.length} Modules • {totalLessons} Lessons • {course.course_duration || 90} mins total length
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {modules.map((mod, modIdx) => {
                  const isExpanded = !!expandedModules[mod.id];
                  const modSlides = mod.slides || mod.slides_data || [];

                  return (
                    <div
                      key={mod.id}
                      className={`rounded-2xl border overflow-hidden transition ${
                        isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      {/* Module Accordion Header */}
                      <div
                        onClick={() => toggleModule(mod.id)}
                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 font-mono font-black flex items-center justify-center text-xs">
                            {String(modIdx + 1).padStart(2, '0')}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm sm:text-base">{mod.title}</h3>
                            <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-0.5">
                              <span>{modSlides.length} Lessons</span>
                              <span>•</span>
                              <span>{mod.duration_minutes || 30} mins</span>
                              {mod.is_free_preview && !isEnrolled && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-500 font-bold">Free Preview</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {mod.has_quiz && (
                            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <HelpCircle className="w-3 h-3" />
                              <span>Quiz Included</span>
                            </span>
                          )}
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                        </div>
                      </div>

                      {/* Module Lessons Accordion Body */}
                      {isExpanded && (
                        <div className="p-5 pt-0 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2 mt-2">
                          {mod.description && (
                            <p className="text-xs text-zinc-500 mb-3 pt-2">{mod.description}</p>
                          )}
                          {modSlides.map((slide, sIdx) => (
                            <div
                              key={slide.id || sIdx}
                              className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs"
                            >
                              <div className="flex items-center space-x-3">
                                <PlayCircle className="w-4 h-4 text-sky-500 shrink-0" />
                                <span className="font-medium">
                                  {sIdx + 1}. {slide.title}
                                </span>
                              </div>
                              <span className="text-zinc-400 text-[11px]">Lesson {sIdx + 1}</span>
                            </div>
                          ))}

                          {mod.has_quiz && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                              <div className="flex items-center space-x-3">
                                <HelpCircle className="w-4 h-4" />
                                <span>{mod.title} Assessment Quiz</span>
                              </div>
                              <span>Pass score: {mod.quiz?.passing_score_percent || 80}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Verified Certificate Preview Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight">Official Certification</h2>
              <div
                className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 ${
                  isLight ? 'bg-amber-50/30 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'
                }`}
              >
                <div className="space-y-2 max-w-md">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    <Award className="w-4 h-4" />
                    <span>Cryptographically Verified</span>
                  </div>
                  <h3 className="text-xl font-black">Telecom Guruji Certificate of Mastery</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Earn an authentic, shareable certificate backed by verified examination hash to showcase your telecommunication credentials on LinkedIn and resumes.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-black border-2 border-amber-500/40 text-center shadow-lg shrink-0 w-56">
                  <Award className="w-10 h-10 mx-auto text-amber-500 mb-2" />
                  <div className="font-serif font-black text-xs">CERTIFIED TELECOM SPECIALIST</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-1">ID: TG-2026-X</div>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 5. RATINGS & REVIEWS SECTION                                   */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="space-y-6" id="reviews">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-6 h-6" />
                    Student Reviews
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    {reviews.length > 0
                      ? `${reviews.length} verified review${reviews.length !== 1 ? 's' : ''} from enrolled students`
                      : 'Be the first to review this course'}
                  </p>
                </div>

                {/* Write / Edit Review CTA */}
                {isEnrolled && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 transition active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {myReview ? 'Edit Review' : 'Write a Review'}
                  </button>
                )}
              </div>

              {/* Rating Overview Panel */}
              {reviews.length > 0 && (
                <div className={`p-6 rounded-3xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                    {/* Big average score */}
                    <div className="text-center shrink-0">
                      <div className="text-6xl font-black font-mono text-black dark:text-white leading-none">
                        {avgRating.toFixed(1)}
                      </div>
                      <StarDisplay rating={Math.round(avgRating)} size="md" />
                      <div className="text-xs text-zinc-500 mt-2 font-medium">
                        Course Rating
                      </div>
                    </div>

                    {/* Distribution bars */}
                    <div className="flex-1 w-full space-y-2">
                      {ratingCounts.map(({ star, count }) => (
                        <RatingBar key={star} star={star} count={count} total={reviews.length} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Review Submission Form ── */}
              {showReviewForm && isEnrolled && (
                <div className={`p-6 rounded-3xl border space-y-5 animate-in fade-in slide-in-from-bottom-2 ${
                  isLight ? 'bg-white border-zinc-300 shadow-md' : 'bg-zinc-950 border-zinc-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-base">
                      {myReview ? 'Update Your Review' : 'Write Your Review'}
                    </h3>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Star Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                      Your Rating <span className="text-rose-500">*</span>
                    </label>
                    <StarPicker value={reviewRating} onChange={setReviewRating} />
                  </div>

                  {/* Review Title */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                      Review Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Summarize your experience in one line..."
                      maxLength={120}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 ring-black/20 dark:ring-white/20 transition ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400'
                          : 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600'
                      }`}
                    />
                  </div>

                  {/* Review Body */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                      Your Review <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      placeholder="Share what you liked, what could improve, and who this course is best for..."
                      rows={4}
                      maxLength={1000}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 ring-black/20 dark:ring-white/20 resize-none transition ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400'
                          : 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600'
                      }`}
                    />
                    <div className="text-right text-xs text-zinc-400 font-mono">{reviewBody.length}/1000</div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleSubmitReview}
                      disabled={submittingReview || reviewRating === 0}
                      className="flex-1 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingReview ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{myReview ? 'Update Review' : 'Submit Review'}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-3 rounded-xl border text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── Enroll CTA for non-enrolled (to leave review) ── */}
              {!isEnrolled && reviews.length === 0 && (
                <div className={`p-6 rounded-2xl border text-center space-y-3 ${
                  isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
                }`}>
                  <MessageSquare className="w-8 h-8 mx-auto text-zinc-400" />
                  <p className="text-sm text-zinc-500 font-medium">No reviews yet. Enroll to be the first to share your feedback!</p>
                </div>
              )}

              {!isEnrolled && reviews.length > 0 && (
                <div className={`p-4 rounded-2xl border text-xs text-zinc-500 flex items-center gap-3 ${
                  isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
                }`}>
                  <Lock className="w-4 h-4 shrink-0 text-zinc-400" />
                  <span>Only enrolled students can write a review. <button onClick={() => setShowEnrollModal(true)} className="font-bold text-black dark:text-white underline underline-offset-2">Enroll now</button> to share your feedback.</span>
                </div>
              )}

              {/* ── Review Cards List ── */}
              {reviewsLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`h-32 rounded-2xl animate-pulse ${isLight ? 'bg-zinc-100' : 'bg-zinc-900'}`} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const isOwn = user && (review.student_id === user.id || review.student_email === user.email);
                    return (
                      <div
                        key={review.id}
                        className={`p-5 rounded-2xl border space-y-3 transition ${
                          isOwn
                            ? isLight ? 'bg-sky-50/60 border-sky-200' : 'bg-sky-950/20 border-sky-800/40'
                            : isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
                        }`}
                      >
                        {/* Review Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                              {review.student_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{review.student_name}</span>
                                {isOwn && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/10 text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                                    You
                                  </span>
                                )}
                                {review.is_verified_purchase && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    Verified
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <StarDisplay rating={review.rating} size="xs" />
                                <span className="text-[11px] text-zinc-400 font-mono">
                                  {formatReviewDate(review.updated_at || review.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Edit own review */}
                          {isOwn && (
                            <button
                              onClick={() => setShowReviewForm(true)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white transition shrink-0"
                              title="Edit your review"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Review Title */}
                        {review.title && (
                          <p className="font-bold text-sm">{review.title}</p>
                        )}

                        {/* Review Body */}
                        {review.body && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {review.body}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* ═══ END REVIEWS SECTION ═══ */}

          </div>

          {/* Right Sidebar Enrollment Card (4 cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <div
              className={`p-6 rounded-3xl border shadow-xl space-y-6 ${
                isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase text-zinc-400">Tuition Fee</span>
                <div className="text-3xl sm:text-4xl font-black font-mono mt-1">
                  {course.price && course.price > 0 ? (
                    <span>{getCurrencySymbol(course.currency || 'INR')} {course.price}</span>
                  ) : (
                    <span className="text-emerald-500">FREE</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-1">One-time payment • Lifetime access to all modules</p>
              </div>

              {isEnrolled ? (
                <div className="space-y-2.5">
                  <Link
                    href={`/learn/${course.id}/m1-l1`}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Continue Course →</span>
                  </Link>

                  {/* Review CTA in sidebar for enrolled */}
                  <button
                    onClick={() => {
                      setShowReviewForm(true);
                      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      isLight ? 'border-zinc-200 text-zinc-700' : 'border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{myReview ? 'Edit Your Review' : 'Rate this Course'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUnenrollModal(true)}
                    className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold text-xs transition flex items-center justify-center space-x-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Unenroll from Course</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowEnrollModal(true)}
                  className="w-full py-4 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-xl hover:opacity-90 transition"
                  style={{ backgroundColor: template.primaryColor || '#0284c7' }}
                >
                  Enroll Now • Instant Access
                </button>
              )}

              {/* Live rating in sidebar */}
              {reviews.length > 0 && (
                <div className={`p-3 rounded-xl border flex items-center gap-3 ${isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/10 border-amber-800/30'}`}>
                  <div className="text-center">
                    <div className="text-xl font-black font-mono text-amber-500">{avgRating.toFixed(1)}</div>
                    <StarDisplay rating={Math.round(avgRating)} size="xs" />
                  </div>
                  <div className="text-xs text-zinc-500">
                    <span className="font-bold text-black dark:text-white">{reviews.length} student review{reviews.length !== 1 ? 's' : ''}</span>
                    <br />Course rating
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <div className="font-bold">This masterclass includes:</div>
                <div className="flex items-center space-x-2 text-zinc-500">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{modules.length} In-depth Telecom Modules</span>
                </div>
                <div className="flex items-center space-x-2 text-zinc-500">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{totalLessons} High-definition Slide Decks & Labs</span>
                </div>
                <div className="flex items-center space-x-2 text-zinc-500">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Module Quizzes & Final Assessment</span>
                </div>
                <div className="flex items-center space-x-2 text-zinc-500">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Official Verified Certificate</span>
                </div>
                <div className="flex items-center space-x-2 text-zinc-500">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Full mobile & desktop responsive player</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
