'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
        theme_preference: theme,
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

export default function InstructorDashboardPage() {
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
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Fetch real courses and stats from Supabase
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
        .select('*');

      if (enrollErr) console.warn('Enrollment query issue:', enrollErr);

      const rawEnrollments = dbEnrollments || [];
      setEnrollments(rawEnrollments);

      // Map enrollments count by course
      const enrollmentCountByCourse: Record<string, number> = {};
      rawEnrollments.forEach((enr: any) => {
        if (enr.course_id) {
          enrollmentCountByCourse[enr.course_id] = (enrollmentCountByCourse[enr.course_id] || 0) + 1;
        }
      });

      // Total students count
      const totalEnrolled = rawEnrollments.length;
      setTotalStudents(totalEnrolled);

      // Calculate Total Revenue as SUM of amount_paid from all enrollment records
      // This reflects actual money received, not a theoretical calculation
      const calculatedRevenue = rawEnrollments.reduce((acc: number, enr: any) => {
        return acc + (Number(enr.amount_paid) || 0);
      }, 0);

      setTotalEarnings(calculatedRevenue);

      // 3. Fetch all reviews and compute live average rating
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
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            c.is_published
                              ? 'bg-black text-white dark:bg-white dark:text-black'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {c.is_published ? 'Live Published' : 'Draft'}
                        </span>
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
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          c.is_published
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-600'
                        }`}
                      >
                        {c.is_published ? 'Published' : 'Draft'}
                      </span>
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
                      className="flex-1 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs text-center hover:opacity-90 transition"
                    >
                      Continue Editing
                    </Link>

                    <Link
                      href={`/courses/${c.id}`}
                      className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-black dark:hover:text-white"
                      title="Preview Course"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleTogglePublish(c)}
                      className={`p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 ${c.is_published ? 'text-zinc-800 dark:text-zinc-200' : 'text-black dark:text-white font-bold'}`}
                      title={c.is_published ? 'Unpublish Course' : 'Publish Course Live'}
                    >
                      <Globe className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(c.id)}
                      className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500"
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
        {/* TAB 4: ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <h1 className="text-2xl font-black">Curriculum & Student Analytics</h1>
              <p className="text-xs text-zinc-500 mt-1">Real-time completion, quiz scores, and student drop-off metrics.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="text-xs font-bold uppercase text-zinc-400">Course Completion Rate</div>
                <div className="text-3xl font-black font-mono mt-2 text-black dark:text-white">76.4%</div>
                <p className="text-xs text-zinc-500 mt-1">Average across all telecom modules</p>
              </div>

              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="text-xs font-bold uppercase text-zinc-400">First-Time Quiz Pass Rate</div>
                <div className="text-3xl font-black font-mono mt-2 text-black dark:text-white">88.2%</div>
                <p className="text-xs text-zinc-500 mt-1">Average score threshold: 80%</p>
              </div>

              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="text-xs font-bold uppercase text-zinc-400">Certificates Awarded</div>
                <div className="text-3xl font-black font-mono mt-2 text-black dark:text-white">114</div>
                <p className="text-xs text-zinc-500 mt-1">Verified cryptographic credentials</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: STUDENTS */}
        {/* ========================================================================= */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <h1 className="text-2xl font-black">Enrolled Students Roster</h1>
              <p className="text-xs text-zinc-500 mt-1">Track individual learner progress, completion states, and quiz scores.</p>
            </div>

            <div className={`rounded-2xl border overflow-hidden ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-left font-bold uppercase tracking-wider">
                    <th className="p-4">Student</th>
                    <th className="p-4">Enrolled Course</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {[
                    { name: 'Student Learner', email: 'student@signalhub.app', course: 'Mobile Network Fundamentals', progress: '85%', status: 'Active' },
                    { name: 'Ananya Roy', email: 'ananya@telecom.org', course: '5G Service-Based Architecture', progress: '100%', status: 'Completed (Cert Awarded)' },
                    { name: 'Rajesh Nair', email: 'rajesh@cloud.net', course: 'Signal Processing & DSP Filters', progress: '45%', status: 'Active' },
                  ].map((s, idx) => (
                    <tr key={idx}>
                      <td className="p-4 font-bold">
                        <div>{s.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{s.email}</div>
                      </td>
                      <td className="p-4">{s.course}</td>
                      <td className="p-4 font-mono font-bold text-black dark:text-white">{s.progress}</td>
                      <td className="p-4 font-bold text-black dark:text-white">{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: EARNINGS */}
        {/* ========================================================================= */}
        {activeTab === 'earnings' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
                  Revenue & Earnings Breakdown
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                  Dynamic calculation based on total enrolled students multiplied by the price of each course.
                </p>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-mono font-black text-sm uppercase tracking-wider shadow-sm">
                Total Revenue: ₹{totalEarnings.toLocaleString()}
              </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-2 text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Gross Calculated Revenue</span>
                  <DollarSign className="w-4 h-4 text-black dark:text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-black dark:text-white">
                  ₹{totalEarnings.toLocaleString()}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                  Σ amount_paid per enrollment record
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-2 text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Enrolled Students</span>
                  <Users className="w-4 h-4 text-black dark:text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-black dark:text-white">
                  {totalStudents}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Across {courses.length} active courses
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-2 text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Average Revenue / Course</span>
                  <TrendingUp className="w-4 h-4 text-black dark:text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-black dark:text-white">
                  ₹{courses.length > 0 ? Math.round(totalEarnings / courses.length).toLocaleString() : 0}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Per authored course
                </p>
              </div>
            </div>

            {/* Course Revenue Breakdown Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black tracking-tight">Course Revenue Calculation Table</h2>
                <span className="text-xs text-zinc-400 font-mono">Formula: Students × Price = Total</span>
              </div>

              <div className={`rounded-2xl border overflow-hidden ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-left font-bold uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">
                      <th className="p-4">Course Name & Details</th>
                      <th className="p-4">Course Price</th>
                      <th className="p-4">Total Students Enrolled</th>
                      <th className="p-4">Calculation Formula</th>
                      <th className="p-4 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {courses.map((course) => {
                      const courseEnrollments = enrollments.filter((e) => e.course_id === course.id);
                      const count = courseEnrollments.length;
                      const price = Number(course.price) || 0;
                      // Use actual amount_paid from each enrollment (real revenue)
                      const subtotal = courseEnrollments.reduce((acc: number, e: any) => acc + (Number(e.amount_paid) || 0), 0);

                      return (
                        <tr key={course.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                          <td className="p-4 font-bold">
                            <div className="text-sm font-black text-black dark:text-white line-clamp-1">{course.title}</div>
                            <div className="text-[10px] font-mono text-zinc-400 uppercase mt-0.5">
                              {course.category || 'Telecom'} • {course.is_published ? 'Published' : 'Draft'}
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-black dark:text-white">
                            {price > 0 ? `₹${price.toLocaleString()}` : 'FREE (₹0)'}
                          </td>
                          <td className="p-4 font-mono font-bold text-black dark:text-white">
                            {count > 0 ? `${count} students` : 'No enrollments yet'}
                          </td>
                          <td className="p-4 font-mono text-zinc-500">
                            {count > 0 ? `Σ amount_paid = ₹${subtotal.toLocaleString()}` : '—'}
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
                      <td className="p-4 font-mono text-zinc-500 font-normal">Sum of (Students × Price)</td>
                      <td className="p-4 font-mono text-black dark:text-white text-right text-base">₹{totalEarnings.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

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
