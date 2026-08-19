'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  Users,
  BookOpen,
  Award,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  Briefcase,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { supabaseAdmin } from '@/lib/supabase';
import { PageLoader } from '@/components/PageLoader';
import { getCurrencySymbol } from '@/lib/currency';

interface InstructorProfile {
  id: string;
  email: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  role: string;
  bio?: string;
  title?: string;
  specialization?: string;
  experience_years?: number;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  location?: string;
  total_students?: number;
  total_courses?: number;
}

interface Course {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  level?: string;
  price?: number;
  currency?: string;
  thumbnail_url?: string;
  is_published: boolean;
  modules_count?: number;
  course_duration?: number;
}

export default function PublicInstructorProfilePage({ params }: { params?: { id?: string } }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [loading, setLoading] = useState(true);
  const [instructor, setInstructor] = useState<InstructorProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (!params?.id) return;
    loadProfile(params.id);
  }, [params?.id]);

  const loadProfile = async (id: string) => {
    try {
      setLoading(true);

      // 1. Fetch instructor profile — try by id first, then by username
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .or(`id.eq.${id},username.eq.${id}`)
        .eq('role', 'instructor')
        .limit(1);

      const profile = profileData?.[0] || null;
      setInstructor(profile);

      if (!profile) return;

      // 2. Fetch published courses by this instructor
      const { data: courseData } = await supabaseAdmin
        .from('courses')
        .select('id, title, summary, category, level, price, currency, thumbnail_url, is_published, modules_count, course_duration')
        .eq('instructor_id', profile.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      setCourses(courseData || []);

      // 3. Fetch reviews for all instructor courses to compute avg rating
      if (courseData && courseData.length > 0) {
        const courseIds = courseData.map((c) => c.id);
        const { data: reviewData } = await supabaseAdmin
          .from('course_reviews')
          .select('rating')
          .in('course_id', courseIds);

        const reviews = reviewData || [];
        setTotalReviews(reviews.length);
        if (reviews.length > 0) {
          const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
          setAvgRating(Math.round(avg * 10) / 10);
        }
      }
    } catch (err) {
      console.error('Error loading instructor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!instructor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center space-y-4">
          <div className="text-5xl">👤</div>
          <h1 className="text-2xl font-black">Instructor Not Found</h1>
          <p className="text-zinc-500 text-sm">This instructor profile doesn't exist or is not public.</p>
          <Link href="/courses" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition">
            <ArrowLeft className="w-4 h-4" />
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  const initials = instructor.full_name
    .split(' ')
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white pb-20">
      {/* ── Hero Banner ── */}
      <div className={`border-b ${isLight ? 'bg-gradient-to-br from-white via-zinc-50 to-zinc-100 border-zinc-200' : 'bg-gradient-to-br from-zinc-950 via-black to-zinc-950 border-zinc-800'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Courses
          </Link>

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="shrink-0">
              {instructor.avatar_url ? (
                <img
                  src={instructor.avatar_url}
                  alt={instructor.full_name}
                  className="w-28 h-28 rounded-3xl object-cover border-4 border-white dark:border-zinc-800 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-xl border-4 border-white dark:border-zinc-800">
                  {initials}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-1">
                  {instructor.title || 'Course Instructor'}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{instructor.full_name}</h1>
                {instructor.specialization && (
                  <p className="text-base text-zinc-500 dark:text-zinc-400 mt-1 font-medium">{instructor.specialization}</p>
                )}
              </div>

              {/* Location + Experience */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                {instructor.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {instructor.location}
                  </span>
                )}
                {instructor.experience_years && instructor.experience_years > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    {instructor.experience_years}+ years experience
                  </span>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 pt-2">
                {avgRating > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-bold">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    {avgRating} Avg Rating
                  </div>
                )}
                {totalReviews > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-200/60 dark:bg-zinc-800 text-sm font-bold">
                    <Award className="w-4 h-4" />
                    {totalReviews} Reviews
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-200/60 dark:bg-zinc-800 text-sm font-bold">
                  <BookOpen className="w-4 h-4" />
                  {courses.length} Published Course{courses.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3 pt-1">
                {instructor.linkedin_url && (
                  <a
                    href={instructor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-sky-600" />
                    LinkedIn
                  </a>
                )}
                {instructor.twitter_url && (
                  <a
                    href={instructor.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <Twitter className="w-3.5 h-3.5 text-sky-400" />
                    Twitter / X
                  </a>
                )}
                {instructor.website_url && (
                  <a
                    href={instructor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* About / Bio */}
        {instructor.bio && (
          <section className="space-y-4">
            <h2 className="text-xl font-black tracking-tight">About {instructor.full_name}</h2>
            <div className={`p-6 rounded-3xl border text-sm leading-relaxed whitespace-pre-line ${isLight ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-950 border-zinc-800 text-zinc-300'}`}>
              {instructor.bio}
            </div>
          </section>
        )}

        {/* Courses by this instructor */}
        <section className="space-y-5">
          <h2 className="text-xl font-black tracking-tight">
            Courses by {instructor.full_name}
          </h2>

          {courses.length === 0 ? (
            <div className={`p-10 rounded-3xl border text-center text-zinc-500 text-sm ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
              No published courses yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className={`group rounded-3xl border overflow-hidden flex flex-col transition shadow-sm hover:shadow-md ${isLight ? 'bg-white border-zinc-200 hover:border-zinc-300' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                    <img
                      src={course.thumbnail_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur text-white text-xs font-mono font-bold">
                      {course.price && course.price > 0
                        ? `${getCurrencySymbol(course.currency || 'INR')} ${course.price}`
                        : 'FREE'}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                      {course.category || 'Telecom'}
                    </span>
                    <h3 className="font-black text-sm leading-snug line-clamp-2">{course.title}</h3>
                    {course.summary && (
                      <p className="text-xs text-zinc-500 line-clamp-2 flex-1">{course.summary}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {course.modules_count || 5} Modules
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.course_duration || 90}m
                      </span>
                      <span className="capitalize font-medium">{course.level || 'Intermediate'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
