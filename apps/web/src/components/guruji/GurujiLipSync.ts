import { GurujiViseme } from '@signalhub/types';

interface TimedViseme {
  viseme: GurujiViseme;
  durationMs: number;
  charIndex?: number;
}

export class GurujiLipSync {
  private currentViseme: GurujiViseme = 'rest';
  private timeline: TimedViseme[] = [];
  private currentTimelineIdx = 0;
  private timer: any = null;
  private onVisemeChange?: (viseme: GurujiViseme) => void;
  private isRunning = false;
  private speedMultiplier = 1.0;

  constructor(onVisemeChange?: (viseme: GurujiViseme) => void) {
    this.onVisemeChange = onVisemeChange;
  }

  public setCallback(cb: (viseme: GurujiViseme) => void) {
    this.onVisemeChange = cb;
  }

  /**
   * Start synchronous timeline-driven lip sync for spoken text at given speed.
   */
  public startSpeechSync(text: string, speedMultiplier: number = 1.0) {
    this.stop();
    if (!text || !text.trim()) return;

    this.speedMultiplier = Math.max(0.5, Math.min(2.2, speedMultiplier));
    this.timeline = this.buildTimeline(text, this.speedMultiplier);
    this.currentTimelineIdx = 0;
    this.isRunning = true;
    this.executeNextFrame();
  }

  /**
   * Instant re-synchronization when SpeechSynthesis fires onboundary (word boundary).
   */
  public syncToCharIndex(charIndex: number) {
    if (!this.isRunning || this.timeline.length === 0) return;

    // Find the timeline frame matching or closest to this charIndex
    const foundIdx = this.timeline.findIndex(
      (frame) => frame.charIndex !== undefined && frame.charIndex >= charIndex - 2
    );

    if (foundIdx !== -1 && Math.abs(foundIdx - this.currentTimelineIdx) > 1) {
      if (this.timer) clearTimeout(this.timer);
      this.currentTimelineIdx = foundIdx;
      this.executeNextFrame();
    }
  }

  private executeNextFrame = () => {
    if (!this.isRunning) return;

    if (this.currentTimelineIdx >= this.timeline.length) {
      // Keep natural conversational mouth movement active continuously until speechEngine explicitly stops
      const fallbackVisemes: GurujiViseme[] = ['A', 'E', 'consonant', 'I', 'O', 'consonant', 'rest'];
      const nextV = fallbackVisemes[Math.floor(Math.random() * fallbackVisemes.length)];
      this.setViseme(nextV);
      this.timer = setTimeout(this.executeNextFrame, Math.round((75 + Math.random() * 50) / this.speedMultiplier));
      return;
    }

    const frame = this.timeline[this.currentTimelineIdx];
    this.setViseme(frame.viseme);

    this.currentTimelineIdx++;
    this.timer = setTimeout(this.executeNextFrame, frame.durationMs);
  };

  /**
   * Builds an exact timed sequence of phonetic mouth shapes synced to speech speed.
   */
  private buildTimeline(text: string, speedMultiplier: number): TimedViseme[] {
    const timeline: TimedViseme[] = [];
    const speed = Math.max(0.5, Math.min(2.2, speedMultiplier));

    // Base milliseconds per character (approx 52ms per char at 1.0x speed)
    const baseCharMs = 52 / speed;

    // Regex to split by words and punctuation
    const tokens = text.match(/[\w\d]+|[.,!?;:—\n]+/g) || [text];
    let runningCharIndex = 0;

    for (const token of tokens) {
      const isPunctuation = /^[.,!?;:—\n]+$/.test(token);

      if (isPunctuation) {
        // Pause at commas / sentence ends
        const pauseDuration = (token.includes('.') || token.includes('!') || token.includes('?'))
          ? Math.round(260 / speed)
          : Math.round(130 / speed);

        timeline.push({
          viseme: 'rest',
          durationMs: pauseDuration,
          charIndex: runningCharIndex,
        });
        runningCharIndex += token.length;
        continue;
      }

      // Word Token: extract phonetic viseme sequence
      const word = token.toLowerCase();
      const wordVisemes: GurujiViseme[] = [];

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (char === 'a') wordVisemes.push('A');
        else if (char === 'e') wordVisemes.push('E');
        else if (char === 'i' || char === 'y') wordVisemes.push('I');
        else if (char === 'o') wordVisemes.push('O');
        else if (char === 'u' || char === 'w') wordVisemes.push('U');
        else if ('bmp'.includes(char)) wordVisemes.push('rest');
        else wordVisemes.push('consonant');
      }

      // Filter consecutive identical visemes for cleaner motion
      const filtered: GurujiViseme[] = [];
      for (let i = 0; i < wordVisemes.length; i++) {
        if (i === 0 || wordVisemes[i] !== wordVisemes[i - 1]) {
          filtered.push(wordVisemes[i]);
        }
      }

      if (filtered.length === 0) filtered.push('A');

      // Calculate total word duration based on character count
      const wordDuration = Math.max(90 / speed, word.length * baseCharMs);
      const frameDuration = Math.max(35, Math.floor(wordDuration / filtered.length));

      filtered.forEach((v, idx) => {
        timeline.push({
          viseme: v,
          durationMs: frameDuration,
          charIndex: idx === 0 ? runningCharIndex : undefined,
        });
      });

      // Small 25ms breath/rest space between words
      timeline.push({
        viseme: 'rest',
        durationMs: Math.round(25 / speed),
      });

      runningCharIndex += token.length + 1;
    }

    return timeline;
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.timeline = [];
    this.currentTimelineIdx = 0;
    this.setViseme('rest');
  }

  private setViseme(v: GurujiViseme) {
    if (this.currentViseme === v) return;
    this.currentViseme = v;
    if (this.onVisemeChange) {
      this.onVisemeChange(v);
    }
  }

  public getCurrentViseme(): GurujiViseme {
    return this.currentViseme;
  }
}
