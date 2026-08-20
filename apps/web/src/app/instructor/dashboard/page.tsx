'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLoader } from '@/components/PageLoader';
import {
  Plus,
  BookOpen,
  Users,
  Sparkles,
  BarChart2,
  DollarSign,
  Cpu,
  Settings,
  User,
  CheckCircle2,
  Eye,
  Trash2,
  Edit3,
  Globe,
  Tag,
  Search,
  Sliders,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  Star,
  Clock,
  RefreshCw,
  Award,
  AlertTriangle,
  FolderPlus,
  MessageSquare,
  ThumbsUp,
  Filter,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  CreditCard,
  QrCode,
  FileText,
  CheckCircle,
  Activity,
  TrendingDown,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrencySymbol, formatCoursePrice } from '@/lib/currency';
import { CourseThumbnail } from '@/components/CourseThumbnail';
import { AIProviderSettingsTab } from '@/components/instructor/AIProviderSettingsTab';
import { CreationMethodModal } from '@/components/course-builder/CreationMethodModal';
import { CourseCreationMethod, Course } from '@signalhub/types';
import { INITIAL_DEMO_COURSE } from '@/lib/mockData';

type DashboardTab = 'dashboard' | 'courses' | 'analytics' | 'students' | 'earnings' | 'reviews' | 'ai_providers' | 'settings' | 'profile';

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

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCTOR PROFILE TAB — Standalone component to manage its own form state
// ─────────────────────────────────────────────────────────────────────────────
function InstructorProfileTab({
  user,
  isLight,
  showToast,
}: {
  user: any;
  isLight: boolean;
  showToast: (opts: any) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: user?.fullName || '',
    email: user?.email || '',
    title: '',
    specialization: '',
    bio: '',
    experience_years: '',
    location: '',
    linkedin_url: '',
    twitter_url: '',
    website_url: '',
    avatar_url: '',
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id || loaded) return;
    supabaseAdmin
      .from('profiles')
      .select('full_name, email, title, specialization, bio, experience_years, location, linkedin_url, twitter_url, website_url, avatar_url')
      .eq('id', user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const p = data[0];
          setProfile({
            full_name: p.full_name || user?.fullName || '',
            email: p.email || user?.email || '',
            title: p.title || '',
            specialization: p.specialization || '',
            bio: p.bio || '',
            experience_years: p.experience_years ? String(p.experience_years) : '',
            location: p.location || '',
            linkedin_url: p.linkedin_url || '',
            twitter_url: p.twitter_url || '',
            website_url: p.website_url || '',
            avatar_url: p.avatar_url || '',
          });
        }
        setLoaded(true);
      });
  }, [user?.id, loaded]);

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: profile.full_name,
          title: profile.title || null,
          specialization: profile.specialization || null,
          bio: profile.bio || null,
          experience_years: profile.experience_years ? parseInt(profile.experience_years) : 0,
          location: profile.location || null,
          linkedin_url: profile.linkedin_url || null,
          twitter_url: profile.twitter_url || null,
          website_url: profile.website_url || null,
          avatar_url: profile.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      showToast({ type: 'success', title: 'Profile Saved! ✅', message: 'Your public instructor profile has been updated.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof typeof profile,
    type = 'text',
    placeholder = '',
    hint?: string,
    textarea?: boolean
  ) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">{label}</label>
      {textarea ? (
        <textarea
          rows={4}
          value={profile[key]}
          onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none outline-none focus:ring-2 ring-black/10 dark:ring-white/10 transition ${isLight ? 'bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400' : 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600'}`}
        />
      ) : (
        <input
          type={type}
          value={profile[key]}
          onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          disabled={key === 'email'}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ring-black/10 dark:ring-white/10 transition ${key === 'email' ? 'opacity-60 cursor-not-allowed' : ''} ${isLight ? 'bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400' : 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600'}`}
        />
      )}
      {hint && <p className="text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );

  const initials = profile.full_name.split(' ').map((n: string) => n.charAt(0)).slice(0, 2).join('').toUpperCase() || 'I';

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <User className="w-7 h-7" />
            Instructor Profile
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            This information appears on your <strong>public profile page</strong> and course detail pages.
          </p>
        </div>
        {user?.id && (
          <a
            href={`/instructor/${user.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold hover:opacity-80 transition ${isLight ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-900 border-zinc-700 text-zinc-300'}`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Public Profile ↗
          </a>
        )}
      </div>

      {/* Avatar Preview */}
      <div className={`p-5 rounded-2xl border flex items-center gap-5 ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
        <div className="shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-200 dark:border-zinc-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl">
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">Avatar URL</label>
          <input
            type="url"
            value={profile.avatar_url}
            onChange={(e) => setProfile((p) => ({ ...p, avatar_url: e.target.value }))}
            placeholder="https://your-photo-url.com/photo.jpg"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ring-black/10 dark:ring-white/10 transition ${isLight ? 'bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400' : 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600'}`}
          />
          <p className="text-[11px] text-zinc-400">Paste a direct link to your profile photo.</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className={`p-6 rounded-2xl border space-y-5 ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
        <h2 className="font-black text-sm uppercase tracking-wider text-zinc-400">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {field('Display Name', 'full_name', 'text', 'Dr. Ayush Sharma')}
          {field('Email Address', 'email', 'email', '')}
          {field('Professional Title', 'title', 'text', 'e.g. Lead Telecom Systems Architect', 'Shown below your name on the course page')}
          {field('Specialization', 'specialization', 'text', 'e.g. 5G NR, RF Engineering, Core Networks')}
          {field('Years of Experience', 'experience_years', 'number', '10')}
          {field('Location', 'location', 'text', 'e.g. Mumbai, India')}
        </div>
        {field('Bio / About Me', 'bio', 'text', 'Write a compelling instructor bio that students will read on your public profile page...', 'Supports plain text. Shown on your public profile.', true)}
      </div>

      {/* Social Links */}
      <div className={`p-6 rounded-2xl border space-y-5 ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
        <h2 className="font-black text-sm uppercase tracking-wider text-zinc-400">Social & Web Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {field('LinkedIn URL', 'linkedin_url', 'url', 'https://linkedin.com/in/yourprofile')}
          {field('Twitter / X URL', 'twitter_url', 'url', 'https://twitter.com/yourhandle')}
          {field('Website / Blog URL', 'website_url', 'url', 'https://yourwebsite.com')}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider hover:opacity-90 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></>
          ) : (
            <><CheckCircle2 className="w-3.5 h-3.5" /><span>Save Profile</span></>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCTOR SETTINGS TAB — Studio preferences, notifications, payouts & defaults
// ─────────────────────────────────────────────────────────────────────────────
function InstructorSettingsTab({
  user,
  isLight,
  showToast,
}: {
  user: any;
  isLight: boolean;
  showToast: (opts: any) => void;
}) {
  const { theme, setThemePreference } = useTheme();
  const { resetPassword } = useAuth();
  const [saving, setSaving] = useState(false);
  const [resettingPass, setResettingPass] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    // Studio & General
    defaultCurrency: 'INR',
    language: 'en',
    timezone: 'Asia/Kolkata',
    // Teaching Defaults
    autoIssueCertificates: true,
    strictWatchVerification: true,
    quizPassingScore: 70,
    enableStudentDiscussions: true,
    // Notifications
    notifyOnEnrollment: true,
    notifyOnReview: true,
    notifyWeeklyDigest: true,
    notifyStudentMessages: true,
    // Payout details
    payoutMethod: 'upi',
    upiId: '',
    bankAccountName: user?.fullName || '',
    bankAccountNumber: '',
    bankIfscCode: '',
    payoutSchedule: 'monthly',
  });

  // Load saved settings directly from Supabase Database on mount
  useEffect(() => {
    if (!user?.id && !user?.email) return;

    async function loadSupabaseSettings() {
      try {
        let query = supabaseAdmin.from('profiles').select('*');
        if (user?.id) {
          query = query.eq('id', user.id);
        } else if (user?.email) {
          query = query.eq('email', user.email);
        }

        const { data, error } = await query.limit(1);
        if (error) {
          console.warn('Supabase settings fetch error:', error);
          return;
        }

        if (data && data.length > 0) {
          const p = data[0];
          const searchHistoryObj = p.search_history && typeof p.search_history === 'object' ? p.search_history : {};
          const savedSettings = searchHistoryObj.instructor_settings || {};

          setSettings((prev) => ({
            ...prev,
            language: p.preferred_language || prev.language,
            bankAccountName: p.full_name || prev.bankAccountName,
            ...savedSettings,
          }));
        }
      } catch (err) {
        console.warn('Could not load Supabase settings:', err);
      }
    }

    loadSupabaseSettings();
  }, [user?.id, user?.email]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const targetId = user?.id;
      const targetEmail = user?.email || 'instructor@signalhub.app';

      // 1. Fetch latest profile to preserve existing search history/notebooks
      let query = supabaseAdmin.from('profiles').select('id, search_history');
      if (targetId) {
        query = query.eq('id', targetId);
      } else {
        query = query.eq('email', targetEmail);
      }
      const { data: existingData } = await query.limit(1);

      const currentSearchHistory =
        existingData && existingData[0]?.search_history && typeof existingData[0].search_history === 'object'
          ? existingData[0].search_history
          : {};

      const updatedSearchHistory = {
        ...currentSearchHistory,
        instructor_settings: settings,
        last_synced_at: new Date().toISOString(),
      };

      // 2. Persist directly to Supabase profiles
      let updateQuery = supabaseAdmin.from('profiles').update({
        preferred_language: settings.language,
        search_history: updatedSearchHistory,
        updated_at: new Date().toISOString(),
      });

      if (targetId) {
        updateQuery = updateQuery.eq('id', targetId);
      } else {
        updateQuery = updateQuery.eq('email', targetEmail);
      }

      const { error: updateErr } = await updateQuery;
      if (updateErr) throw updateErr;

      showToast({
        type: 'success',
        title: 'Settings Synced with Supabase! ☁️',
        message: 'Your teaching preferences, notifications, and payout configuration are live in the database.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Failed to save settings to Supabase.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPasswordTrigger = async () => {
    if (!user?.email) return;
    try {
      setResettingPass(true);
      await resetPassword(user.email);
      showToast({
        type: 'success',
        title: 'Reset Link Sent ✉️',
        message: `A password reset link has been dispatched to ${user.email}.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Reset Failed',
        message: err.message || 'Could not send reset email.',
      });
    } finally {
      setResettingPass(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7" />
            Studio & Instructor Settings
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Configure studio preferences, default course currency, automated certificate rules, and payout information.
          </p>
        </div>
      </div>

      {/* 1. APPEARANCE & REGIONAL PREFERENCES */}
      <div className={`p-6 rounded-2xl border space-y-5 ${isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-zinc-950 border-zinc-800'}`}>
        <div className="flex items-center space-x-2.5">
          <Sun className="w-4 h-4 text-black dark:text-white" />
          <h2 className="font-black text-sm uppercase tracking-wider text-zinc-400">Studio & Appearance</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">Theme Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setThemePreference('light')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-black text-white border-black shadow-sm'
                    : isLight ? 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-black' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setThemePreference('dark')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white text-black border-white shadow-sm'
                    : isLight ? 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-black' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Default Currency */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">Default Course Currency</label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => setSettings((s) => ({ ...s, defaultCurrency: e.target.value }))}
              className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold outline-none transition cursor-pointer ${
                isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
              }`}
            >
              <option value="INR">INR (₹) — Indian Rupee</option>
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
            </select>
          </div>

          {/* Platform Language */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">Language</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings((s) => ({ ...s, language: e.target.value }))}
              className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold outline-none transition cursor-pointer ${
                isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
              }`}
            >
              <option value="en">English (US/UK)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
            </select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
              className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold outline-none transition cursor-pointer ${
                isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
              }`}
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="UTC">UTC (GMT +0:00)</option>
              <option value="America/New_York">America/New_York (EST -5:00)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST -8:00)</option>
              <option value="Europe/London">Europe/London (BST +1:00)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. TEACHING & VERIFICATION AUTOMATION */}
      <div className={`p-6 rounded-2xl border space-y-5 ${isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-zinc-950 border-zinc-800'}`}>
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
          <h2 className="font-black text-sm uppercase tracking-wider text-zinc-400">Course & Verification Rules</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'}`}>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-black dark:text-white">Auto-Issue Verified Certificates</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Generate verifiable certificate upon 100% course completion & final exam.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoIssueCertificates}
              onChange={(e) => setSettings((s) => ({ ...s, autoIssueCertificates: e.target.checked }))}
              className="w-5 h-5 rounded accent-black dark:accent-white cursor-pointer shrink-0"
            />
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'}`}>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-black dark:text-white">90% Video Watch Verification</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Enforce playback verification heartbeat to prevent students from skipping video.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.strictWatchVerification}
              onChange={(e) => setSettings((s) => ({ ...s, strictWatchVerification: e.target.checked }))}
              className="w-5 h-5 rounded accent-black dark:accent-white cursor-pointer shrink-0"
            />
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'}`}>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-black dark:text-white">Default Quiz Passing Score</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Minimum percentage required for students to unlock the next module.</p>
            </div>
            <select
              value={settings.quizPassingScore}
              onChange={(e) => setSettings((s) => ({ ...s, quizPassingScore: Number(e.target.value) }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-800 border-zinc-700 text-white'
              }`}
            >
              <option value="60">60% (Moderate)</option>
              <option value="70">70% (Recommended)</option>
              <option value="80">80% (Strict)</option>
              <option value="90">90% (Mastery)</option>
            </select>
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'}`}>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-black dark:text-white">Student Discussion Forums</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Allow enrolled students to post public Q&A questions under course slides.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableStudentDiscussions}
              onChange={(e) => setSettings((s) => ({ ...s, enableStudentDiscussions: e.target.checked }))}
              className="w-5 h-5 rounded accent-black dark:accent-white cursor-pointer shrink-0"
            />
          </div>
        </div>
      </div>

      {/* 3. NOTIFICATION PREFERENCES */}
      <div className={`p-6 rounded-2xl border space-y-5 ${isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-zinc-950 border-zinc-800'}`}>
        <div className="flex items-center space-x-2.5">
          <MessageSquare className="w-4 h-4 text-black dark:text-white" />
          <h2 className="font-black text-sm uppercase tracking-wider text-zinc-400">Email & Notification Alerts</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'}`}>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-black dark:text-white">New Course Enrollment Alerts</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Receive instant email whenever a student enrolls in one of your courses.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifyOnEnrollment}
              onChange={(e) => setSettings((s) => ({ ...s, notifyOnEnrollment: e.target.checked }))}
              className="w-5 h-5 rounded accent-black dark:accent-white cursor-pointer shrink-0"
            />
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'}`}>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-black dark:text-white">Student Reviews & Star Ratings</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Get notified when a student publishes feedback or rates your course.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifyOnReview}
              onChange={(e) => setSettings((s) => ({ ...s, notifyOnReview: e.target.checked }))}
              className="w-5 h-5 rounded accent-black dark:accent-white cursor-pointer shrink-0"
            />
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'}`}>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-black dark:text-white">Weekly Performance Digest</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Summary of weekly earnings, watch hours, and new student milestones.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifyWeeklyDigest}
              onChange={(e) => setSettings((s) => ({ ...s, notifyWeeklyDigest: e.target.checked }))}
              className="w-5 h-5 rounded accent-black dark:accent-white cursor-pointer shrink-0"
            />
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'}`}>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-black dark:text-white">Student Questions & Notes</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Alerts when students ask for clarification or submit assignments.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifyStudentMessages}
              onChange={(e) => setSettings((s) => ({ ...s, notifyStudentMessages: e.target.checked }))}
              className="w-5 h-5 rounded accent-black dark:accent-white cursor-pointer shrink-0"
            />
          </div>
        </div>
      </div>

      {/* 4. PAYOUT & FINANCIAL SETTLEMENT */}
      <div className={`p-6 rounded-2xl border space-y-5 ${isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-zinc-950 border-zinc-800'}`}>
        <div className="flex items-center space-x-2.5">
          <DollarSign className="w-4 h-4 text-black dark:text-white" />
          <h2 className="font-black text-sm uppercase tracking-wider text-zinc-400">Payout & Banking Settlement</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">Payout Method</label>
              <select
                value={settings.payoutMethod}
                onChange={(e) => setSettings((s) => ({ ...s, payoutMethod: e.target.value }))}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none transition cursor-pointer ${
                  isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                }`}
              >
                <option value="upi">UPI Instant Transfer (VPA)</option>
                <option value="bank">Bank Transfer (NEFT / IMPS / Wire)</option>
                <option value="stripe">Stripe Connect Account</option>
                <option value="paypal">PayPal Business</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">Payout Frequency</label>
              <select
                value={settings.payoutSchedule}
                onChange={(e) => setSettings((s) => ({ ...s, payoutSchedule: e.target.value }))}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none transition cursor-pointer ${
                  isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                }`}
              >
                <option value="monthly">Monthly (1st of every month)</option>
                <option value="biweekly">Bi-Weekly (1st and 15th)</option>
              </select>
            </div>
          </div>

          {settings.payoutMethod === 'upi' ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">UPI ID / Virtual Payment Address</label>
              <input
                type="text"
                value={settings.upiId}
                onChange={(e) => setSettings((s) => ({ ...s, upiId: e.target.value }))}
                placeholder="e.g. instructor@okhdfcbank or yourname@upi"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ring-black/10 dark:ring-white/10 transition ${
                  isLight ? 'bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400' : 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600'
                }`}
              />
              <p className="text-[11px] text-zinc-400">Direct instant payouts sent to your verified UPI handle.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">Account Holder Name</label>
                <input
                  type="text"
                  value={settings.bankAccountName}
                  onChange={(e) => setSettings((s) => ({ ...s, bankAccountName: e.target.value }))}
                  placeholder="Full Legal Name"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">Account Number</label>
                <input
                  type="text"
                  value={settings.bankAccountNumber}
                  onChange={(e) => setSettings((s) => ({ ...s, bankAccountNumber: e.target.value }))}
                  placeholder="e.g. 50100234567890"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">IFSC / SWIFT Code</label>
                <input
                  type="text"
                  value={settings.bankIfscCode}
                  onChange={(e) => setSettings((s) => ({ ...s, bankIfscCode: e.target.value }))}
                  placeholder="e.g. HDFC0001234"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. ACCOUNT SECURITY & CREDENTIALS */}
      <div className={`p-6 rounded-2xl border space-y-5 ${isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-zinc-950 border-zinc-800'}`}>
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
          <h2 className="font-black text-sm uppercase tracking-wider text-zinc-400">Account Security & Credentials</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-black dark:text-white">Account Email</h3>
            <p className="text-xs text-zinc-500 font-mono">{user?.email || 'instructor@signalhub.app'}</p>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 mt-1">
              Verified Instructor
            </span>
          </div>

          <div className="flex sm:justify-end">
            <button
              type="button"
              onClick={handleResetPasswordTrigger}
              disabled={resettingPass}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold hover:opacity-80 transition cursor-pointer flex items-center space-x-1.5 ${
                isLight ? 'bg-zinc-100 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
              }`}
            >
              {resettingPass ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Sending...</span></>
              ) : (
                <span>Request Password Reset Link ✉️</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-8 py-3.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider hover:opacity-90 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md cursor-pointer"
        >
          {saving ? (
            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Saving Preferences...</span></>
          ) : (
            <><CheckCircle2 className="w-3.5 h-3.5" /><span>Save Settings</span></>
          )}
        </button>
      </div>
    </div>
  );
}

function CourseStatusBadge({
  isPublished,
  className = '',
  tooltipPosition = 'top',
}: {
  isPublished?: boolean;
  className?: string;
  tooltipPosition?: 'top' | 'bottom';
}) {
  return (
    <div className={`relative group/status inline-block select-none ${className}`}>
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-help transition-all duration-300 shadow-sm backdrop-blur-md ${
          isPublished
            ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/25 shadow-emerald-500/10'
            : 'bg-amber-500/20 dark:bg-amber-500/25 text-amber-900 dark:text-amber-300 border border-amber-500/50 hover:border-amber-500/80 hover:bg-amber-500/30 ring-2 ring-amber-500/20 dark:ring-amber-500/30 shadow-amber-500/10 animate-pulse'
        }`}
      >
        {/* Pulsing Animated Indicator Dot */}
        <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isPublished ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isPublished ? 'bg-emerald-500' : 'bg-amber-500 shadow-sm shadow-amber-500/50'
            }`}
          />
        </span>
        <span className="font-mono tracking-tight font-black">
          {isPublished ? 'Live Published' : 'Draft Mode'}
        </span>
      </span>

      {/* Floating Animated Tooltip with Smooth Scale/Fade Animation */}
      <div
        className={`absolute left-0 w-60 p-2.5 rounded-xl bg-zinc-950/95 dark:bg-zinc-900/95 backdrop-blur-md text-white text-[11px] shadow-2xl border pointer-events-none opacity-0 scale-95 transition-all duration-200 ease-out z-50 ${
          isPublished ? 'border-emerald-500/40 shadow-emerald-500/10' : 'border-amber-500/50 shadow-amber-500/15'
        } ${
          tooltipPosition === 'top'
            ? 'bottom-full mb-2 -translate-y-1 group-hover/status:opacity-100 group-hover/status:scale-100 group-hover/status:translate-y-0'
            : 'top-full mt-2 translate-y-1 group-hover/status:opacity-100 group-hover/status:scale-100 group-hover/status:translate-y-0'
        }`}
      >
        <div className="flex items-center gap-1.5 font-bold mb-1">
          {isPublished ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0" />
              <span className="text-emerald-400 font-black uppercase text-[10px] tracking-wider">🟢 Live in Catalog</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block shrink-0" />
              <span className="text-amber-400 font-black uppercase text-[10px] tracking-wider">⚠️ Unpublished Draft</span>
            </>
          )}
        </div>
        <p className="text-zinc-300 leading-relaxed text-[10.5px]">
          {isPublished
            ? 'Active in public catalog. Enrolled students can access lectures, take quizzes, and earn certificates.'
            : 'Private to instructor. Not listed in public catalog until you click the Globe button to publish.'}
        </p>
        <div
          className={`absolute left-4 border-4 border-transparent ${
            tooltipPosition === 'top'
              ? 'top-full -mt-[1px] border-t-zinc-950 dark:border-t-zinc-900'
              : 'bottom-full -mb-[1px] border-b-zinc-950 dark:border-b-zinc-900'
          }`}
        />
      </div>
    </div>
  );
}

function InstructorDashboardContent() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams ? (searchParams.get('tab') as DashboardTab | null) : null;
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Student Roster Filter States
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentCourseFilter, setStudentCourseFilter] = useState<string>('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('all');

  // Stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  // Reviews
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewCourseFilter, setReviewCourseFilter] = useState<string>('all');
  const [reviewStarFilter, setReviewStarFilter] = useState<number>(0);

  // Creation Modal
  const [showMethodModal, setShowMethodModal] = useState(false);

  // Sync with tab in query params
  useEffect(() => {
    if (tabFromQuery && ['dashboard', 'courses', 'analytics', 'students', 'earnings', 'reviews', 'ai_providers', 'settings', 'profile'].includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  // Fetch real courses, enrollments, quizzes, certificates, and reviews from Supabase
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch courses
      const { data: dbCourses, error: courseErr } = await supabaseAdmin
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (courseErr) console.warn('Course query issue:', courseErr);

      const allCourses = (dbCourses && dbCourses.length > 0 ? dbCourses : [INITIAL_DEMO_COURSE]) as Course[];
      setCourses(allCourses);

      // 2. Fetch all enrollments (including amount_paid for revenue)
      const { data: dbEnrollments, error: enrollErr } = await supabaseAdmin
        .from('enrollments')
        .select('*')
        .order('enrolled_at', { ascending: false });

      if (enrollErr) console.warn('Enrollment query issue:', enrollErr);

      const rawEnrollments = dbEnrollments || [];
      setEnrollments(rawEnrollments);

      // 3. Fetch all quiz attempts
      const { data: dbQuizzes, error: quizErr } = await supabaseAdmin
        .from('quiz_attempts')
        .select('*')
        .order('attempted_at', { ascending: false });

      if (quizErr) console.warn('Quiz attempts query issue:', quizErr);
      setQuizAttempts(dbQuizzes || []);

      // 4. Fetch all certificates
      const { data: dbCertificates, error: certErr } = await supabaseAdmin
        .from('certificates')
        .select('*')
        .order('issue_date', { ascending: false });

      if (certErr) console.warn('Certificates query issue:', certErr);
      setCertificates(dbCertificates || []);

      // 5. Fetch all modules
      const { data: dbModules } = await supabaseAdmin
        .from('modules')
        .select('id, course_id, title, duration_minutes, has_quiz');
      setModules(dbModules || []);

      // Total students count
      const totalEnrolled = rawEnrollments.length;
      setTotalStudents(totalEnrolled);

      // Calculate Total Revenue as SUM of amount_paid from all enrollment records
      const calculatedRevenue = rawEnrollments.reduce((acc: number, enr: any) => {
        return acc + (Number(enr.amount_paid) || 0);
      }, 0);

      setTotalEarnings(calculatedRevenue);

      // 6. Fetch all reviews and compute live average rating
      const { data: dbReviews } = await supabaseAdmin
        .from('course_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      const allReviews = dbReviews || [];
      setReviews(allReviews);

      if (allReviews.length > 0) {
        const avg = allReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / allReviews.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSelectCreationMethod = (method: CourseCreationMethod, initialData?: any) => {
    setShowMethodModal(false);
    const params = new URLSearchParams();
    params.set('method', method);
    if (initialData?.prompt) params.set('prompt', initialData.prompt);
    if (initialData?.modulesCount) params.set('modulesCount', String(initialData.modulesCount));
    if (initialData?.level) params.set('level', initialData.level);
    router.push(`/instructor/course/create?${params.toString()}`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    try {
      await supabaseAdmin.from('courses').delete().eq('id', courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      showToast({ type: 'success', title: 'Course Deleted', message: 'The course was removed successfully.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  const handleTogglePublish = async (course: Course) => {
    const nextStatus = course.is_published ? 'draft' : 'published';
    try {
      await supabaseAdmin
        .from('courses')
        .update({ is_published: !course.is_published, status: nextStatus })
        .eq('id', course.id);

      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, is_published: !c.is_published, status: nextStatus as any } : c))
      );

      showToast({
        type: 'success',
        title: nextStatus === 'published' ? 'Course Published' : 'Course Unpublished',
        message: `Status updated to ${nextStatus}.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesFilter =
      courseFilter === 'all' ||
      (courseFilter === 'published' && c.is_published) ||
      (courseFilter === 'draft' && !c.is_published);
    const matchesSearch =
      searchTerm === '' ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const sidebarNavItems: Array<{ id: DashboardTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <Layers className="w-4 h-4" /> },
    { id: 'courses', label: 'My Courses', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" /> },
    { id: 'earnings', label: 'Earnings', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <MessageSquare className="w-4 h-4" />, badge: reviews.length > 0 ? reviews.length : undefined },
    { id: 'ai_providers', label: 'AI Providers', icon: <Cpu className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  // Mobile Bottom Nav Horizontal Scroll State
  const mobileNavRef = React.useRef<HTMLDivElement | null>(null);
  const [showRightNavArrow, setShowRightNavArrow] = useState(true);
  const [showLeftNavArrow, setShowLeftNavArrow] = useState(false);

  const checkNavScroll = () => {
    if (mobileNavRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = mobileNavRef.current;
      setShowLeftNavArrow(scrollLeft > 10);
      setShowRightNavArrow(scrollLeft < scrollWidth - clientWidth - 15);
    }
  };

  useEffect(() => {
    checkNavScroll();
  }, [activeTab]);

  const handleScrollNav = (direction: 'left' | 'right') => {
    if (mobileNavRef.current) {
      const amount = direction === 'left' ? -150 : 150;
      mobileNavRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white flex flex-col md:flex-row relative">
      {/* Creation Method Modal */}
      <CreationMethodModal
        isOpen={showMethodModal}
        onClose={() => setShowMethodModal(false)}
        onSelectMethod={handleSelectCreationMethod}
      />

      {/* DESKTOP SIDEBAR NAVIGATION (Hidden on mobile) */}
      <aside
        className={`hidden md:block md:w-64 border-r p-5 space-y-4 shrink-0 md:sticky md:top-0 md:h-screen overflow-y-auto ${
          isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'
        }`}
      >
        {/* Navigation Links */}
        <nav className="space-y-1">
          {sidebarNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm font-extrabold'
                    : isLight
                    ? 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible only on mobile / tablet) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl transition-colors shadow-2xl">
        <div className="relative flex items-center">
          {/* Optional Left Scroll Indicator Button */}
          {showLeftNavArrow && (
            <button
              type="button"
              onClick={() => handleScrollNav('left')}
              className={`absolute left-0 top-0 bottom-0 z-10 px-1.5 flex items-center justify-center backdrop-blur-md cursor-pointer transition ${
                isLight ? 'bg-white/85 text-black' : 'bg-zinc-950/85 text-white'
              }`}
              title="Scroll Left"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3] text-sky-500" />
            </button>
          )}

          {/* Scrollable Nav Container */}
          <nav
            ref={mobileNavRef}
            onScroll={checkNavScroll}
            aria-label="Mobile Navigation"
            className={`w-full px-2 py-2 flex items-center space-x-1 overflow-x-auto scrollbar-none transition-colors ${
              isLight ? 'bg-white/95 text-black' : 'bg-zinc-950/95 text-white'
            }`}
          >
            {sidebarNavItems
              .filter((item) => item.id !== 'students')
              .map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl shrink-0 min-w-[64px] transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm font-extrabold scale-105'
                        : isLight
                        ? 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <div className="relative">
                      {item.icon}
                      {item.badge !== undefined && (
                        <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[9px] font-black bg-sky-500 text-white leading-none">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                );
              })}
          </nav>

          {/* Right Scroll Indicator Arrow (Alerts user that more tabs exist to the right) */}
          {showRightNavArrow && (
            <button
              type="button"
              onClick={() => handleScrollNav('right')}
              className={`absolute right-0 top-0 bottom-0 z-10 px-2 flex items-center justify-center backdrop-blur-md cursor-pointer transition shadow-xs ${
                isLight
                  ? 'bg-gradient-to-l from-white via-white/90 to-transparent text-black'
                  : 'bg-gradient-to-l from-zinc-950 via-zinc-950/90 to-transparent text-white'
              }`}
              title="More options to the right"
              aria-label="More options to the right"
            >
              <div className="flex items-center space-x-0.5 animate-pulse">
                <ChevronRight className="w-4 h-4 stroke-[3] text-sky-500" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-6xl mx-auto overflow-y-auto pb-28 md:pb-16">
        {/* ========================================================================= */}
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Top Welcome & Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
                  Instructor Studio Overview
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Manage your telecom curriculum, monitor student engagement, and configure AI authoring.
                </p>
              </div>
            </div>

            {/* Statistics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-3 text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Courses</span>
                  <BookOpen className="w-4 h-4 text-black dark:text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-black dark:text-white">{courses.length}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {courses.filter((c) => c.is_published).length} Published • {courses.filter((c) => !c.is_published).length} Drafts
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-3 text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Students</span>
                  <Users className="w-4 h-4 text-black dark:text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-black dark:text-white">{totalStudents}</div>
                <div className="text-xs text-zinc-500 font-bold mt-1">↑ +18% this month</div>
              </div>

              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-3 text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                  <DollarSign className="w-4 h-4 text-black dark:text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-black dark:text-white">₹{totalEarnings.toLocaleString()}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {totalStudents > 0 ? `From ${totalStudents} enrolled students` : 'No enrollments yet'}
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-3 text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Average Rating</span>
                  <Star className="w-4 h-4 text-black dark:text-white fill-black dark:fill-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-black dark:text-white">
                  {averageRating > 0 ? `${averageRating} / 5.0` : '—'}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {reviews.length > 0
                    ? `Based on ${reviews.length} verified review${reviews.length !== 1 ? 's' : ''}`
                    : 'No reviews yet'}
                </div>
              </div>
            </div>

            {/* Quick Course Launch Banner */}
            <div className={`p-6 rounded-3xl border ${isLight ? 'bg-zinc-100 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-800 text-white'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 text-xs font-bold font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI-Powered Multi-Format Authoring</span>
                  </div>
                  <h3 className="text-xl font-black">Build your next telecom course in minutes</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Import existing PPT presentations, upload syllabus notes, or prompt Groq and Gemini to build normalized modular slide decks, quizzes, and certificates automatically.
                  </p>
                </div>

                <button
                  onClick={() => setShowMethodModal(true)}
                  className="px-6 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider shrink-0 shadow-lg hover:opacity-90 transition active:scale-95 cursor-pointer"
                >
                  Start Course Creator →
                </button>
              </div>
            </div>

            {/* Recent Courses List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black tracking-tight">Recent Courses</h2>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="text-xs font-bold text-black dark:text-white hover:underline cursor-pointer"
                >
                  View All ({courses.length}) →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between transition ${
                      isLight ? 'bg-white border-zinc-200 hover:border-zinc-300' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <CourseStatusBadge isPublished={c.is_published} tooltipPosition="bottom" />
                        <span className="text-xs font-mono font-bold">
                          {c.price && c.price > 0 ? `${getCurrencySymbol(c.currency || 'INR')} ${c.price}` : 'FREE'}
                        </span>
                      </div>

                      <h3 className="text-base font-black tracking-tight line-clamp-1 mb-1">{c.title}</h3>
                      <p className="text-xs text-zinc-500 line-clamp-2">{c.summary}</p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-medium">
                        {c.modules?.length || c.modules_count || 5} Modules
                      </span>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/courses/${c.id}`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white transition"
                          title="Preview as Student"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/instructor/course/create?editCourseId=${c.id}`}
                          className="px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90"
                        >
                          Edit Course
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY COURSES */}
        {/* ========================================================================= */}
        {activeTab === 'courses' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Course Management</h1>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                  Filter, edit, preview, and manage publishing states for all authored courses.
                </p>
              </div>

              <button
                onClick={() => setShowMethodModal(true)}
                className="p-2.5 sm:px-5 sm:py-2.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shrink-0 shadow-sm cursor-pointer hover:opacity-90 transition active:scale-95"
                title="Create Course"
              >
                <Plus className="w-5 h-5 sm:w-4 sm:h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Create Course</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search courses by title or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs ${
                    isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>

              <div className="flex items-center space-x-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full sm:w-auto justify-center">
                <button
                  type="button"
                  onClick={() => setCourseFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    courseFilter === 'all' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-500'
                  }`}
                >
                  All ({courses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCourseFilter('published')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    courseFilter === 'published' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-500'
                  }`}
                >
                  Published ({courses.filter((c) => c.is_published).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCourseFilter('draft')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    courseFilter === 'draft' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-500'
                  }`}
                >
                  Drafts ({courses.filter((c) => !c.is_published).length})
                </button>
              </div>
            </div>

            {/* Courses Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition shadow-sm ${
                    isLight ? 'bg-white border-zinc-200 hover:shadow-md' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* Thumbnail Cover */}
                  <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                    <img
                      src={
                        c.thumbnail_url ||
                        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
                      }
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 z-10">
                      <CourseStatusBadge isPublished={c.is_published} tooltipPosition="bottom" />
                    </div>

                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur text-white text-xs font-mono font-bold">
                      {c.price && c.price > 0 ? `${getCurrencySymbol(c.currency || 'INR')} ${c.price}` : 'FREE'}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
                        {c.category || 'Telecom'}
                      </span>
                      <h3 className="text-base font-black tracking-tight line-clamp-2 mt-0.5">{c.title}</h3>
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-1.5">{c.summary}</p>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                      <span>{c.modules?.length || c.modules_count || 5} Modules</span>
                      <span>•</span>
                      <span>{c.course_duration || 90}m</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 pt-0 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between gap-2 mt-auto">
                    <Link
                      href={`/instructor/course/create?editCourseId=${c.id}`}
                      className="flex-1 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs text-center hover:opacity-90 transition shadow-sm"
                    >
                      Continue Editing
                    </Link>

                    <Link
                      href={`/courses/${c.id}`}
                      className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-black dark:hover:text-white transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      title="Preview Course as Student"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleTogglePublish(c)}
                      className={`relative group/pub p-2 rounded-xl border transition-all cursor-pointer ${
                        c.is_published
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white shadow-emerald-500/10'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white ring-2 ring-amber-500/20 dark:ring-amber-500/30 shadow-amber-500/10 animate-pulse'
                      }`}
                      title={c.is_published ? 'Live in Catalog (Click to Unpublish)' : 'Unpublished Draft (Click to Publish Live)'}
                    >
                      <Globe className="w-4 h-4" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-zinc-950 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover/pub:opacity-100 transition-all pointer-events-none z-30 shadow-xl border border-zinc-800 font-bold">
                        {c.is_published ? 'Click to Unpublish' : 'Click to Publish Live 🚀'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(c.id)}
                      className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500 transition hover:bg-red-500/10 hover:border-red-500/30"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AI PROVIDERS */}
        {/* ========================================================================= */}
        {activeTab === 'ai_providers' && (
          <div className="animate-in fade-in">
            <AIProviderSettingsTab />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ANALYTICS                                                         */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (() => {
          const totalEnrolled = enrollments.length;
          const completedEnrollments = enrollments.filter(
            (e) => e.status === 'completed' || Number(e.progress_percent) >= 100
          ).length;
          const completionRate = totalEnrolled > 0
            ? ((completedEnrollments / totalEnrolled) * 100).toFixed(1)
            : '0.0';
          const avgProgress = totalEnrolled > 0
            ? (enrollments.reduce((sum, e) => sum + (Number(e.progress_percent) || 0), 0) / totalEnrolled).toFixed(1)
            : '0.0';
          const totalQuizzes = quizAttempts.length;
          const passedQuizzes = quizAttempts.filter((q) => q.is_passed).length;
          const quizPassRate = totalQuizzes > 0
            ? ((passedQuizzes / totalQuizzes) * 100).toFixed(1)
            : '0.0';
          const avgQuizScore = totalQuizzes > 0
            ? (quizAttempts.reduce((sum, q) => sum + (Number(q.score_percent) || 0), 0) / totalQuizzes).toFixed(1)
            : '0.0';
          const totalCertificates = certificates.length;

          // Engagement brackets
          const bracket0to25 = enrollments.filter((e) => Number(e.progress_percent) <= 25).length;
          const bracket26to50 = enrollments.filter((e) => Number(e.progress_percent) > 25 && Number(e.progress_percent) <= 50).length;
          const bracket51to75 = enrollments.filter((e) => Number(e.progress_percent) > 50 && Number(e.progress_percent) <= 75).length;
          const bracket76to99 = enrollments.filter((e) => Number(e.progress_percent) > 75 && Number(e.progress_percent) < 100).length;
          const bracket100 = enrollments.filter((e) => Number(e.progress_percent) >= 100 || e.status === 'completed').length;

          return (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                    <BarChart2 className="w-7 h-7" />
                    Curriculum & Student Analytics
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    Live telemetry aggregated directly from Supabase student progress, quiz submissions, and certificate records.
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
                  Database Synced • {totalEnrolled} Learner{totalEnrolled !== 1 ? 's' : ''}
                </div>
              </div>

              {/* 4 Core Metric KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex items-center justify-between text-zinc-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Completion Rate</span>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-black font-mono text-black dark:text-white mt-1">
                    {completionRate}%
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {completedEnrollments} of {totalEnrolled} finished full course
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex items-center justify-between text-zinc-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Average Progress</span>
                    <Activity className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="text-3xl font-black font-mono text-black dark:text-white mt-1">
                    {avgProgress}%
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(Number(avgProgress) || 0, 100)}%` }}
                    />
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex items-center justify-between text-zinc-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Quiz Pass Rate</span>
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-black font-mono text-black dark:text-white mt-1">
                    {quizPassRate}%
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {passedQuizzes}/{totalQuizzes} attempts (Avg score: {avgQuizScore}%)
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex items-center justify-between text-zinc-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Certificates Awarded</span>
                    <GraduationCap className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-3xl font-black font-mono text-black dark:text-white mt-1">
                    {totalCertificates}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Cryptographically hashed credentials
                  </p>
                </div>
              </div>

              {/* Learner Progress Distribution Funnel */}
              <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                <h2 className="text-base font-black tracking-tight mb-1">Learner Retention & Engagement Milestones</h2>
                <p className="text-xs text-zinc-500 mb-5">Distribution of all {totalEnrolled} enrolled learners across learning progress brackets.</p>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        Completed & Graduated (100%)
                      </span>
                      <span className="font-mono">{bracket100} student{bracket100 !== 1 ? 's' : ''} ({totalEnrolled > 0 ? ((bracket100 / totalEnrolled) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${totalEnrolled > 0 ? (bracket100 / totalEnrolled) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                        Final Stages (76% - 99%)
                      </span>
                      <span className="font-mono">{bracket76to99} student{bracket76to99 !== 1 ? 's' : ''} ({totalEnrolled > 0 ? ((bracket76to99 / totalEnrolled) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: `${totalEnrolled > 0 ? (bracket76to99 / totalEnrolled) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                        Intermediate Phase (51% - 75%)
                      </span>
                      <span className="font-mono">{bracket51to75} student{bracket51to75 !== 1 ? 's' : ''} ({totalEnrolled > 0 ? ((bracket51to75 / totalEnrolled) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${totalEnrolled > 0 ? (bracket51to75 / totalEnrolled) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        Early Progress (26% - 50%)
                      </span>
                      <span className="font-mono">{bracket26to50} student{bracket26to50 !== 1 ? 's' : ''} ({totalEnrolled > 0 ? ((bracket26to50 / totalEnrolled) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${totalEnrolled > 0 ? (bracket26to50 / totalEnrolled) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 inline-block" />
                        Getting Started (0% - 25%)
                      </span>
                      <span className="font-mono">{bracket0to25} student{bracket0to25 !== 1 ? 's' : ''} ({totalEnrolled > 0 ? ((bracket0to25 / totalEnrolled) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-zinc-400 h-full rounded-full transition-all" style={{ width: `${totalEnrolled > 0 ? (bracket0to25 / totalEnrolled) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Course-by-Course Curriculum & Performance Matrix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black tracking-tight">Course Curriculum & Performance Breakdown</h2>
                  <span className="text-xs text-zinc-400 font-mono">{courses.length} courses registered</span>
                </div>

                <div className={`rounded-2xl border overflow-hidden ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">
                          <th className="p-4">Course Name & Category</th>
                          <th className="p-4">Curriculum Units</th>
                          <th className="p-4">Enrolled Students</th>
                          <th className="p-4">Avg Learner Progress</th>
                          <th className="p-4">Quiz Passes</th>
                          <th className="p-4">Certs Awarded</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        {courses.map((c) => {
                          const courseEnrollments = enrollments.filter((e) => e.course_id === c.id);
                          const courseStudentsCount = courseEnrollments.length;
                          const courseAvgProg = courseStudentsCount > 0
                            ? (courseEnrollments.reduce((sum, e) => sum + (Number(e.progress_percent) || 0), 0) / courseStudentsCount).toFixed(0)
                            : '0';
                          const courseQuizzes = quizAttempts.filter((q) => q.course_id === c.id);
                          const courseQuizzesPassed = courseQuizzes.filter((q) => q.is_passed).length;
                          const courseCerts = certificates.filter((cert) => cert.course_id === c.id).length;
                          const courseModulesCount = modules.filter((m) => m.course_id === c.id).length || c.modules_count || 0;

                          return (
                            <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                              <td className="p-4 font-bold max-w-xs">
                                <div className="text-sm font-black text-black dark:text-white line-clamp-1">{c.title}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                                    {c.category || 'Telecom'}
                                  </span>
                                  <CourseStatusBadge isPublished={c.is_published} tooltipPosition="top" />
                                </div>
                              </td>
                              <td className="p-4 font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                {courseModulesCount} Modules
                              </td>
                              <td className="p-4 font-mono font-bold text-black dark:text-white">
                                {courseStudentsCount > 0 ? `${courseStudentsCount} students` : '0'}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-full rounded-full"
                                      style={{ width: `${Math.min(Number(courseAvgProg) || 0, 100)}%` }}
                                    />
                                  </div>
                                  <span className="font-mono font-bold">{courseAvgProg}%</span>
                                </div>
                              </td>
                              <td className="p-4 font-mono">
                                {courseQuizzes.length > 0
                                  ? `${courseQuizzesPassed} / ${courseQuizzes.length} passed`
                                  : '0 attempts'}
                              </td>
                              <td className="p-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                                {courseCerts} cert{courseCerts !== 1 ? 's' : ''}
                              </td>
                              <td className="p-4 text-right">
                                <Link
                                  href={`/courses/${c.id}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-black dark:hover:text-white"
                                >
                                  <span>View</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* TAB 5: ENROLLED STUDENTS ROSTER                                           */}
        {/* ========================================================================= */}
        {activeTab === 'students' && (() => {
          // Filter enrolled students dynamically
          const filteredEnrollments = enrollments.filter((enr) => {
            const course = courses.find((c) => c.id === enr.course_id);
            const studentName = enr.student_name || 'Anonymous Learner';
            const studentEmail = enr.student_email || '';
            const courseTitle = course?.title || enr.course_title || '';
            
            const matchesSearch = !studentSearchTerm ||
              studentName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
              studentEmail.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
              courseTitle.toLowerCase().includes(studentSearchTerm.toLowerCase());

            const matchesCourse = studentCourseFilter === 'all' || enr.course_id === studentCourseFilter;
            const matchesStatus = studentStatusFilter === 'all' || enr.status === studentStatusFilter;

            return matchesSearch && matchesCourse && matchesStatus;
          });

          return (
            <div className="space-y-6 animate-in fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                    <Users className="w-7 h-7" />
                    Enrolled Students Roster
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    Real-time enrollment directory, learner completion status, and payment records fetched from database.
                  </p>
                </div>

                <div className={`px-4 py-2.5 rounded-xl border font-mono font-black text-sm ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
                  {filteredEnrollments.length} of {enrollments.length} Student{enrollments.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Filter Controls Bar */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-3 items-center justify-between ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                {/* Search input */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="Search by student name, email, or course..."
                    className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border outline-none transition ${
                      isLight ? 'bg-zinc-50 border-zinc-200 focus:border-black' : 'bg-zinc-900 border-zinc-800 focus:border-white'
                    }`}
                  />
                </div>

                {/* Dropdown Filters */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 w-full md:w-auto">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Course:</span>
                    <select
                      value={studentCourseFilter}
                      onChange={(e) => setStudentCourseFilter(e.target.value)}
                      className={`text-xs px-3 py-2 rounded-xl border outline-none w-full md:w-48 ${
                        isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-800 text-white'
                      }`}
                    >
                      <option value="all">All Courses ({courses.length})</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 w-full md:w-auto">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Status:</span>
                    <select
                      value={studentStatusFilter}
                      onChange={(e) => setStudentStatusFilter(e.target.value)}
                      className={`text-xs px-3 py-2 rounded-xl border outline-none ${
                        isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-800 text-white'
                      }`}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Students Roster Table */}
              <div className={`rounded-2xl border overflow-hidden ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                {filteredEnrollments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">
                          <th className="p-4">Student</th>
                          <th className="p-4">Enrolled Course</th>
                          <th className="p-4">Progress</th>
                          <th className="p-4">Payment Info</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Enrolled Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        {filteredEnrollments.map((enr, idx) => {
                          const course = courses.find((c) => c.id === enr.course_id);
                          const studentName = enr.student_name || 'Anonymous Student';
                          const studentEmail = enr.student_email || 'student@signalhub.app';
                          const progress = Number(enr.progress_percent) || 0;
                          const amountPaid = Number(enr.amount_paid) || 0;
                          const enrolledDate = enr.enrolled_at
                            ? new Date(enr.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Recently';

                          const initials = studentName
                            .split(' ')
                            .map((p: string) => p[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                          return (
                            <tr key={enr.id || idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                              {/* Student Info */}
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs font-mono shrink-0 ${
                                    isLight ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-800 text-zinc-200'
                                  }`}>
                                    {initials || 'ST'}
                                  </div>
                                  <div>
                                    <div className="font-black text-black dark:text-white text-sm">{studentName}</div>
                                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{studentEmail}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Course Title */}
                              <td className="p-4 max-w-xs">
                                <div className="font-bold text-black dark:text-white line-clamp-1">
                                  {course?.title || enr.course_title || 'Telecom Engineering Course'}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-mono uppercase mt-0.5">
                                  {course?.category || 'Telecom 5G'}
                                </div>
                              </td>

                              {/* Progress */}
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                  </div>
                                  <span className="font-mono font-bold text-xs">{progress.toFixed(0)}%</span>
                                </div>
                              </td>

                              {/* Payment info */}
                              <td className="p-4">
                                <div className="font-mono font-bold text-black dark:text-white">
                                  {amountPaid > 0 ? `₹${amountPaid.toLocaleString()}` : 'FREE (₹0)'}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-mono uppercase mt-0.5 flex items-center gap-1">
                                  <span>{enr.payment_method || 'UPI_QR'}</span>
                                  <span>•</span>
                                  <span className={enr.payment_status === 'paid' ? 'text-emerald-500 font-bold' : 'text-zinc-400'}>
                                    {enr.payment_status || 'free'}
                                  </span>
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  enr.status === 'completed' || progress >= 100
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : enr.status === 'cancelled'
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                                }`}>
                                  {enr.status === 'completed' || progress >= 100 ? 'Completed' : enr.status || 'Active'}
                                </span>
                              </td>

                              {/* Enrolled Date */}
                              <td className="p-4 font-mono text-zinc-500 text-xs whitespace-nowrap">
                                {enrolledDate}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-3">
                    <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${isLight ? 'bg-zinc-100 text-zinc-400' : 'bg-zinc-900 text-zinc-500'}`}>
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-black text-black dark:text-white">No Enrolled Students Found</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      {enrollments.length === 0
                        ? 'Your courses are ready. Once students enroll from the catalog, their progress and real-time records will be listed here.'
                        : 'No students matched your active filter. Try adjusting your search query or reset the filters.'}
                    </p>
                    {studentSearchTerm || studentCourseFilter !== 'all' || studentStatusFilter !== 'all' ? (
                      <button
                        onClick={() => {
                          setStudentSearchTerm('');
                          setStudentCourseFilter('all');
                          setStudentStatusFilter('all');
                        }}
                        className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider hover:opacity-90 transition cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    ) : (
                      <Link
                        href="/courses"
                        className="inline-block px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider hover:opacity-90 transition"
                      >
                        Preview Course Catalog →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* TAB 6: REVENUE & EARNINGS BREAKDOWN                                       */}
        {/* ========================================================================= */}
        {activeTab === 'earnings' && (() => {
          const totalPaidEnrollments = enrollments.filter((e) => (Number(e.amount_paid) || 0) > 0).length;
          const totalFreeEnrollments = enrollments.filter((e) => (Number(e.amount_paid) || 0) === 0).length;
          const avgPerStudent = totalStudents > 0 ? Math.round(totalEarnings / totalStudents) : 0;
          const avgPerCourse = courses.length > 0 ? Math.round(totalEarnings / courses.length) : 0;

          // Recent enrollment transactions from database
          const recentTransactions = enrollments
            .filter((e) => (Number(e.amount_paid) || 0) > 0 || e.payment_status === 'paid' || e.utr_number || e.transaction_ref)
            .slice(0, 10);

          return (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-sans flex items-center gap-2">
                    <DollarSign className="w-7 h-7" />
                    Revenue & Earnings Breakdown
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    Live dynamic revenue calculated directly from database payment transactions and student enrollments.
                  </p>
                </div>

                <div className="px-5 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-mono font-black text-sm uppercase tracking-wider shadow-md">
                  Gross Revenue: ₹{totalEarnings.toLocaleString()}
                </div>
              </div>

              {/* Top Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex items-center justify-between mb-2 text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-black dark:text-white">
                    ₹{totalEarnings.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                    Σ amount_paid in Supabase
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex items-center justify-between mb-2 text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Paid Enrollments</span>
                    <CreditCard className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-black dark:text-white">
                    {totalPaidEnrollments}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    + {totalFreeEnrollments} free enrollments
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex items-center justify-between mb-2 text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Avg Revenue / Course</span>
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-black dark:text-white">
                    ₹{avgPerCourse.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Across {courses.length} courses
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex items-center justify-between mb-2 text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Avg Revenue / Student</span>
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-black dark:text-white">
                    ₹{avgPerStudent.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Per registered student
                  </p>
                </div>
              </div>

              {/* Course Revenue Breakdown Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black tracking-tight">Course Revenue Breakdown Matrix</h2>
                  <span className="text-xs text-zinc-400 font-mono">Live DB Sync</span>
                </div>

                <div className={`rounded-2xl border overflow-hidden ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">
                          <th className="p-4">Course Name & Category</th>
                          <th className="p-4">Course Price</th>
                          <th className="p-4">Enrolled Students</th>
                          <th className="p-4">Paid Students</th>
                          <th className="p-4">Revenue Calculation</th>
                          <th className="p-4 text-right">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        {courses.map((course) => {
                          const courseEnrollments = enrollments.filter((e) => e.course_id === course.id);
                          const totalCount = courseEnrollments.length;
                          const paidCount = courseEnrollments.filter((e) => (Number(e.amount_paid) || 0) > 0).length;
                          const price = Number(course.price) || 0;
                          const subtotal = courseEnrollments.reduce((acc: number, e: any) => acc + (Number(e.amount_paid) || 0), 0);

                          return (
                            <tr key={course.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                              <td className="p-4 font-bold max-w-xs">
                                <div className="text-sm font-black text-black dark:text-white line-clamp-1">{course.title}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                                    {course.category || 'Telecom'}
                                  </span>
                                  <CourseStatusBadge isPublished={course.is_published} tooltipPosition="top" />
                                </div>
                              </td>
                              <td className="p-4 font-mono font-bold text-black dark:text-white">
                                {price > 0 ? `₹${price.toLocaleString()}` : 'FREE (₹0)'}
                              </td>
                              <td className="p-4 font-mono font-bold text-black dark:text-white">
                                {totalCount > 0 ? `${totalCount} students` : '0'}
                              </td>
                              <td className="p-4 font-mono text-zinc-600 dark:text-zinc-400">
                                {paidCount} paid
                              </td>
                              <td className="p-4 font-mono text-zinc-500">
                                {totalCount > 0 ? `Σ amount_paid` : '—'}
                              </td>
                              <td className="p-4 font-mono font-black text-black dark:text-white text-right text-sm">
                                ₹{subtotal.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/80 font-black">
                          <td className="p-4 text-black dark:text-white uppercase font-sans">Total Across All Courses</td>
                          <td className="p-4 font-mono text-zinc-500">—</td>
                          <td className="p-4 font-mono text-black dark:text-white">{totalStudents} students</td>
                          <td className="p-4 font-mono text-black dark:text-white">{totalPaidEnrollments} paid</td>
                          <td className="p-4 font-mono text-zinc-500 font-normal">Sum of all enrollments</td>
                          <td className="p-4 font-mono text-black dark:text-white text-right text-base">₹{totalEarnings.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Payment & Transactions Log */}
              {recentTransactions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-black tracking-tight">Recent Payment Transactions Log</h2>
                    <span className="text-xs text-zinc-400 font-mono">{recentTransactions.length} recent records</span>
                  </div>

                  <div className={`rounded-2xl border overflow-hidden ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">
                            <th className="p-4">Reference / UTR</th>
                            <th className="p-4">Student</th>
                            <th className="p-4">Course</th>
                            <th className="p-4">Method</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                          {recentTransactions.map((tx, idx) => {
                            const course = courses.find((c) => c.id === tx.course_id);
                            const amount = Number(tx.amount_paid) || 0;
                            const ref = tx.utr_number || tx.transaction_ref || `TX-${tx.id ? tx.id.slice(0, 8) : String(idx)}`;
                            const dateStr = tx.enrolled_at ? new Date(tx.enrolled_at).toLocaleDateString() : 'Recent';

                            return (
                              <tr key={tx.id || idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                                <td className="p-4 font-mono font-bold text-black dark:text-white">
                                  {ref}
                                </td>
                                <td className="p-4">
                                  <div className="font-bold text-black dark:text-white">{tx.student_name || 'Student Learner'}</div>
                                  <div className="text-[10px] text-zinc-400 font-mono">{tx.student_email || 'student@signalhub.app'}</div>
                                </td>
                                <td className="p-4 max-w-xs font-bold text-zinc-700 dark:text-zinc-300 line-clamp-1">
                                  {course?.title || tx.course_title || 'Telecom Course'}
                                </td>
                                <td className="p-4 font-mono uppercase text-zinc-500">
                                  {tx.payment_method || 'UPI_QR'}
                                </td>
                                <td className="p-4 font-mono font-black text-black dark:text-white">
                                  ₹{amount.toLocaleString()}
                                </td>
                                <td className="p-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    {tx.payment_status || 'Paid'}
                                  </span>
                                </td>
                                <td className="p-4 font-mono text-zinc-400">
                                  {dateStr}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* TAB 7: STUDENT REVIEWS                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (() => {
          // Computed stats for reviews tab
          const totalReviews = reviews.length;
          const avgRatingAll = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;
          const ratingDist = [5, 4, 3, 2, 1].map((s) => ({
            star: s,
            count: reviews.filter((r) => r.rating === s).length,
          }));

          // Filtered reviews
          const filteredReviews = reviews.filter((r) => {
            const matchesCourse = reviewCourseFilter === 'all' || r.course_id === reviewCourseFilter;
            const matchesStar = reviewStarFilter === 0 || r.rating === reviewStarFilter;
            return matchesCourse && matchesStar;
          });

          return (
            <div className="space-y-6 animate-in fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-7 h-7" />
                    Student Reviews & Feedback
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    Real feedback from enrolled students across all your courses.
                  </p>
                </div>
                <div className={`px-4 py-2.5 rounded-xl border font-mono font-black text-sm ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
                  {totalReviews} Total Review{totalReviews !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Average Rating */}
                <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="text-xs font-bold uppercase text-zinc-400 mb-2">Average Rating</div>
                  <div className="flex items-end gap-3">
                    <div className="text-4xl font-black font-mono text-black dark:text-white leading-none">
                      {avgRatingAll > 0 ? avgRatingAll.toFixed(1) : '—'}
                    </div>
                    <div className="pb-1">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRatingAll) ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`} />
                        ))}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>

                {/* Star Distribution */}
                <div className={`p-5 rounded-2xl border sm:col-span-2 ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="text-xs font-bold uppercase text-zinc-400 mb-3">Rating Distribution</div>
                  <div className="space-y-1.5">
                    {ratingDist.map(({ star, count }) => {
                      const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-3 text-xs">
                          <button
                            onClick={() => setReviewStarFilter(reviewStarFilter === star ? 0 : star)}
                            className={`flex items-center gap-1 shrink-0 w-10 hover:opacity-70 transition ${reviewStarFilter === star ? 'opacity-100' : ''}`}
                          >
                            <span className="font-mono font-bold">{star}</span>
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </button>
                          <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono text-zinc-500 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <Filter className="w-3.5 h-3.5" />
                  Filter by:
                </div>

                {/* Course filter */}
                <select
                  value={reviewCourseFilter}
                  onChange={(e) => setReviewCourseFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none ${isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'}`}
                >
                  <option value="all">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>

                {/* Star filter pills */}
                <div className="flex items-center gap-1">
                  {[0, 5, 4, 3, 2, 1].map((s) => (
                    <button
                      key={s}
                      onClick={() => setReviewStarFilter(s)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition flex items-center gap-1 ${
                        reviewStarFilter === s
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : isLight ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {s === 0 ? 'All Stars' : (
                        <>
                          {s}
                          <Star className="w-2.5 h-2.5 fill-current" />
                        </>
                      )}
                    </button>
                  ))}
                </div>

                {(reviewCourseFilter !== 'all' || reviewStarFilter !== 0) && (
                  <button
                    onClick={() => { setReviewCourseFilter('all'); setReviewStarFilter(0); }}
                    className="text-xs font-bold text-zinc-400 hover:text-black dark:hover:text-white transition underline underline-offset-2"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* Reviews Table / Cards */}
              {filteredReviews.length === 0 ? (
                <div className={`p-12 rounded-3xl border text-center space-y-3 ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
                  <MessageSquare className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                  <p className="text-sm text-zinc-500 font-medium">
                    {totalReviews === 0 ? 'No reviews yet. Students will leave feedback after completing your courses.' : 'No reviews match the selected filters.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => {
                    const relatedCourse = courses.find((c) => c.id === review.course_id);
                    return (
                      <div
                        key={review.id}
                        className={`p-5 rounded-2xl border space-y-3 transition ${isLight ? 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                      >
                        {/* Review Header Row */}
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            {/* Student Avatar */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shrink-0">
                              {review.student_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-sm">{review.student_name}</span>
                                {review.student_email && (
                                  <span className="text-[11px] text-zinc-400 font-mono">{review.student_email}</span>
                                )}
                                {review.is_verified_purchase && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    Verified Enroll
                                  </span>
                                )}
                              </div>
                              {/* Stars + Date */}
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`} />
                                  ))}
                                </div>
                                <span className="text-[10px] font-mono text-zinc-400">
                                  {new Date(review.updated_at || review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Course pill */}
                          {relatedCourse && (
                            <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider max-w-[200px] truncate ${isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-600' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}>
                              {relatedCourse.title}
                            </div>
                          )}
                        </div>

                        {/* Review Content */}
                        {review.title && (
                          <p className="font-bold text-sm">{review.title}</p>
                        )}
                        {review.body && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-l-2 border-zinc-200 dark:border-zinc-700 pl-3">
                            {review.body}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* TAB 8: SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (() => {
          return <InstructorSettingsTab user={user} isLight={isLight} showToast={showToast} />;
        })()}

        {/* ========================================================================= */}
        {/* TAB 9: PROFILE */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (() => {
          return <InstructorProfileTab user={user} isLight={isLight} showToast={showToast} />;
        })()}

      </main>

      {/* 🚀 FLOATING ACTION BUTTON (FAB) FOR CREATE COURSE */}
      {/* Desktop Version: Full pill button with label */}
      <div className="hidden md:block fixed bottom-8 right-8 z-30">
        <button
          type="button"
          onClick={() => setShowMethodModal(true)}
          className={`group flex items-center space-x-2.5 px-5 py-3.5 rounded-full border shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ${
            isLight
              ? 'bg-black hover:bg-zinc-800 text-white border-zinc-700 shadow-black/25'
              : 'bg-white hover:bg-zinc-100 text-black border-zinc-300 shadow-white/10'
          }`}
          title="Create New Course"
          aria-label="Create New Course"
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:rotate-90 duration-300 ${
            isLight ? 'bg-white text-black' : 'bg-black text-white'
          }`}>
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-xs font-black font-sans tracking-wide uppercase">
            Create Course
          </span>
        </button>
      </div>

      {/* Mobile Version: ONLY PLUS button elevated safely above bottom nav without any text */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => setShowMethodModal(true)}
          className={`w-12 h-12 rounded-full border shadow-2xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
            isLight
              ? 'bg-black text-white border-zinc-700 shadow-black/30'
              : 'bg-white text-black border-zinc-300 shadow-white/20'
          }`}
          title="Create New Course"
          aria-label="Create New Course"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}

export default function InstructorDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <InstructorDashboardContent />
    </Suspense>
  );
}
