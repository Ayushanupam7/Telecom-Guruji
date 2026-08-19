'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Signal, ShieldCheck, Cpu, GraduationCap, School, Lock, Mail, Eye, EyeOff, ArrowRight, Building2, KeyRound, Sparkles, X, Radio, Wifi, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@signalhub/types';
import { PageLoader } from '@/components/PageLoader';

export default function AuthPage() {
  const router = useRouter();
  const { loginWithCredentials, signUpUser, loginWithGoogle, loginWithSSO, resetPassword } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [activeLoginTab, setActiveLoginTab] = useState<'student' | 'instructor'>('student');

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('student@signalhub.app');
  const [signInPassword, setSignInPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up State
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpAge, setSignUpAge] = useState<number>(20);
  const [signUpRole, setSignUpRole] = useState<UserRole>('student');
  const [signUpLanguage, setSignUpLanguage] = useState('en');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  // SSO Drawer State
  const [showSSOModal, setShowSSOModal] = useState(false);
  const [ssoDomain, setSsoDomain] = useState('');

  // General Status
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // STRICT LIGHT MODE ENFORCEMENT & PREFETCH ON MOUNT
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'dark-mode');
      document.documentElement.classList.add('light', 'light-mode');
      document.body.classList.remove('dark', 'dark-mode');
      document.body.classList.add('light', 'light-mode');
    }
    try {
      router.prefetch('/student/dashboard');
      router.prefetch('/instructor/dashboard');
      router.prefetch('/admin/dashboard');
    } catch (e) {}
  }, [router]);

  // Handle Tab Switch (Student vs Instructor Preset)
  const handleSignInTabChange = (tab: 'student' | 'instructor') => {
    setActiveLoginTab(tab);
    if (tab === 'instructor') {
      setSignInEmail('instructor@signalhub.app');
      setSignInPassword('Password123!');
    } else {
      setSignInEmail('student@signalhub.app');
      setSignInPassword('Password123!');
    }
  };

  // Handle Credentials Sign In
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await loginWithCredentials(signInEmail, signInPassword);
      // Keep loading true while page transitions to avoid form flashing back
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  // Handle Sign Up Registration
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signUpEmail || !signUpPassword || !signUpFullName) {
      setErrorMsg('Please fill in all required registration fields.');
      return;
    }

    setLoading(true);

    try {
      await signUpUser({
        email: signUpEmail,
        password: signUpPassword,
        fullName: signUpFullName,
        age: signUpAge,
        role: signUpRole,
        language: signUpLanguage,
      });
      // Keep loading true while page transitions
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotSuccessMsg(`Password reset link sent to ${forgotEmail}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSSOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssoDomain) return;
    setLoading(true);
    try {
      await loginWithSSO(ssoDomain);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'SSO Authorization failed.');
    }
  };

  const handleGoogleLoginClick = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Google sign in failed.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 text-black flex items-center justify-center p-3 sm:p-6 font-sans relative overflow-y-auto">
      {/* 📡 HIGH-END TELECOM & AI GRAPHICS BACKGROUND LAYER 🌐 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
        {/* 1. Base Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-50 to-zinc-100" />

        {/* 2. Architectural Dot & Grid Matrix Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />

        {/* 3. Glowing Ambient Mesh Orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-black/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-black/10 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-zinc-200/50 blur-[120px]" />

        {/* 4. Telecom Waveform Signal SVG Line Overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20 text-black"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <path
            d="M-100 200 C 300 400, 600 0, 1200 300 C 1800 600, 2100 100, 2400 400"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="8 8"
          />
          <path
            d="M-100 500 C 400 200, 800 800, 1400 400 C 1900 100, 2200 700, 2500 300"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>

        {/* 5. Floating Telecom Graphic Node Pills */}
        <div className="absolute top-12 left-12 hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-white/90 border border-zinc-200 text-[10px] font-mono font-bold shadow-md backdrop-blur-md animate-bounce">
          <Radio className="w-3.5 h-3.5 text-black" />
          <span className="text-zinc-600">5G Core Network Node</span>
        </div>

        <div className="absolute bottom-16 left-20 hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-white/90 border border-zinc-200 text-[10px] font-mono font-bold shadow-md backdrop-blur-md">
          <Wifi className="w-3.5 h-3.5 text-black" />
          <span className="text-zinc-600">Optical Fiber Backbone • Active</span>
        </div>

        <div className="absolute top-20 right-16 hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-white/90 border border-zinc-200 text-[10px] font-mono font-bold shadow-md backdrop-blur-md">
          <Zap className="w-3.5 h-3.5 text-black" />
          <span className="text-zinc-600">High Frequency Carrier Wave</span>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center justify-center z-10 my-auto">
        
        {/* LEFT SIDE: COMPACT APP DETAILS (BLACK & WHITE) */}
        <div className="lg:col-span-5 space-y-4 text-left hidden lg:block pr-2">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <img
              src="/logo-light.png"
              alt="Telecom Guruji Logo"
              className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div>
              <span className="text-2xl font-black tracking-tight text-black">
                Telecom Guruji
              </span>
              <span className="block text-[9px] tracking-widest text-zinc-500 font-mono uppercase font-bold">
                EdTech Workspace
              </span>
            </div>
          </Link>

          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200 text-black text-[11px] font-mono font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>AI Verified Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-black">
              Verified Learning & Course Studio
            </h1>
            <p className="text-xs leading-relaxed text-zinc-600 font-medium">
              Video heartbeats, multi-currency course pricing, and verified certificates.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="p-3.5 rounded-2xl border border-zinc-200 bg-white shadow-sm flex items-center space-x-3 transition-all">
              <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 text-black flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-black" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-black text-black">
                  90% Video Watch Verification
                </h2>
                <p className="text-[10px] text-zinc-500 leading-none font-mono">
                  Prevents skimming & updates Database.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-zinc-200 bg-white shadow-sm flex items-center space-x-3 transition-all">
              <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 text-black flex items-center justify-center shrink-0 shadow-xs">
                <Cpu className="w-4 h-4 text-black" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-black text-black">
                  Supabase DB Realtime Sync
                </h2>
                <p className="text-[10px] text-zinc-500 leading-none font-mono">
                  Instant enrollment & gradebook updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: MONOCHROME BLACK & WHITE LOGIN CARD */}
        <div className="w-full lg:col-span-7 flex justify-center items-center">
          <div className="w-full max-w-[450px] p-5 sm:p-8 rounded-3xl border border-zinc-300 bg-white text-black shadow-2xl relative transition-all duration-300 mx-auto overflow-hidden">

            {/* In-Card Instant Loading & Transition Overlay (Spinner Only) */}
            {loading && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-[3px] border-zinc-200 border-t-black animate-spin" />
                  <div className="absolute w-6 h-6 rounded-full border-[3px] border-zinc-300 border-b-black animate-spin [animation-direction:reverse]" />
                </div>
              </div>
            )}

            {/* Card Header: Brand Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src="/logo-light.png"
                  alt="Telecom Guruji Logo"
                  className="h-12 w-auto object-contain"
                />
                <div>
                  <h2 className="text-base font-black tracking-tight text-black">
                    Telecom Guruji
                  </h2>
                  <p className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
                    Sign In Portal
                  </p>
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1 mb-4 text-left">
              <h1 className="text-xl font-black tracking-tight text-black">
                {authMode === 'signin' ? 'Sign in to workspace' : 'Create new account'}
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                {authMode === 'signin'
                  ? 'Enter credentials or use Google account'
                  : 'Fill in details to save to Supabase DB'}
              </p>
            </div>

            {/* Auth Form Container */}
            <div className="space-y-4">
              
              {/* MODE SWITCHER: SIGN IN vs CREATE ACCOUNT */}
              <div className="flex border-b border-zinc-200 pb-1 mb-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setAuthMode('signin')}
                  className={`pb-1.5 px-4 text-xs font-black transition-all border-b-2 ${
                    authMode === 'signin'
                      ? 'border-black text-black font-extrabold'
                      : 'border-transparent text-zinc-400 hover:text-black'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setAuthMode('signup')}
                  className={`pb-1.5 px-4 text-xs font-black transition-all border-b-2 ${
                    authMode === 'signup'
                      ? 'border-black text-black font-extrabold'
                      : 'border-transparent text-zinc-400 hover:text-black'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {authMode === 'signin' ? (
                <>
                  {/* ROLE CAPSULE PILL CONTROL (BLACK & WHITE) */}
                  <div className="p-1 rounded-2xl border border-zinc-200 bg-zinc-100 grid grid-cols-2 gap-1 mb-3">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSignInTabChange('student')}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                        activeLoginTab === 'student'
                          ? 'bg-black text-white shadow-md'
                          : 'text-zinc-600 hover:text-black'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Student</span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSignInTabChange('instructor')}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                        activeLoginTab === 'instructor'
                          ? 'bg-black text-white shadow-md'
                          : 'text-zinc-600 hover:text-black'
                      }`}
                    >
                      <School className="w-3.5 h-3.5" />
                      <span>Instructor</span>
                    </button>
                  </div>

                  <form onSubmit={handleSignInSubmit} className="space-y-3 text-left">
                    <div>
                      <label className="block text-[11px] font-bold mb-1 text-zinc-700">
                        Username or Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          disabled={loading}
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          placeholder="e.g. student, instructor, or email"
                          className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium focus:outline-none transition-colors border bg-zinc-50 border-zinc-300 text-black focus:border-black focus:ring-1 focus:ring-black disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-zinc-700">
                          Password
                        </label>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => setShowForgotModal(true)}
                          className="text-[10px] text-black font-extrabold hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          disabled={loading}
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-9 py-2 rounded-xl text-xs font-medium focus:outline-none transition-colors border bg-zinc-50 border-zinc-300 text-black focus:border-black focus:ring-1 focus:ring-black disabled:opacity-60"
                        />
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-zinc-400 hover:text-black"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-2xl bg-black hover:bg-zinc-800 disabled:bg-zinc-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      ) : (
                        <>
                          <span>Sign in as {activeLoginTab === 'student' ? 'Student' : 'Instructor'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* SSO & GOOGLE ALTERNATIVE SIGN IN OPTIONS */}
                  <div className="pt-3 border-t border-zinc-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleGoogleLoginClick}
                        className="py-2.5 px-2 rounded-xl border border-zinc-300 bg-white text-black hover:bg-zinc-50 disabled:opacity-60 text-[11px] sm:text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs disabled:cursor-not-allowed"
                      >
                        <GoogleIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Google Sign In</span>
                      </button>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => setShowSSOModal(true)}
                        className="py-2.5 px-2 rounded-xl border border-zinc-300 bg-white text-black hover:bg-zinc-50 disabled:opacity-60 text-[11px] sm:text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs disabled:cursor-not-allowed"
                      >
                        <Building2 className="w-3.5 h-3.5 text-black shrink-0" />
                        <span className="truncate">Enterprise SSO</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* REGISTRATION FORM (SIGN UP) */
                <form onSubmit={handleSignUpSubmit} className="space-y-2.5 text-left">
                  <div>
                    <label className="block text-[11px] font-bold mb-1 text-zinc-700">Full Name</label>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      placeholder="Ayush Kumar"
                      value={signUpFullName}
                      onChange={(e) => setSignUpFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-zinc-50 border-zinc-300 text-black focus:border-black focus:ring-1 focus:ring-black disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold mb-1 text-zinc-700">Email Address</label>
                    <input
                      type="email"
                      required
                      disabled={loading}
                      placeholder="ayush.kumar@gmail.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-zinc-50 border-zinc-300 text-black focus:border-black focus:ring-1 focus:ring-black disabled:opacity-60"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold mb-1 text-zinc-700">Password</label>
                      <input
                        type="password"
                        required
                        disabled={loading}
                        placeholder="••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs border bg-zinc-50 border-zinc-300 text-black focus:border-black focus:ring-1 focus:ring-black disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1 text-zinc-700">Account Type</label>
                      <select
                        disabled={loading}
                        value={signUpRole}
                        onChange={(e) => setSignUpRole(e.target.value as UserRole)}
                        className="w-full px-2 py-2 rounded-xl text-xs border bg-zinc-50 border-zinc-300 text-black focus:border-black focus:ring-1 focus:ring-black font-bold disabled:opacity-60"
                      >
                        <option value="student">Student Learner</option>
                        <option value="instructor">Course Instructor</option>
                      </select>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-black hover:bg-zinc-800 disabled:bg-zinc-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Save & Register Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="max-w-sm w-full p-6 rounded-3xl border border-zinc-300 bg-white text-black shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-black">Reset Password</h2>
                <p className="text-[10px] text-zinc-500 font-mono">Triggers Supabase password reset link</p>
              </div>
            </div>

            {forgotSuccessMsg ? (
              <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-300 text-black text-xs font-bold">
                {forgotSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1 text-zinc-700">Registered Email</label>
                  <input
                    type="email"
                    required
                    placeholder="student@signalhub.app"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs border bg-zinc-50 border-zinc-300 text-black focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="py-2.5 rounded-xl border border-zinc-300 text-black hover:bg-zinc-100 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 rounded-xl bg-black text-white text-xs font-extrabold hover:bg-zinc-800 shadow-md"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ENTERPRISE SSO MODAL */}
      {showSSOModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="max-w-sm w-full p-6 rounded-3xl border border-zinc-300 bg-white text-black shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowSSOModal(false)}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-black">Enterprise SSO Login</h2>
                <p className="text-[10px] text-zinc-500 font-mono">SAML / OAuth2 single sign-on</p>
              </div>
            </div>

            <form onSubmit={handleSSOSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold mb-1 text-zinc-700">Organization Domain</label>
                <input
                  type="text"
                  required
                  placeholder="university.edu or enterprise.com"
                  value={ssoDomain}
                  onChange={(e) => setSsoDomain(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs border bg-zinc-50 border-zinc-300 text-black focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowSSOModal(false)}
                  className="py-2.5 rounded-xl border border-zinc-300 text-black hover:bg-zinc-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 rounded-xl bg-black text-white text-xs font-extrabold hover:bg-zinc-800 shadow-md"
                >
                  SSO Redirect →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#000000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#000000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#000000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#000000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}
