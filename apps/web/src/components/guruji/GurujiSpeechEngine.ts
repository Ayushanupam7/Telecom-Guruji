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
  private currentAudio: HTMLAudioElement | null = null;
  private recognition: any = null;
  private lipSync: GurujiLipSync;
  private callbacks: SpeechEngineCallbacks = {};
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking = false;
  private isPaused = false;
  private isListening = false;
  private lastSpokenText = '';
  private keepAliveTimer: any = null;
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
      const recogMap: Record<string, string> = {
        hi: 'hi-IN',
        hinglish: 'en-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        en: 'en-IN',
      };
      this.recognition.lang = recogMap[this.settings.language] || 'en-IN';
    }
  }

  public getSettings(): GurujiVoiceSettings {
    return this.settings;
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  private isFemaleVoice(v: SpeechSynthesisVoice): boolean {
    const name = (v.name + ' ' + (v.voiceURI || '')).toLowerCase();
    return (
      name.includes('female') ||
      name.includes('kalpana') ||
      name.includes('zira') ||
      name.includes('jenny') ||
      name.includes('aria') ||
      name.includes('sonia') ||
      name.includes('neerja') ||
      name.includes('samantha') ||
      name.includes('victoria') ||
      name.includes('heera') ||
      name.includes('swara') ||
      name.includes('pallavi') ||
      name.includes('shruti') ||
      name.includes('kavya') ||
      name.includes('shreya') ||
      name.includes('priya') ||
      name.includes('anjali') ||
      name.includes('pooja') ||
      name.includes('deepa') ||
      name.includes('leila') ||
      name.includes('hazel') ||
      name.includes('susan') ||
      name.includes('karen') ||
      name.includes('catherine') ||
      name.includes('yara') ||
      name.includes('maya') ||
      name.includes('sunita') ||
      name.includes('veena') ||
      name.includes('aditi')
    );
  }

  private isMaleVoice(v: SpeechSynthesisVoice): boolean {
    if (this.isFemaleVoice(v)) return false;
    const name = (v.name + ' ' + (v.voiceURI || '')).toLowerCase();
    return (
      name.includes('male') ||
      name.includes('prabhat') ||
      name.includes('ravi') ||
      name.includes('hemant') ||
      name.includes('madhur') ||
      name.includes('david') ||
      name.includes('guy') ||
      name.includes('george') ||
      name.includes('mark') ||
      name.includes('ryan') ||
      name.includes('mohan') ||
      name.includes('valluvar') ||
      name.includes('gagan') ||
      name.includes('midhun') ||
      name.includes('bashkar') ||
      name.includes('manohar') ||
      name.includes('niranjan') ||
      name.includes('natural')
    );
  }

  public getAvailableVoices(): Array<{ id: string; name: string; lang: string; isIndian: boolean; isMale: boolean }> {
    if (!this.synth && typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      this.voices = this.synth?.getVoices() || [];
    }

    return this.voices
      .filter((v) => !this.isFemaleVoice(v))
      .map((v) => ({
        id: v.voiceURI || v.name,
        name: v.name,
        lang: v.lang,
        isIndian:
          v.lang.includes('IN') ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('tamil') ||
          v.name.toLowerCase().includes('telugu') ||
          v.name.toLowerCase().includes('kannada') ||
          v.name.toLowerCase().includes('malayalam') ||
          v.name.toLowerCase().includes('bengali') ||
          v.name.toLowerCase().includes('marathi') ||
          v.name.toLowerCase().includes('gujarati'),
        isMale: this.isMaleVoice(v),
      }));
  }

  private selectBestVoice(lang: string): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    // Filter out all female voices for Guruji
    const maleCandidateVoices = this.voices.filter((v) => !this.isFemaleVoice(v));

    // 1. If explicit voice ID specified by user and is not female
    if (this.settings.voiceId) {
      const match = maleCandidateVoices.find((v) => v.voiceURI === this.settings.voiceId || v.name === this.settings.voiceId);
      if (match) return match;
    }

    const lowerLang = (lang || 'en').toLowerCase();

    // 2. Hindi matching (strictly male: Hemant, Madhur, Prabhat, Ravi)
    if (lowerLang === 'hi') {
      const maleHindi = maleCandidateVoices.find(
        (v) => (v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')) && this.isMaleVoice(v)
      );
      if (maleHindi) return maleHindi;

      const nonFemaleHindi = maleCandidateVoices.find((v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (nonFemaleHindi) return nonFemaleHindi;
    }

    // 3. Regional Indian matching (strictly male)
    if (lowerLang === 'ta') {
      const v = maleCandidateVoices.find((v) => (v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil')) && !this.isFemaleVoice(v));
      if (v) return v;
    } else if (lowerLang === 'te') {
      const v = maleCandidateVoices.find((v) => (v.lang.startsWith('te') || v.name.toLowerCase().includes('telugu')) && !this.isFemaleVoice(v));
      if (v) return v;
    } else if (lowerLang === 'kn') {
      const v = maleCandidateVoices.find((v) => (v.lang.startsWith('kn') || v.name.toLowerCase().includes('kannada')) && !this.isFemaleVoice(v));
      if (v) return v;
    } else if (lowerLang === 'ml') {
      const v = maleCandidateVoices.find((v) => (v.lang.startsWith('ml') || v.name.toLowerCase().includes('malayalam')) && !this.isFemaleVoice(v));
      if (v) return v;
    } else if (lowerLang === 'bn') {
      const v = maleCandidateVoices.find((v) => (v.lang.startsWith('bn') || v.name.toLowerCase().includes('bengali')) && !this.isFemaleVoice(v));
      if (v) return v;
    } else if (lowerLang === 'mr') {
      const v = maleCandidateVoices.find((v) => (v.lang.startsWith('mr') || v.name.toLowerCase().includes('marathi')) && !this.isFemaleVoice(v));
      if (v) return v;
    } else if (lowerLang === 'gu') {
      const v = maleCandidateVoices.find((v) => (v.lang.startsWith('gu') || v.name.toLowerCase().includes('gujarati')) && !this.isFemaleVoice(v));
      if (v) return v;
    }

    // 4. Indian English / Hinglish matching (strictly male: Prabhat, Ravi, etc.)
    if (lowerLang === 'hinglish' || lowerLang === 'en') {
      const maleIndianEn = maleCandidateVoices.find(
        (v) =>
          (v.lang === 'en-IN' || v.name.toLowerCase().includes('india')) &&
          this.isMaleVoice(v)
      );
      if (maleIndianEn) return maleIndianEn;
    }

    // 5. Natural English Male/Teacher voices (David, Guy, George, Mark, Ryan)
    const maleEnglish = maleCandidateVoices.find(
      (v) => v.lang.startsWith('en') && this.isMaleVoice(v)
    );
    if (maleEnglish) return maleEnglish;

    // 6. Any other non-female English or matching voice
    return (
      maleCandidateVoices.find((v) => v.lang.startsWith(lowerLang)) ||
      maleCandidateVoices.find((v) => v.lang.startsWith('en')) ||
      maleCandidateVoices[0] ||
      null
    );
  }

  public speak(text: string, overrideLang?: string) {
    if (!text || !text.trim()) return;

    this.stop();
    this.lastSpokenText = text;

    const langToUse = overrideLang || this.settings.language || 'en';

    const cleanedText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    const voice = this.selectBestVoice(langToUse);
    const hasConfirmedMaleVoice = Boolean(voice && this.isMaleVoice(voice) && !this.isFemaleVoice(voice));

    // If client browser does not have an explicit confirmed MALE voice, route to Neural Male TTS stream!
    if (!hasConfirmedMaleVoice || !this.synth) {
      this.speakViaAudioStream(cleanedText, langToUse);
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      this.currentUtterance = utterance;

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        const langMap: Record<string, string> = {
          en: 'en-IN',
          hi: 'hi-IN',
          hinglish: 'en-IN',
          ta: 'ta-IN',
          te: 'te-IN',
          kn: 'kn-IN',
          ml: 'ml-IN',
          bn: 'bn-IN',
          mr: 'mr-IN',
          gu: 'gu-IN',
        };
        utterance.lang = langMap[langToUse] || 'en-IN';
      }

      utterance.rate = Math.max(0.5, Math.min(2.0, this.settings.speed));
      utterance.volume = Math.max(0, Math.min(1.0, this.settings.volume));
      // Confident, deep masculine professor pitch
      utterance.pitch = 0.9;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.isPaused = false;
        this.lipSync.startSpeechSync(cleanedText, this.settings.speed);
        this.callbacks.onStart?.();

        // Keepalive pulse to prevent Chrome TTS timeout on longer speeches
        if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = setInterval(() => {
          if (this.isSpeaking && !this.isPaused && this.synth) {
            this.synth.pause();
            this.synth.resume();
          } else {
            if (this.keepAliveTimer) {
              clearInterval(this.keepAliveTimer);
              this.keepAliveTimer = null;
            }
          }
        }, 9000);
      };

      // Boundary event for accurate viseme lip sync
      utterance.onboundary = (event) => {
        if (event.name === 'word' || typeof event.charIndex === 'number') {
          this.lipSync.syncToCharIndex(event.charIndex);
        }
      };

      utterance.onend = () => {
        if (this.keepAliveTimer) {
          clearInterval(this.keepAliveTimer);
          this.keepAliveTimer = null;
        }
        this.isSpeaking = false;
        this.isPaused = false;
        this.lipSync.stop();
        this.callbacks.onEnd?.();
      };

      utterance.onerror = (e) => {
        if (this.keepAliveTimer) {
          clearInterval(this.keepAliveTimer);
          this.keepAliveTimer = null;
        }
        console.warn('SpeechSynthesis local error, falling back to streaming TTS:', e);
        this.speakViaAudioStream(cleanedText, langToUse);
      };

      this.synth.cancel(); // Cancel any pending speech
      this.synth.speak(utterance);
    } catch (err: any) {
      if (this.keepAliveTimer) {
        clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = null;
      }
      console.warn('TTS execution fallback to stream:', err);
      this.speakViaAudioStream(cleanedText, langToUse);
    }
  }

  // Streaming audio playback for regional Indian languages without local browser voice packs
  private speakViaAudioStream(text: string, lang: string) {
    try {
      this.stop();
      this.lastSpokenText = text;

      const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`);
      this.currentAudio = audio;
      audio.playbackRate = Math.max(0.75, Math.min(1.5, this.settings.speed));
      audio.volume = Math.max(0, Math.min(1.0, this.settings.volume));

      audio.onplay = () => {
        this.isSpeaking = true;
        this.isPaused = false;
        this.lipSync.startSpeechSync(text, this.settings.speed);
        this.callbacks.onStart?.();
      };

      audio.onended = () => {
        this.isSpeaking = false;
        this.isPaused = false;
        this.lipSync.stop();
        this.callbacks.onEnd?.();
      };

      audio.onerror = (e) => {
        console.error('Audio stream playback failed:', e);
        this.isSpeaking = false;
        this.isPaused = false;
        this.lipSync.stop();
        this.callbacks.onError?.('Audio stream playback failed');
      };

      audio.play().catch((err) => {
        console.warn('Audio autoplay blocked by browser policy:', err);
        this.isSpeaking = false;
        this.lipSync.stop();
      });
    } catch (streamErr) {
      console.error('Error starting audio stream:', streamErr);
      this.isSpeaking = false;
      this.lipSync.stop();
    }
  }

  public pause() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.isPaused = true;
      this.lipSync.stop();
      this.callbacks.onPause?.();
    } else if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.lipSync.stop();
      this.callbacks.onPause?.();
    }
  }

  public resume() {
    if (this.currentAudio && this.isPaused) {
      this.currentAudio.play().catch(() => {});
      this.isPaused = false;
      this.lipSync.startSpeechSync(this.lastSpokenText, this.settings.speed);
      this.callbacks.onResume?.();
    } else if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.lipSync.startSpeechSync(this.lastSpokenText, this.settings.speed);
      this.callbacks.onResume?.();
    }
  }

  public stop() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
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
