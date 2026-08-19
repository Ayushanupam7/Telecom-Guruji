'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Shield, GraduationCap, School, Code, LogOut, CheckCircle2, Trash2, AlertTriangle, X, Sun, Moon, Sparkles, KeyRound, Globe, Calendar, Mail, Check, Edit3, Image as ImageIcon, Save, UploadCloud, Camera, BookOpen, Award, PlayCircle, Code2, ShieldCheck, UserCheck, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { supabaseAdmin } from '@/lib/supabase';
import { CourseThumbnail } from '@/components/CourseThumbnail';
import { formatCoursePrice } from '@/lib/currency';

export default function ProfilePage() {
  const { user, logout, deleteAccount, resetPassword, updateUserProfile } = useAuth();
  const { theme, setThemePreference } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  // Hidden File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enrolled Courses Rows State
  const [enrolledRows, setEnrolledRows] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  // STRICT AUTHENTICATION GUARD: WITHOUT SIGNIN OR SIGNUP, REDIRECT TO AUTH
  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  // Profile Edit Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editAge, setEditAge] = useState<number>(21);
  const [editLanguage, setEditLanguage] = useState('en');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync state & fetch enrolled courses from Supabase when user changes
  useEffect(() => {
    if (user) {
      setEditFullName(user.fullName || '');
      setEditAge(user.age || 21);
      setEditLanguage(user.language || 'en');
      setEditAvatarUrl(user.avatarUrl || '');

      const fetchProfileEnrollments = async () => {
        try {
          const userId = user.id;
          const userEmail = user.email || '';
          const { data: dbEnrollments } = await supabaseAdmin
            .from('enrollments')
            .select('*')
            .or(`student_id.eq.${userId},student_email.eq.${userEmail}`);

          if (dbEnrollments && dbEnrollments.length > 0) {
            const courseIds = dbEnrollments.map((e) => e.course_id);
            const { data: dbCourses } = await supabaseAdmin
              .from('courses')
              .select('*')
              .or(`id.in.(${courseIds.map(id => `"${id}"`).join(',')}),slug.in.(${courseIds.map(id => `"${id}"`).join(',')})`);

            const coursesMap = new Map((dbCourses || []).map((c) => [c.id, c]));

            const { data: dbProgress } = await supabaseAdmin
              .from('progress')
              .select('*')
              .or(`student_id.eq.${userId},student_email.eq.${userEmail}`);

            const { data: dbQuizzes } = await supabaseAdmin
              .from('quiz_attempts')
              .select('*')
              .or(`student_id.eq.${userId},student_email.eq.${userEmail}`)
              .eq('is_passed', true);

            const rows = dbEnrollments.map((enr) => {
              const course = coursesMap.get(enr.course_id);
              const rawProg = Number(enr.progress_percent) || 0;
              const lastMod = Number(enr.last_module_index) || 0;
              const lastSlide = Number(enr.last_slide_index) || 0;
              const posProg = Math.min(99, Math.round(((lastMod * 2 + lastSlide + 1) / 10) * 100));

              const slidesDone = (dbProgress || []).filter((p) => (p.course_id === enr.course_id || p.course_id === course?.id) && p.completed === true).length;
              const quizzesDone = (dbQuizzes || []).filter((q) => q.course_id === enr.course_id || q.course_id === course?.id).length;
              const blendedProg = Math.round((Math.min(100, (slidesDone / 10) * 100) + Math.min(100, (quizzesDone / 4) * 100)) / 2);

              const isCompleted = enr.status === 'completed' || rawProg >= 100;
              const finalPercent = isCompleted ? 100 : Math.max(rawProg, posProg, blendedProg);

              return {
                ...enr,
                course_title: course?.title || enr.course_title || 'Verified Course',
                category: course?.category || 'Computer Science',
                price: Number(course?.price ?? enr.amount_paid ?? 0),
                currency: course?.currency || 'INR',
                thumbnail_url: course?.thumbnail_url || null,
                thumbnail_type: course?.thumbnail_type || 'image',
                progress_percent: finalPercent,
                last_lesson_id: enr.last_lesson_id || 'm1-l1',
              };
            });
            setEnrolledRows(rows);
          } else {
            setEnrolledRows([]);
          }
        } catch (err) {
          console.log('Profile enrollments fetch note:', err);
        } finally {
          setLoadingEnrollments(false);
        }
      };

      fetchProfileEnrollments();
    }
  }, [user]);

  // Account Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Password Reset State
  const [sendingReset, setSendingReset] = useState(false);

  const isLight = theme === 'light';

  if (!user) {
    return null;
  }

  const initials = user.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast({
          type: 'error',
          title: 'File Too Large',
          message: 'Image size must be under 5MB.',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditAvatarUrl(result);
        showToast({
          type: 'info',
          title: 'Photo Uploaded! 📸',
          message: 'Click "Save Profile & Sync DB" to persist to Supabase.',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      await updateUserProfile({
        fullName: editFullName,
        age: editAge,
        language: editLanguage,
        avatarUrl: editAvatarUrl,
      });

      showToast({
        type: 'success',
        title: 'Profile Updated! 🎉',
        message: 'Personal info and avatar saved directly to Supabase Database!',
      });
      setIsEditing(false);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Update Error',
        message: err?.message || 'Error updating profile in Supabase.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccountConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.toUpperCase() !== 'DELETE') return;

    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      alert('Error deleting account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectTheme = (targetTheme: 'light' | 'dark') => {
    setThemePreference(targetTheme);
    showToast({
      type: 'success',
      title: 'Theme Preference Saved ✓',
      message: `${targetTheme.toUpperCase()} mode saved & synced to your Supabase User Profile!`,
    });
  };

  const handleTriggerPasswordReset = async () => {
    setSendingReset(true);
    try {
      await resetPassword(user.email);
      showToast({
        type: 'success',
        title: 'Password Reset Email Sent! 📩',
        message: `Password reset instructions sent to ${user.email}. Check your inbox.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Reset Error',
        message: err?.message || 'Error triggering password reset.',
      });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 font-sans pb-12">
      
      {/* HERO AVATAR BANNER */}
      <div className={`p-5 sm:p-8 rounded-3xl border transition-all duration-300 ${
        isLight
          ? 'bg-white border-slate-200/80 shadow-xl shadow-slate-200/60 text-slate-900'
          : 'glass-panel border-slate-800 bg-slate-900/80 shadow-2xl text-white'
      }`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          
          {/* Avatar Circle with Glow or Custom Uploaded Image */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-1 shadow-xl shadow-sky-500/20 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full rounded-full object-cover shadow-inner"
                />
              ) : (
                <div className={`w-full h-full rounded-full flex items-center justify-center font-black text-2xl ${
                  isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                }`}>
                  {initials}
                </div>
              )}
            </div>

            {/* Quick Upload Trigger Badge */}
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              title="Upload Avatar Image"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {user.fullName}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{user.email}</p>
              </div>

              {/* Role Capsule Badge */}
              <span className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono uppercase font-bold self-center sm:self-start shadow-sm ${
                user.role === 'admin'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : user.role === 'instructor'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                  : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30'
              }`}>
                {user.role === 'admin' ? <Code className="w-3.5 h-3.5" /> : user.role === 'instructor' ? <School className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                <span>{user.role} Account</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs pt-1">
              <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Supabase DB Synced</span>
              </span>
              {user.provider === 'google' && (
                <span className="inline-flex items-center space-x-1 text-sky-600 dark:text-sky-400 font-semibold bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                  <span>Gmail OAuth Fetched</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 📚 ENROLLED COURSES & ACTIVE CREDENTIALS ROW TABLE */}
      <div className={`p-4 sm:p-7 rounded-3xl border space-y-5 transition-all duration-300 ${
        isLight
          ? 'bg-white border-zinc-300 shadow-xl text-black'
          : 'bg-zinc-950 border-zinc-700 shadow-2xl text-white'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Enrolled Courses & Active Credentials
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Real-time course progression & certificate statuses fetched live from Supabase Database.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full border bg-black text-white dark:bg-white dark:text-black border-zinc-800 dark:border-zinc-200 self-start sm:self-auto shrink-0">
            {enrolledRows.length} Enrolled Rows
          </span>
        </div>

        {loadingEnrollments ? (
          <div className="p-8 text-center text-xs font-mono font-bold text-zinc-500">
            Fetching enrolled courses from Supabase Database...
          </div>
        ) : enrolledRows.length === 0 ? (
          <div className="p-8 text-center space-y-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <GraduationCap className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-bold text-zinc-500">
              No active course enrollments found on your user profile.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-black text-xs shadow-md"
            >
              <span>Explore Course Catalog →</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 font-mono">
            {enrolledRows.map((row) => (
              <div
                key={row.id}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-200 hover:border-black'
                    : 'bg-zinc-900/70 border-zinc-800 hover:border-white'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <CourseThumbnail
                    thumbnailUrl={row.thumbnail_url}
                    thumbnailType={row.thumbnail_type}
                    category={row.category}
                    title={row.course_title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shrink-0 shadow-xs border border-zinc-300 dark:border-zinc-700"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black text-white dark:bg-white dark:text-black">
                        {row.category}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">
                        {row.amount_paid > 0 ? `PAID (${formatCoursePrice(row.amount_paid, row.currency)})` : 'FREE ACCESS'}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-black dark:text-white line-clamp-1">
                      {row.course_title}
                    </h3>

                    <div className="flex items-center space-x-3 text-[11px] text-zinc-500">
                      <span>Status: <strong className="text-black dark:text-white uppercase">{row.status || 'active'}</strong></span>
                      <span>•</span>
                      <span>Last Lesson: <strong className="text-black dark:text-white">{row.last_lesson_id || 'm1-l1'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* RIGHT ACTION & PROGRESS MASTERY METER COLUMN */}
                <div className="shrink-0 space-y-2 text-left sm:text-right w-full sm:w-56">
                  <div className="flex items-center justify-between text-xs font-mono font-black">
                    <span className="text-zinc-500 uppercase text-[10px] tracking-wider">Mastery Meter</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      row.progress_percent >= 100
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : row.progress_percent > 0
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {row.progress_percent >= 100 ? '🟢 100% PASSED' : row.progress_percent > 0 ? `🟡 ${row.progress_percent}% IN PROGRESS` : '⚪ 0% NOT STARTED'}
                    </span>
                  </div>

                  {/* VISUAL PROGRESS METER BAR */}
                  <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden p-0.5 border border-zinc-300 dark:border-zinc-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        row.progress_percent >= 100
                          ? 'bg-emerald-500'
                          : row.progress_percent > 0
                          ? 'bg-black dark:bg-white'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${row.progress_percent}%` }}
                    />
                  </div>

                  <div className="pt-1 flex items-center justify-start sm:justify-end space-x-2 font-mono">
                    {row.progress_percent >= 100 ? (
                      <Link
                        href={`/certificate/${row.course_id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-black text-xs shadow-md flex items-center space-x-1 hover:scale-105 transition-transform"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Claim Certificate 🎓</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/learn/${row.course_id}/${row.last_lesson_id || 'm1-l1'}`}
                        className="px-3.5 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-black text-xs shadow-md flex items-center space-x-1 hover:scale-105 transition-transform"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Continue Course →</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TWO COLUMN SETTINGS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: PERSONAL INFORMATION & EDIT FORM */}
        <div className={`p-5 sm:p-7 rounded-3xl border space-y-5 transition-all duration-300 ${
          isLight ? 'bg-white border-slate-200/80 shadow-lg text-slate-900' : 'glass-panel border-slate-800 bg-slate-900/60 text-white shadow-xl'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 border border-sky-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Personal Information
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Edit credentials & upload avatar</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1 ${
                isEditing
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5 text-sky-500" />}
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>

          {/* Hidden Device File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleManualImageUpload}
            className="hidden"
          />

          {isEditing ? (
            <form onSubmit={handleSaveProfileSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-500 dark:text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-medium focus:outline-none transition-colors border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1 text-slate-500 dark:text-slate-400">
                    Age
                  </label>
                  <input
                    type="number"
                    required
                    value={editAge}
                    onChange={(e) => setEditAge(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl text-xs font-medium focus:outline-none transition-colors border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1 text-slate-500 dark:text-slate-400">
                    Language
                  </label>
                  <select
                    value={editLanguage}
                    onChange={(e) => setEditLanguage(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-medium focus:outline-none transition-colors border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    <option value="en">English (US)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                  </select>
                </div>
              </div>

              {/* MANUAL AVATAR UPLOAD SECTION */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Profile Avatar Image
                </label>

                {/* Device Upload Trigger Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-3 rounded-2xl border border-dashed flex items-center justify-center space-x-2 transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-sky-500'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-sky-500'
                  }`}
                >
                  <UploadCloud className="w-4 h-4 text-sky-500" />
                  <span className="font-bold">Upload Photo from Device</span>
                  <span className="text-[10px] text-slate-400 font-mono">(PNG/JPG/WEBP)</span>
                </button>

                {/* Or Paste Direct Image URL */}
                <div className="relative pt-1">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="Or paste image URL (https://...)"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-colors border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Saving to Supabase...' : 'Save Profile & Sync DB'}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-3.5 text-xs font-sans">
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
              }`}>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Full Name</span>
                  <p className={`font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.fullName}</p>
                </div>
                <User className="w-4 h-4 text-slate-400" />
              </div>

              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
              }`}>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Email Address</span>
                  <p className={`font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.email}</p>
                </div>
                <Mail className="w-4 h-4 text-slate-400" />
              </div>

              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
              }`}>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Account Age</span>
                  <p className={`font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.age || 21} Years Old</p>
                </div>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>

              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
              }`}>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Avatar Image</span>
                  <p className={`font-extrabold truncate max-w-[200px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {user.avatarUrl ? (user.avatarUrl.startsWith('data:') ? 'Uploaded Device Photo ✓' : user.avatarUrl) : 'Default Initials Badge'}
                  </p>
                </div>
                <ImageIcon className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          )}
        </div>

        {/* CARD 2: THEME & APPEARANCE STUDIO (SYNCED TO SUPABASE) */}
        <div className={`p-5 sm:p-7 rounded-3xl border space-y-5 transition-all duration-300 ${
          isLight ? 'bg-white border-slate-200/80 shadow-lg text-slate-900' : 'glass-panel border-slate-800 bg-slate-900/60 text-white shadow-xl'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Theme & Appearance Studio
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Synced to Supabase Database</p>
            </div>
          </div>

          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Select your workspace theme mode. Your choice is automatically saved to your Supabase profile record and synced across all your devices.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => handleSelectTheme('light')}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 relative ${
                theme === 'light'
                  ? 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400 shadow-md ring-2 ring-sky-500/30'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
              }`}
            >
              {theme === 'light' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
              )}
              <Sun className="w-5 h-5 text-amber-500 mb-2" />
              <h3 className="text-xs font-black">Light Mode</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Crisp, high-contrast</p>
            </button>

            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => handleSelectTheme('dark')}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 relative ${
                theme === 'dark'
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-md ring-2 ring-indigo-500/30'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
              }`}
            >
              {theme === 'dark' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
              )}
              <Moon className="w-5 h-5 text-indigo-400 mb-2" />
              <h3 className="text-xs font-black">Dark Mode</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Deep slate workspace</p>
            </button>
          </div>
        </div>
      </div>

      {/* CARD 3: SECURITY & PASSWORD MANAGEMENT */}
      <div className={`p-5 sm:p-7 rounded-3xl border space-y-4 transition-all duration-300 ${
        isLight ? 'bg-white border-slate-200/80 shadow-lg text-slate-900' : 'glass-panel border-slate-800 bg-slate-900/60 text-white shadow-xl'
      }`}>
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Account Security & Password
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Manage credentials & session security</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Reset Password Link
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Triggers a secure password reset link to <span className="font-mono text-sky-500">{user.email}</span>.
            </p>
          </div>

          <button
            type="button"
            disabled={sendingReset}
            onClick={handleTriggerPasswordReset}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center space-x-1.5 shrink-0"
          >
            <KeyRound className="w-4 h-4" />
            <span>{sendingReset ? 'Sending Email...' : 'Send Password Reset Email'}</span>
          </button>
        </div>
      </div>

      {/* 🖤 ABOUT SIGNALHUB, DEVELOPER AYUSH ANUPAM & SOFTWARE LICENSE CARD (COLLAPSED ON MOBILE BY DEFAULT) 🤍 */}
      <div className={`p-5 sm:p-8 rounded-3xl border-2 transition-all ${
        isLight
          ? 'bg-white border-zinc-300 shadow-md text-black'
          : 'bg-zinc-950 border-zinc-800 text-white shadow-xl'
      }`}>
        <button
          type="button"
          onClick={() => setIsAboutExpanded((prev) => !prev)}
          className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left cursor-pointer focus:outline-none"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold shadow-md shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight uppercase">About Telecom Guruji & Platform Credits</h2>
              <p className="text-xs text-zinc-500 font-mono">Production-Grade AI EdTech & Verification Infrastructure</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <span className="px-3 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black font-mono text-[10px] font-black uppercase tracking-wider border border-zinc-800 dark:border-zinc-200">
              v2.4.0 (Stable)
            </span>
            <div className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white flex items-center justify-center">
              {isAboutExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {/* EXPANDED CONTENT (COLLAPSED BY DEFAULT ON MOBILE, EXPANDS ON TAP) */}
        <div className={`mt-6 space-y-6 pt-5 border-t border-zinc-200 dark:border-zinc-800 ${
          isAboutExpanded ? 'block' : 'hidden sm:block'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* FOUNDER CREDIT CARD */}
            <div className={`p-4 rounded-2xl border space-y-2 font-sans ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>Founder & Chief Educator</span>
              </div>
              <h3 className="text-base font-black text-black dark:text-white tracking-tight">Gaurav Kr. Sinha</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Pioneering 5G/6G architecture, IP protocols, and hands-on telecommunications education across India.
              </p>
              <div className="pt-1">
                <Link href="/about" className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center space-x-1">
                  <span>View Founder Story →</span>
                </Link>
              </div>
            </div>

            {/* DEVELOPER CREDIT CARD */}
            <div className={`p-4 rounded-2xl border space-y-2 font-sans ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-500 uppercase">
                <UserCheck className="w-4 h-4 text-black dark:text-white" />
                <span>Lead Architect & Developer</span>
              </div>
              <h3 className="text-base font-black text-black dark:text-white tracking-tight">Ayush Anupam</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Engineered Telecom Guruji’s engagement verification engine, microservices, and Supabase cloud database architecture.
              </p>
            </div>

            {/* OFFICIAL LICENSE & COMPLIANCE */}
            <div className={`p-4 rounded-2xl border space-y-2 font-sans ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-500 uppercase">
                <Code2 className="w-4 h-4 text-black dark:text-white" />
                <span>Software License</span>
              </div>
              <h3 className="text-base font-black text-black dark:text-white tracking-tight">MIT License</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Copyright © 2026 Gaurav Kr. Sinha & Ayush Anupam. Open source verification & educational use.
              </p>
            </div>
          </div>

          {/* FULL MIT LICENSE DETAILS EXPANDABLE SUMMARY */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-[11px] font-mono leading-relaxed space-y-2">
            <div className="flex items-center justify-between font-bold text-black dark:text-white uppercase text-[10px]">
              <span>MIT Software License Legal Summary</span>
              <FileText className="w-3.5 h-3.5" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
            </p>
          </div>
        </div>
      </div>

      {/* CARD 4: SESSION MANAGEMENT & DANGER ZONE */}
      <div className={`p-5 sm:p-7 rounded-3xl border space-y-4 transition-all duration-300 ${
        isLight ? 'bg-white border-slate-200/80 shadow-lg text-slate-900' : 'glass-panel border-slate-800 bg-slate-900/60 text-white shadow-xl'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Session & Account Actions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sign out or manage permanent account deletion.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:space-x-3 w-full sm:w-auto justify-start sm:justify-end">
            <button
              onClick={logout}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center space-x-2 shadow-md transition-all flex-1 sm:flex-initial justify-center"
            >
              <LogOut className="w-4 h-4 text-sky-400" />
              <span>Sign Out</span>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              type="button"
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500/20 font-bold text-xs flex items-center space-x-1.5 transition-all flex-1 sm:flex-initial justify-center"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACCOUNT DELETION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className={`max-w-md w-full p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-rose-500">Delete Account Permanently</h2>
                <p className="text-xs text-slate-400">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              This will permanently delete your profile record, enrollments, and progress from Supabase Cloud Database.
            </p>

            <form onSubmit={handleDeleteAccountConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">
                  Type <span className="font-mono text-rose-500 font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className={`w-full p-3 rounded-xl text-xs font-mono font-bold focus:outline-none transition-colors border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className={`py-2.5 rounded-xl border text-xs font-bold ${
                    isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmText.toUpperCase() !== 'DELETE' || isDeleting}
                  className="py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <span>{isDeleting ? 'Deleting...' : 'Permanently Delete'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
