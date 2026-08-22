import { GurujiLipSync } from './GurujiLipSync';
import { GurujiVoiceSettings } from '@signalhub/types';

export interface SpeechEngineCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (err: string) => void;
  onListeningResult?: (transcript: string) => void;
  onListeningStateChange?: (isListening: boolean) => void;
}

export class GurujiSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;
  private lipSync: GurujiLipSync;
  private callbacks: SpeechEngineCallbacks = {};
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking = false;
  private isPaused = false;
  private isListening = false;
  private lastSpokenText = '';
  private settings: GurujiVoiceSettings = {
    language: 'en',
    voiceId: '',
    speed: 1.0,
    volume: 1.0,
    autoSpeak: true,
  };

  constructor(lipSync: GurujiLipSync, callbacks: SpeechEngineCallbacks = {}) {
    this.lipSync = lipSync;
    this.callbacks = callbacks;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }

    // Initialize Web Speech STT (Microphone)
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.setupRecognition();
      }
    }
  }

  public updateSettings(settings: Partial<GurujiVoiceSettings>) {
    this.settings = { ...this.settings, ...settings };
    if (this.recognition) {
      if (this.settings.language === 'hi') {
        this.recognition.lang = 'hi-IN';
      } else if (this.settings.language === 'hinglish') {
        this.recognition.lang = 'en-IN';
      } else {
        this.recognition.lang = 'en-US';
      }
    }
  }

  public getSettings(): GurujiVoiceSettings {
    return this.settings;
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getAvailableVoices(): Array<{ id: string; name: string; lang: string; isIndian: boolean }> {
    if (!this.synth && typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      this.voices = this.synth?.getVoices() || [];
    }

    return this.voices.map((v) => ({
      id: v.voiceURI || v.name,
      name: v.name,
      lang: v.lang,
      isIndian: v.lang.includes('IN') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('hindi'),
    }));
  }

  private selectBestVoice(lang: 'en' | 'hi' | 'hinglish'): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    // 1. If explicit voice ID specified by user
    if (this.settings.voiceId) {
      const match = this.voices.find((v) => v.voiceURI === this.settings.voiceId || v.name === this.settings.voiceId);
      if (match) return match;
    }

    // 2. Language-specific matching
    if (lang === 'hi') {
      const hindiVoice = this.voices.find((v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (hindiVoice) return hindiVoice;
    }

    // 3. Indian English / Hinglish matching
    if (lang === 'hinglish' || lang === 'en') {
      const indianEnVoice = this.voices.find(
        (v) =>
          v.lang === 'en-IN' ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('prabhat') ||
          v.name.toLowerCase().includes('ravi')
      );
      if (indianEnVoice) return indianEnVoice;
    }

    // 4. Natural English Male/Teacher voices
    const maleVoice = this.voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('guy') ||
          v.name.toLowerCase().includes('george') ||
          v.name.toLowerCase().includes('male'))
    );
    if (maleVoice) return maleVoice;

    // 5. Fallback first English or default
    return this.voices.find((v) => v.lang.startsWith('en')) || this.voices[0] || null;
  }

  public speak(text: string, overrideLang?: 'en' | 'hi' | 'hinglish') {
    if (!text || !text.trim()) return;

    this.stop();
    this.lastSpokenText = text;

    const langToUse = overrideLang || this.settings.language || 'en';

    const cleanedText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    if (!this.synth) {
      // Fallback: simulate visual mouth movements if browser TTS unavailable
      this.isSpeaking = true;
      this.lipSync.startSpeechSync(cleanedText, this.settings.speed);
      this.callbacks.onStart?.();
      const readingDuration = Math.min(12000, Math.max(3000, cleanedText.split(' ').length * 300));
      setTimeout(() => {
        this.stop();
      }, readingDuration);
      return;
    }

    try {

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      this.currentUtterance = utterance;

      const voice = this.selectBestVoice(langToUse);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = Math.max(0.5, Math.min(2.0, this.settings.speed));
      utterance.volume = Math.max(0, Math.min(1.0, this.settings.volume));
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.isPaused = false;
        this.lipSync.startSpeechSync(cleanedText, this.settings.speed);
        this.callbacks.onStart?.();
      };

      // Boundary event for accurate viseme lip sync
      utterance.onboundary = (event) => {
        if (event.name === 'word' || typeof event.charIndex === 'number') {
          this.lipSync.syncToCharIndex(event.charIndex);
        }
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.isPaused = false;
        this.lipSync.stop();
        this.callbacks.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.isSpeaking = false;
        this.isPaused = false;
        this.lipSync.stop();
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          this.callbacks.onError?.(`Audio playback issue: ${e.error}`);
        }
      };

      this.synth.cancel(); // Cancel any pending speech
      this.synth.speak(utterance);
    } catch (err: any) {
      console.error('TTS execution failure:', err);
      this.isSpeaking = false;
      this.lipSync.stop();
      this.callbacks.onError?.(err.message || 'Speech execution error');
    }
  }

  public pause() {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.lipSync.stop();
      this.callbacks.onPause?.();
    }
  }

  public resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.lipSync.startSpeechSync(this.lastSpokenText, this.settings.speed);
      this.callbacks.onResume?.();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.lipSync.stop();
    this.callbacks.onEnd?.();
  }

  public replay() {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText);
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  // ==========================================
  // SPEECH-TO-TEXT (MICROPHONE RECOGNITION)
  // ==========================================
  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks.onListeningStateChange?.(true);
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        this.callbacks.onListeningResult?.(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error:', event.error);
      this.isListening = false;
      this.callbacks.onListeningStateChange?.(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        this.callbacks.onError?.(`Microphone error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks.onListeningStateChange?.(false);
    };
  }

  public startListening() {
    // Interrupt any ongoing speaking
    this.stop();

    if (!this.recognition) {
      this.callbacks.onError?.('Microphone speech recognition is not supported in this browser.');
      return;
    }

    try {
      this.recognition.start();
    } catch (err: any) {
      // If already started, ignore or restart
      if (err.name !== 'InvalidStateError') {
        this.callbacks.onError?.(err.message || 'Could not access microphone');
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
      this.callbacks.onListeningStateChange?.(false);
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}
