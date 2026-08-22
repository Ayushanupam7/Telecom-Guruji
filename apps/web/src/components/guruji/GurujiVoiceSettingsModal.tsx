'use client';

import React, { useState, useEffect } from 'react';
import { X, Volume2, Globe, Gauge, Check, Sparkles, Sliders, Zap } from 'lucide-react';
import { GurujiVoiceSettings } from '@signalhub/types';

interface GurujiVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GurujiVoiceSettings;
  availableVoices: Array<{ id: string; name: string; lang: string; isIndian: boolean }>;
  onSave: (newSettings: GurujiVoiceSettings) => void;
  onTestVoice?: (text: string, lang: 'en' | 'hi' | 'hinglish') => void;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export function GurujiVoiceSettingsModal({
  isOpen,
  onClose,
  settings,
  availableVoices,
  onSave,
  onTestVoice,
}: GurujiVoiceSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<GurujiVoiceSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl border bg-zinc-950/95 text-white border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">Guruji Voice Settings</h3>
              <p className="text-[11px] text-zinc-400">Configure AI speech synthesis & language</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {/* 1. Language Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Teaching Language</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'en', label: 'English', desc: 'Global English' },
                { id: 'hinglish', label: 'Hinglish', desc: 'Hindi-English Mix' },
                { id: 'hi', label: 'हिन्दी', desc: 'Pure Hindi' },
              ].map((lang) => {
                const isSelected = localSettings.language === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() =>
                      setLocalSettings({ ...localSettings, language: lang.id as 'en' | 'hi' | 'hinglish' })
                    }
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/15 text-white ring-1 ring-sky-500'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold">{lang.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1">{lang.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Speaking Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center space-x-1.5">
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
                <span>Speaking Speed</span>
              </label>
              <span className="text-xs font-mono font-bold text-sky-400">{localSettings.speed}x</span>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {SPEED_OPTIONS.map((speed) => {
                const isSelected = localSettings.speed === speed;
                return (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, speed })}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition border ${
                      isSelected
                        ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Volume Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center space-x-1.5">
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Voice Volume</span>
              </label>
              <span className="text-xs font-mono font-bold text-zinc-400">
                {Math.round(localSettings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localSettings.volume}
              onChange={(e) => setLocalSettings({ ...localSettings, volume: parseFloat(e.target.value) })}
              className="w-full h-2 rounded-lg bg-zinc-800 accent-sky-500 cursor-pointer"
            />
          </div>

          {/* 4. Voice Selection (Detected Web Speech Voices) */}
          {availableVoices.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Preferred Speech Engine Voice</label>
              <select
                value={localSettings.voiceId}
                onChange={(e) => setLocalSettings({ ...localSettings, voiceId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-hidden focus:border-sky-500"
              >
                <option value="">Default Recommended Voice (Auto Match)</option>
                {availableVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.lang}) {v.isIndian ? '🇮🇳' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 5. Toggles (Auto Speak & Low-End Device Mode) */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            {/* Auto Speak Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-200">Auto-Explain on Slide Navigation</div>
                <div className="text-[10px] text-zinc-500">Automatically start speech when changing slides</div>
              </div>
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, autoSpeak: !localSettings.autoSpeak })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  localSettings.autoSpeak ? 'bg-sky-500' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    localSettings.autoSpeak ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Simplified Animations Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-200">Performance / Lite Mode</div>
                <div className="text-[10px] text-zinc-500">Simplified animations for low-end devices</div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    simplifiedAnimations: !localSettings.simplifiedAnimations,
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  localSettings.simplifiedAnimations ? 'bg-sky-500' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    localSettings.simplifiedAnimations ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-end space-x-2.5">
          {onTestVoice && (
            <button
              type="button"
              onClick={() => {
                const sampleText =
                  localSettings.language === 'hi'
                    ? 'नमस्ते! यह गुरुजी की आवाज का परीक्षण है।'
                    : localSettings.language === 'hinglish'
                    ? 'Namaste! Yeh Guruji ki voice ka audio test hai.'
                    : "Namaste! This is a test of Guruji's audio voice.";
                onTestVoice(sampleText, localSettings.language);
              }}
              className="px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition"
            >
              Test Voice 🔊
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition active:scale-95"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
