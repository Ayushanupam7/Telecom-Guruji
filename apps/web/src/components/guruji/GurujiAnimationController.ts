import { GurujiAvatarState, GurujiGesture, GurujiViseme } from '@signalhub/types';

export interface GurujiAnimationState {
  state: GurujiAvatarState;
  viseme: GurujiViseme;
  gesture: GurujiGesture;
  lookDirection: 'center' | 'left_slide' | 'audience';
  blinkState: 'open' | 'half' | 'closed';
  walkProgress: number; // 0 to 1
  bodyBob: number;
  armSwing: number;
  legSwing: number;
}

export type AnimationCallback = (state: GurujiAnimationState) => void;

export class GurujiAnimationController {
  private currentState: GurujiAvatarState = 'idle';
  private currentViseme: GurujiViseme = 'rest';
  private currentGesture: GurujiGesture = 'none';
  private lookDirection: 'center' | 'left_slide' | 'audience' = 'left_slide';
  private blinkState: 'open' | 'half' | 'closed' = 'open';

  private walkProgress = 0;
  private animationFrameId: number | null = null;
  private lastTimestamp = 0;
  private blinkTimer = 0;
  private nextBlinkInterval = 3000;
  private isBlinking = false;
  private blinkProgress = 0;

  private gestureTimer = 0;
  private nextGestureInterval = 5000;

  private listeners: Set<AnimationCallback> = new Set();

  constructor() {
    this.nextBlinkInterval = 2500 + Math.random() * 3000;
  }

  public subscribe(cb: AnimationCallback): () => void {
    this.listeners.add(cb);
    cb(this.getSnapshot());
    return () => this.listeners.delete(cb);
  }

  public setState(state: GurujiAvatarState) {
    if (this.currentState === state) return;
    this.currentState = state;

    if (state === 'walking' || state === 'exiting') {
      this.lookDirection = state === 'walking' ? 'left_slide' : 'audience';
    } else if (state === 'speaking') {
      this.lookDirection = 'left_slide';
    } else if (state === 'listening') {
      this.lookDirection = 'audience';
      this.currentGesture = 'nod';
    } else if (state === 'thinking') {
      this.lookDirection = 'center';
      this.currentViseme = 'rest';
    } else if (state === 'idle') {
      this.currentViseme = 'rest';
      this.currentGesture = 'none';
    }

    this.notify();
  }

  public setViseme(viseme: GurujiViseme) {
    if (this.currentViseme === viseme) return;
    this.currentViseme = viseme;
    this.notify();
  }

  public setGesture(gesture: GurujiGesture) {
    this.currentGesture = gesture;
    this.notify();
  }

  public setLookDirection(dir: 'center' | 'left_slide' | 'audience') {
    this.lookDirection = dir;
    this.notify();
  }

  public startLoop() {
    if (this.animationFrameId !== null) return;
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  public stopLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (timestamp: number) => {
    const delta = Math.min(timestamp - this.lastTimestamp, 100);
    this.lastTimestamp = timestamp;

    this.update(delta);
    this.notify();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(delta: number) {
    // 1. Walking cycle
    if (this.currentState === 'walking' || this.currentState === 'exiting') {
      this.walkProgress = (this.walkProgress + delta * 0.003) % (Math.PI * 2);
    } else {
      this.walkProgress = 0;
    }

    // 2. Natural Eye Blinking Logic
    this.blinkTimer += delta;
    if (!this.isBlinking && this.blinkTimer >= this.nextBlinkInterval) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      this.blinkTimer = 0;
      this.nextBlinkInterval = 2500 + Math.random() * 4000;
    }

    if (this.isBlinking) {
      this.blinkProgress += delta;
      if (this.blinkProgress < 50) {
        this.blinkState = 'half';
      } else if (this.blinkProgress < 140) {
        this.blinkState = 'closed';
      } else if (this.blinkProgress < 200) {
        this.blinkState = 'half';
      } else {
        this.blinkState = 'open';
        this.isBlinking = false;
      }
    }

    // 3. Subtle Periodic Gestures during Speaking
    if (this.currentState === 'speaking') {
      this.gestureTimer += delta;
      if (this.gestureTimer >= this.nextGestureInterval) {
        this.gestureTimer = 0;
        this.nextGestureInterval = 4000 + Math.random() * 5000;

        const gestures: GurujiGesture[] = ['point_slide', 'open_hand', 'emphasis', 'nod'];
        const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
        this.currentGesture = randomGesture;

        // Reset gesture after 2.5 seconds
        setTimeout(() => {
          if (this.currentState === 'speaking') {
            this.currentGesture = 'none';
            this.notify();
          }
        }, 2200);
      }
    } else {
      this.gestureTimer = 0;
    }
  }

  private notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((cb) => cb(snapshot));
  }

  public getSnapshot(): GurujiAnimationState {
    const isWalking = this.currentState === 'walking' || this.currentState === 'exiting';
    const legSwing = isWalking ? Math.sin(this.walkProgress * 4) * 22 : 0;
    const armSwing = isWalking ? -Math.sin(this.walkProgress * 4) * 20 : 0;
    const bodyBob = isWalking ? Math.abs(Math.cos(this.walkProgress * 4)) * 6 : 0;

    return {
      state: this.currentState,
      viseme: this.currentViseme,
      gesture: this.currentGesture,
      lookDirection: this.lookDirection,
      blinkState: this.blinkState,
      walkProgress: this.walkProgress,
      bodyBob,
      armSwing,
      legSwing,
    };
  }
}
