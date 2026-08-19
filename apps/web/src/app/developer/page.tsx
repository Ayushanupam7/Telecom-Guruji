'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Code2, Lock, Key, User, ShieldCheck, Check, Copy, RefreshCw, 
  Terminal, Database, Send, Sparkles, LogOut, Eye, EyeOff, CheckCircle2, AlertCircle, Signal, Zap, QrCode, ArrowRight, BookOpen
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { supabaseAdmin } from '@/lib/supabase';
import { formatCoursePrice } from '@/lib/currency';
import { PageLoader } from '@/components/PageLoader';

export default function DeveloperPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const isLight = theme === 'light';

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Developer Dashboard State
  const [apiKey, setApiKey] = useState('sh_live_948293849102938491');
  const [webhookSecret, setWebhookSecret] = useState('signalhub_webhook_secret_key');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [testPayloadLoading, setTestPayloadLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Course Access & QR Payment Studio State
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const upiVpa = 'signalhub@upi';

  // DB Stats
  const [stats, setStats] = useState({
    courses: 0,
    enrollments: 0,
    progress: 0,
    quizzes: 0,
    totalRevenue: 0,
  });

  // Check saved developer session
  useEffect(() => {
    const savedDev = localStorage.getItem('signalhub_dev_session');
    if (savedDev) {
      setIsAuthenticated(true);
      setUsername(savedDev);
      fetchLiveDatabaseStats();
      fetchCoursesList();
    }
  }, []);

  const fetchCoursesList = async () => {
    try {
      const { data } = await supabaseAdmin
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setCoursesList(data);
        setSelectedCourseId(data[0].id);
      }
    } catch (e) {
      console.log('Fetch courses list note:', e);
    }
  };

  const fetchLiveDatabaseStats = async (isManualClick = false) => {
    if (isManualClick) setRefreshing(true);
    const startTime = performance.now();
    try {
      const [cRes, eRes, pRes, qRes] = await Promise.all([
        supabaseAdmin.from('courses').select('id, price', { count: 'exact' }),
        supabaseAdmin.from('enrollments').select('amount_paid'),
        supabaseAdmin.from('progress').select('id', { count: 'exact' }),
        supabaseAdmin.from('quiz_attempts').select('id', { count: 'exact' }),
      ]);

      const coursesPriceSum = (cRes.data || []).reduce((acc: number, item: any) => acc + (Number(item.price) || 0), 0);
      const enrollmentsRevSum = (eRes.data || []).reduce((acc: number, item: any) => acc + (Number(item.amount_paid) || 0), 0);

      const totalRev = enrollmentsRevSum > 0 ? enrollmentsRevSum + coursesPriceSum : coursesPriceSum;

      setStats({
        courses: cRes.count || (cRes.data ? cRes.data.length : 0),
        enrollments: eRes.data ? eRes.data.length : 0,
        progress: pRes.count || 0,
        quizzes: qRes.count || 0,
        totalRevenue: totalRev,
      });

      if (isManualClick) {
        const latency = Math.round(performance.now() - startTime);
        showToast({
          type: 'success',
          title: 'Supabase DB Live & Synced! ⚡',
          message: `Cloud Database pinged in ${latency}ms. Verified ${cRes.data?.length || 0} courses, ${eRes.data?.length || 0} enrollments, and ${pRes.count || 0} progress records!`,
        });
      }
    } catch (e: any) {
      console.log('Stats fetch note:', e);
      if (isManualClick) {
        showToast({
          type: 'error',
          title: 'Database Ping Error ❌',
          message: `Failed to connect to Supabase: ${e?.message || 'Connection error'}`,
        });
      }
    } finally {
      if (isManualClick) setRefreshing(false);
    }
  };

  const handleDeveloperLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setAuthError('Please enter both developer username and password.');
      return;
    }

    if ((cleanUsername === 'dev' || cleanUsername === 'admin' || cleanUsername.includes('dev')) && cleanPassword.length >= 3) {
      setIsAuthenticated(true);
      if (rememberMe) {
        localStorage.setItem('signalhub_dev_session', cleanUsername);
      }
      showToast({
        type: 'success',
        title: 'Developer Auth Granted 🚀',
        message: `Authenticated as "${cleanUsername}". Accessing Developer Studio.`,
      });
      fetchLiveDatabaseStats();
      fetchCoursesList();
    } else if (cleanPassword === 'dev123' || cleanPassword === 'admin123') {
      setIsAuthenticated(true);
      if (rememberMe) {
        localStorage.setItem('signalhub_dev_session', cleanUsername);
      }
      showToast({
        type: 'success',
        title: 'Developer Auth Granted 🚀',
        message: `Authenticated as "${cleanUsername}". Accessing Developer Studio.`,
      });
      fetchLiveDatabaseStats();
      fetchCoursesList();
    } else {
      setAuthError('Invalid developer username or password. (Demo: dev / dev123)');
    }
  };

  const handleQuickDemoLogin = () => {
    setUsername('dev');
    setPassword('dev123');
    setIsAuthenticated(true);
    localStorage.setItem('signalhub_dev_session', 'dev');
    showToast({
      type: 'success',
      title: 'Demo Developer Auth Granted 🚀',
      message: 'Logged in as "dev". Full API & Webhook tools unlocked.',
    });
    fetchLiveDatabaseStats();
    fetchCoursesList();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('signalhub_dev_session');
    showToast({
      type: 'info',
      title: 'Developer Signed Out',
      message: 'Developer session closed.',
    });
  };

  const handleRegenerateApiKey = () => {
    const newKey = `sh_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newKey);
    showToast({
      type: 'success',
      title: 'API Key Regenerated 🔑',
      message: 'New live API key generated successfully.',
    });
  };

  const handleTestWebhook = async () => {
    setTestPayloadLoading(true);
    try {
      const res = await fetch('/api/webhooks/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'payment.captured',
          student_id: 'e1111111-1111-1111-1111-111111111111',
          course_id: selectedCourseId || 'd1111111-1111-1111-1111-111111111111',
          amount: 49,
          payment_id: `DEV_TEST_${Date.now()}`,
          utr: utrNumber || '987654321012',
        }),
      });

      const data = await res.json();
      showToast({
        type: 'success',
        title: 'Webhook Simulated ⚡',
        message: data.message || 'POST /api/webhooks/payment succeeded!',
      });
      fetchLiveDatabaseStats();
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Webhook Test Failed',
        message: e?.message || 'Failed to reach endpoint',
      });
    } finally {
      setTestPayloadLoading(false);
    }
  };

  // Proceed & Unlock Course, then Redirect to Explored Courses
  const handleProceedToExploredCourses = async () => {
    const courseObj = coursesList.find((c) => c.id === selectedCourseId) || coursesList[0];
    if (!courseObj) return;

    setProcessingPayment(true);

    try {
      // Upsert active enrollment in Supabase
      await supabaseAdmin.from('enrollments').upsert({
        student_id: 'e1111111-1111-1111-1111-111111111111',
        course_id: courseObj.id,
        status: 'active',
        payment_status: 'paid',
        amount_paid: courseObj.price || 49,
        payment_method: 'upi_qr',
        utr_number: utrNumber || 'DEV_UPI_987654321',
        student_name: 'Ansh Kumar',
        student_email: 'student@signalhub.app',
        enrolled_at: new Date().toISOString(),
      });

      showToast({
        type: 'success',
        title: 'UPI Payment Confirmed & Course Unlocked! 🎉',
        message: `Unlocked "${courseObj.title}". Redirecting to Explored Courses...`,
      });

      setTimeout(() => {
        router.push('/courses');
      }, 600);
    } catch (e) {
      console.log('Proceed unlock error:', e);
      router.push('/courses');
    } finally {
      setProcessingPayment(false);
    }
  };

  const selectedCourse = coursesList.find((c) => c.id === selectedCourseId) || coursesList[0];

  if (refreshing) {
    return (
      <PageLoader
        message="Testing Supabase Cloud Database & Schema Metrics..."
        submessage="Pinging database connection latency, checking table counts, and verifying schema health..."
      />
    );
  }

  // 1. UNAUTHENTICATED LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 font-sans">
        <div className={`max-w-md w-full p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 relative transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60' : 'glass-panel border-slate-800 bg-slate-900/90 text-white shadow-sky-950/30'
        }`}>
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-sky-500/25">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                SignalHub Developer Portal
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                API Authentication & Webhook Integration Studio
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleDeveloperLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Developer Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dev or admin"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-slate-950/70 border-slate-800 text-white focus:border-sky-500'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-slate-950/70 border-slate-800 text-white focus:border-sky-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <span>Remember session</span>
              </label>
              <span className="text-[11px] font-mono text-sky-500 font-bold">Demo: dev / dev123</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Key className="w-4 h-4" />
              <span>Authenticate Developer Session</span>
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
            <p className="text-[11px] text-slate-400">Want to test Developer Portal instantly?</p>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Demo Login (1-Click Autologin)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED DEVELOPER DASHBOARD
  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      {/* Top Header & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[11px] font-mono font-bold uppercase tracking-wider text-sky-500">
            <Code2 className="w-4 h-4" />
            <span>Developer Studio Portal</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-500 font-mono">Authenticated</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Developer Portal & API Tools
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fetchLiveDatabaseStats(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-sky-500 font-extrabold text-xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
            title="Ping Supabase DB & Refresh Stats"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Database Stats</span>
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-mono font-bold flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Developer: {username}</span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 text-xs font-extrabold transition-all flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Database Live Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'glass-panel border-slate-800 bg-slate-900/60'} space-y-1`}>
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Total Courses</span>
          <p className="text-xl sm:text-2xl font-black text-sky-500">{stats.courses}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'glass-panel border-slate-800 bg-slate-900/60'} space-y-1`}>
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Active Enrollments</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-500">{stats.enrollments}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'glass-panel border-slate-800 bg-slate-900/60'} space-y-1`}>
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Total Revenue</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">₹{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'glass-panel border-slate-800 bg-slate-900/60'} space-y-1`}>
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Student Progress</span>
          <p className="text-xl sm:text-2xl font-black text-indigo-500">{stats.progress}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'glass-panel border-slate-800 bg-slate-900/60'} space-y-1`}>
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Quiz Attempts</span>
          <p className="text-xl sm:text-2xl font-black text-amber-500">{stats.quizzes}</p>
        </div>
      </div>

      {/* COURSE ACCESS & LIVE QR PAYMENT STUDIO */}
      <div className={`p-6 rounded-3xl border space-y-5 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'glass-panel border-slate-800 bg-slate-900/80 shadow-lg'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold">Course Access & Live UPI QR Payment Studio</h2>
              <p className="text-xs text-slate-400">Select any course, view live QR payment, and proceed to Explored Courses</p>
            </div>
          </div>

          <Link
            href="/courses"
            className="px-3.5 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-xs hover:bg-sky-500/20 transition-all flex items-center space-x-1 self-start sm:self-auto"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Explored Courses Catalog →</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left: Course Selection & Details */}
          <div className="md:col-span-6 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400">Select Target Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:border-emerald-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              >
                {coursesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {formatCoursePrice(c.price, c.currency)}
                  </option>
                ))}
              </select>
            </div>

            {selectedCourse && (
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-mono font-bold uppercase border border-sky-500/20">
                    {selectedCourse.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-500">
                    {formatCoursePrice(selectedCourse.price, selectedCourse.currency)}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold">{selectedCourse.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{selectedCourse.summary || selectedCourse.description}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400">
                Optional UPI Reference / UTR No.
              </label>
              <input
                type="text"
                maxLength={12}
                placeholder="e.g. 423891029384"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* Right: Live UPI QR Code Payment Box & Hero Action */}
          <div className="md:col-span-6 space-y-4">
            <div className="p-4 rounded-2xl bg-white text-slate-900 border border-slate-200 text-center space-y-3 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-center space-x-1.5 text-[11px] font-mono font-bold text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Live UPI QR Code (GPay, PhonePe, Paytm, BHIM)</span>
              </div>

              {selectedCourse && (
                <div className="relative inline-block mx-auto bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      `upi://pay?pa=${upiVpa}&pn=SignalHub%20Learning&am=${selectedCourse.price}&cu=INR&tn=${encodeURIComponent(selectedCourse.title)}`
                    )}`}
                    alt="UPI QR Code Payment"
                    className="w-36 h-36 mx-auto rounded-xl"
                  />
                </div>
              )}

              {/* UPI VPA Copy Bar */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-mono border border-slate-200">
                <span>UPI ID: <strong className="text-slate-950 font-bold">{upiVpa}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(upiVpa);
                    setCopiedUpi(true);
                    setTimeout(() => setCopiedUpi(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-[10px] flex items-center space-x-1 shadow-sm transition-all"
                >
                  {copiedUpi ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUpi ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>
            </div>

            {/* HERO PROCEED BUTTON */}
            <button
              type="button"
              disabled={processingPayment}
              onClick={handleProceedToExploredCourses}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white font-extrabold text-xs shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
            >
              {processingPayment ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Unlocking Course & Navigating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Proceed & View Student Explored Courses 🚀</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* API Keys & Webhook Secret Management Card */}
      <div className={`p-6 rounded-3xl border space-y-5 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'glass-panel border-slate-800 bg-slate-900/80 shadow-lg'
      }`}>
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold">API Keys & Webhook Secret Credentials</h2>
            <p className="text-xs text-slate-400">Manage credentials for external system integrations & payment gateways</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Live API Key */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className="text-slate-400 font-bold block">LIVE API KEY</span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sky-500 truncate">{apiKey}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-500 text-white font-bold text-[10px] shrink-0 flex items-center space-x-1"
              >
                {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <button
              onClick={handleRegenerateApiKey}
              className="text-[10px] text-slate-400 hover:text-sky-500 font-bold flex items-center space-x-1 pt-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate Key</span>
            </button>
          </div>

          {/* Webhook Secret */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className="text-slate-400 font-bold block">PAYMENT WEBHOOK SECRET</span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-emerald-500 truncate">{webhookSecret}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(webhookSecret);
                  setCopiedSecret(true);
                  setTimeout(() => setCopiedSecret(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[10px] shrink-0 flex items-center space-x-1"
              >
                {copiedSecret ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <button
              onClick={handleTestWebhook}
              disabled={testPayloadLoading}
              className="text-[10px] text-slate-400 hover:text-emerald-500 font-bold flex items-center space-x-1 pt-1"
            >
              <Send className="w-3 h-3" />
              <span>{testPayloadLoading ? 'Testing...' : 'Test Webhook Endpoint'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Webhook Documentation & Code Snippet */}
      <div className={`p-6 rounded-3xl border space-y-4 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'glass-panel border-slate-800 bg-slate-900/80 shadow-lg'
      }`}>
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold">Payment Gateway Webhook Specification</h2>
            <p className="text-xs text-slate-400">HTTP POST `/api/webhooks/payment` for automatic enrollment processing</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto space-y-2 border border-slate-800">
          <p className="text-slate-400">// Sample cURL Webhook Request</p>
          <pre className="text-emerald-400">
{`curl -X POST http://localhost:3000/api/webhooks/payment \\
  -H "Content-Type: application/json" \\
  -H "x-razorpay-signature: <YOUR_HMAC_SIGNATURE>" \\
  -d '{
    "event": "payment.captured",
    "student_id": "STUDENT_UUID",
    "course_id": "COURSE_UUID",
    "amount": 49,
    "payment_id": "PAY_948201948",
    "utr": "423891029384"
  }'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
