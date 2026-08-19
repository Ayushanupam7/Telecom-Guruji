'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Cpu,
  Zap,
  ShieldCheck,
  Server,
  ArrowRight,
  Check,
  Lock,
  Layers
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { GROQ_MODELS, GEMINI_MODELS } from '@/lib/ai/aiService';
import { AIProviderType } from '@signalhub/types';

export function AIProviderSettingsTab() {
  const { showToast } = useToast();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Groq State
  const [groqKey, setGroqKey] = useState('');
  const [groqMaskedKey, setGroqMaskedKey] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [groqModel, setGroqModel] = useState('openai/gpt-oss-120b');
  const [groqStatus, setGroqStatus] = useState<'connected' | 'not_configured' | 'error'>('not_configured');
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestMsg, setGroqTestMsg] = useState('');

  // Gemini State
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiMaskedKey, setGeminiMaskedKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [geminiStatus, setGeminiStatus] = useState<'connected' | 'not_configured' | 'error'>('not_configured');
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestMsg, setGeminiTestMsg] = useState('');

  // Strategy State
  const [primaryProvider, setPrimaryProvider] = useState<AIProviderType>('groq');
  const [fallbackProvider, setFallbackProvider] = useState<AIProviderType>('gemini');

  // Load current settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/ai/settings');
        const data = await res.json();
        if (data.success && data.data) {
          const { groq, gemini, strategy } = data.data;
          setGroqMaskedKey(groq?.maskedKey || '');
          setGroqModel(groq?.model && groq.model !== 'llama-3.3-70b-versatile' ? groq.model : 'openai/gpt-oss-120b');
          setGroqStatus(groq?.status || 'not_configured');

          setGeminiMaskedKey(gemini?.maskedKey || '');
          setGeminiModel(gemini?.model || 'gemini-1.5-flash');
          setGeminiStatus(gemini?.status || 'not_configured');

          setPrimaryProvider(strategy?.primaryProvider || 'groq');
          setFallbackProvider(strategy?.fallbackProvider || 'gemini');
        }
      } catch (err: any) {
        console.error('Failed to load AI settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Test Groq Connection
  const handleTestGroq = async () => {
    try {
      setTestingGroq(true);
      setGroqTestMsg('');
      const res = await fetch('/api/ai/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'groq',
          apiKey: groqKey.trim() || undefined,
          model: groqModel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGroqStatus('connected');
        setGroqTestMsg(data.message);
        showToast({ type: 'success', title: 'Groq Connected', message: data.message });
      } else {
        setGroqStatus('error');
        setGroqTestMsg(data.message);
        showToast({ type: 'error', title: 'Groq Connection Failed', message: data.message });
      }
    } catch (err: any) {
      setGroqStatus('error');
      setGroqTestMsg(err.message);
      showToast({ type: 'error', title: 'Error Testing Groq', message: err.message });
    } finally {
      setTestingGroq(false);
    }
  };

  // Test Gemini Connection
  const handleTestGemini = async () => {
    try {
      setTestingGemini(true);
      setGeminiTestMsg('');
      const res = await fetch('/api/ai/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          apiKey: geminiKey.trim() || undefined,
          model: geminiModel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeminiStatus('connected');
        setGeminiTestMsg(data.message);
        showToast({ type: 'success', title: 'Gemini Connected', message: data.message });
      } else {
        setGeminiStatus('error');
        setGeminiTestMsg(data.message);
        showToast({ type: 'error', title: 'Gemini Connection Failed', message: data.message });
      }
    } catch (err: any) {
      setGeminiStatus('error');
      setGeminiTestMsg(err.message);
      showToast({ type: 'error', title: 'Error Testing Gemini', message: err.message });
    } finally {
      setTestingGemini(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const payload: any = {
        strategy: {
          primaryProvider,
          fallbackProvider: primaryProvider === 'groq' ? 'gemini' : 'groq',
        },
      };

      payload.groq = {
        model: groqModel,
        isEnabled: true,
      };
      if (groqKey.trim()) {
        payload.groq.apiKey = groqKey.trim();
      }

      payload.gemini = {
        model: geminiModel,
        isEnabled: true,
      };
      if (geminiKey.trim()) {
        payload.gemini.apiKey = geminiKey.trim();
      }

      const res = await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        if (data.data?.groq?.maskedKey) setGroqMaskedKey(data.data.groq.maskedKey);
        if (data.data?.gemini?.maskedKey) setGeminiMaskedKey(data.data.gemini.maskedKey);
        setGroqKey('');
        setGeminiKey('');
        showToast({
          type: 'success',
          title: 'Settings Saved',
          message: 'AI Provider settings updated securely on server.',
        });
      } else {
        showToast({ type: 'error', title: 'Save Failed', message: data.error || 'Could not save settings' });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Save Error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="p-2 rounded-lg bg-black/5 dark:bg-white/10 text-black dark:text-white border border-zinc-200 dark:border-zinc-800">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight font-sans">AI Providers & Engine Settings</h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Configure Groq and Google Gemini API keys with automatic failover for high-speed course generation.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-90 transition shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save AI Configuration'}</span>
        </button>
      </div>

      {/* Security Banner */}
      <div className={`p-4 rounded-xl border flex items-start space-x-3 ${isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-zinc-900 border-zinc-800 text-zinc-100'}`}>
        <Lock className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold">Enterprise API Key Security: </span>
          API keys are encrypted and executed strictly server-side via <code className="font-mono px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">/api/ai/*</code> routes. Raw secrets are never sent to or stored in client browsers.
        </div>
      </div>

      {/* AI Strategy Selector */}
      <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-black dark:text-white" />
          <h3 className="text-lg font-bold">AI Provider Routing Strategy</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Primary AI Provider (Default)
            </label>
            <select
              value={primaryProvider}
              onChange={(e) => {
                const val = e.target.value as AIProviderType;
                setPrimaryProvider(val);
                setFallbackProvider(val === 'groq' ? 'gemini' : 'groq');
              }}
              className={`w-full px-4 py-3 rounded-xl border font-bold text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'}`}
            >
              <option value="groq">Groq (Ultra-Fast LPU Inference) — Primary</option>
              <option value="gemini">Google Gemini (Multimodal & Long Context) — Primary</option>
            </select>
            <p className="text-xs text-zinc-500 mt-1.5">
              All course generation and content commands will execute on this provider first.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Automatic Fallback Provider
            </label>
            <div className={`w-full px-4 py-3 rounded-xl border font-bold text-sm flex items-center justify-between ${isLight ? 'bg-zinc-100 border-zinc-300 text-zinc-700' : 'bg-zinc-900 border-zinc-800 text-zinc-300'}`}>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-black dark:bg-white"></span>
                <span>{primaryProvider === 'groq' ? 'Google Gemini' : 'Groq'} (Automatic)</span>
              </div>
              <span className="text-xs text-zinc-400 font-normal">Active on rate-limit/timeout</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1.5">
              If the primary provider encounters a timeout or quota limit, the request automatically falls back here.
            </p>
          </div>
        </div>
      </div>

      {/* Two Provider Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. GROQ PROVIDER CARD */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
          <div className="space-y-5">
            {/* Title & Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black">
                  G
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Groq LPU</h3>
                  <p className="text-xs text-zinc-500">Sub-second inference for Llama 3.3 & Mixtral</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${groqStatus === 'connected' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'}`}>
                <span className={`w-2 h-2 rounded-full ${groqStatus === 'connected' ? 'bg-white dark:bg-black animate-pulse' : 'bg-zinc-400'}`}></span>
                <span>{groqStatus === 'connected' ? 'Connected' : 'Not Configured'}</span>
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Groq API Key
                </label>
                {groqMaskedKey && (
                  <span className="text-xs font-mono text-zinc-400">Current: {groqMaskedKey}</span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  placeholder={groqMaskedKey ? 'Enter new key to replace...' : 'gsk_...'}
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className={`w-full pr-24 pl-4 py-2.5 rounded-xl border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showGroqKey ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Active Groq Model
              </label>
              <select
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'}`}
              >
                {GROQ_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Result Message */}
            {groqTestMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${groqStatus === 'connected' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'}`}>
                {groqStatus === 'connected' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{groqTestMsg}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <button
              onClick={handleTestGroq}
              disabled={testingGroq}
              className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${isLight ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-800' : 'border-zinc-700 hover:bg-zinc-800 text-zinc-200'}`}
            >
              {testingGroq ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
              <span>{testingGroq ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
            >
              Save Groq Settings
            </button>
          </div>
        </div>

        {/* 2. GOOGLE GEMINI PROVIDER CARD */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-950 border-zinc-800'}`}>
          <div className="space-y-5">
            {/* Title & Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black">
                  ✦
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Google Gemini</h3>
                  <p className="text-xs text-zinc-500">Advanced reasoning & large document context</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${geminiStatus === 'connected' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'}`}>
                <span className={`w-2 h-2 rounded-full ${geminiStatus === 'connected' ? 'bg-white dark:bg-black animate-pulse' : 'bg-zinc-400'}`}></span>
                <span>{geminiStatus === 'connected' ? 'Connected' : 'Not Configured'}</span>
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Gemini API Key
                </label>
                {geminiMaskedKey && (
                  <span className="text-xs font-mono text-zinc-400">Current: {geminiMaskedKey}</span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  placeholder={geminiMaskedKey ? 'Enter new key to replace...' : 'AIzaSy... / AQ...'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className={`w-full pr-24 pl-4 py-2.5 rounded-xl border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showGeminiKey ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Active Gemini Model
              </label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'}`}
              >
                {GEMINI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Result Message */}
            {geminiTestMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${geminiStatus === 'connected' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'}`}>
                {geminiStatus === 'connected' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{geminiTestMsg}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <button
              onClick={handleTestGemini}
              disabled={testingGemini}
              className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${isLight ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-800' : 'border-zinc-700 hover:bg-zinc-800 text-zinc-200'}`}
            >
              {testingGemini ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
              <span>{testingGemini ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
            >
              Save Gemini Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
