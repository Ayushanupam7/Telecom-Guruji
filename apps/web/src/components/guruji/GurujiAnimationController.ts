import {
  GurujiAvatarState,
  GurujiGesture,
  GurujiViseme,
} from '@signalhub/types';

export interface GurujiAnimationState {
  state: GurujiAvatarState;
  viseme: GurujiViseme;
  gesture: GurujiGesture;

  lookDirection: 'center' | 'left_slide' | 'audience';
  blinkState: 'open' | 'half' | 'closed';

  walkProgress: number;

  bodyBob: number;
  armSwing: number;
  legSwing: number;

  leftArmAngle: number;
  leftForearmAngle: number;

  rightArmAngle: number;
  rightForearmAngle: number;
}

export type AnimationCallback = (
  state: GurujiAnimationState
) => void;

export class GurujiAnimationController {
  // ============================================================
  // CORE STATE
  // ============================================================

  private currentState: GurujiAvatarState = 'idle';
  private currentViseme: GurujiViseme = 'rest';
  private currentGesture: GurujiGesture = 'none';

  private lookDirection:
    | 'center'
    | 'left_slide'
    | 'audience' = 'left_slide';

  private blinkState: 'open' | 'half' | 'closed' = 'open';

  // ============================================================
  // ANIMATION TIMING
  // ============================================================

  private animationFrameId: number | null = null;

  private lastTimestamp = 0;
  private elapsedTime = 0;

  // Walking phase: 0 → 2π
  private walkProgress = 0;

  // ============================================================
  // BLINK SYSTEM
  // ============================================================

  private blinkTimer = 0;
  private blinkProgress = 0;
  private nextBlinkInterval = 2800;
  private isBlinking = false;

  // ============================================================
  // GESTURE SYSTEM
  // ============================================================

  private gestureTimer = 0;
  private nextGestureInterval = 4200;

  // ============================================================
  // SMOOTHING
  // ============================================================

  private currentBodyBob = 0;
  private currentLegSwing = 0;
  private currentArmSwing = 0;

  private targetBodyBob = 0;
  private targetLegSwing = 0;
  private targetArmSwing = 0;

  // ============================================================
  // LISTENERS
  // ============================================================

  private listeners: Set<AnimationCallback> = new Set();

  constructor() {
    this.scheduleNextBlink();
    this.scheduleNextGesture();
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  public subscribe(cb: AnimationCallback): () => void {
    this.listeners.add(cb);

    cb(this.getSnapshot());

    return () => {
      this.listeners.delete(cb);
    };
  }

  // ============================================================
  // STATE
  // ============================================================

  public setState(state: GurujiAvatarState) {
    if (this.currentState === state) {
      return;
    }

    this.currentState = state;

    // Reset gesture timing whenever state changes
    this.gestureTimer = 0;

    switch (state) {
      case 'idle':
        this.lookDirection = 'left_slide';
        this.currentGesture = 'none';
        this.currentViseme = 'rest';
        break;

      case 'speaking':
        this.lookDirection = 'left_slide';

        // Start with signature professional presenter gesture (Hand in pocket, pointing to slide)
        this.currentGesture = 'pocket_point';

        this.gestureTimer = 0;
        this.scheduleNextGesture();
        break;

      case 'listening':
        this.lookDirection = 'audience';
        this.currentGesture = 'nod';
        this.currentViseme = 'rest';
        break;

      case 'thinking':
        this.lookDirection = 'center';
        this.currentGesture = 'none';
        this.currentViseme = 'rest';
        break;

      case 'walking':
        this.lookDirection = 'left_slide';
        this.currentGesture = 'none';
        break;

      case 'exiting':
        this.lookDirection = 'audience';
        this.currentGesture = 'none';
        break;

      default:
        break;
    }

    this.notify();
  }

  public setViseme(viseme: GurujiViseme) {
    this.currentViseme = viseme;
    this.notify();
  }

  public setGesture(gesture: GurujiGesture) {
    this.currentGesture = gesture;
    this.gestureTimer = 0;
    this.notify();
  }

  public setLookDirection(
    direction: 'center' | 'left_slide' | 'audience'
  ) {
    this.lookDirection = direction;
    this.notify();
  }

  // ============================================================
  // LOOP
  // ============================================================

  public startLoop() {
    if (this.animationFrameId !== null) {
      return;
    }

    this.lastTimestamp = performance.now();

    this.animationFrameId = requestAnimationFrame(
      this.loop
    );
  }

  public stopLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);

      this.animationFrameId = null;
    }
  }

  private loop = (timestamp: number) => {
    const delta = Math.min(
      timestamp - this.lastTimestamp,
      50
    );

    this.lastTimestamp = timestamp;

    const dt = delta * 0.001;

    this.elapsedTime += dt;

    this.update(delta, dt);

    this.notify();

    this.animationFrameId =
      requestAnimationFrame(this.loop);
  };

  // ============================================================
  // UPDATE
  // ============================================================

  private update(delta: number, dt: number) {
    this.updateWalking(dt);
    this.updateBlink(delta);
    this.updateGestures(delta);
    this.updateSmoothing(dt);
  }

  // ============================================================
  // WALKING
  // ============================================================

  private updateWalking(dt: number) {
    const walking =
      this.currentState === 'walking' ||
      this.currentState === 'exiting';

    if (!walking) {
      this.targetLegSwing = 0;
      this.targetArmSwing = 0;
      this.targetBodyBob = 0;

      return;
    }

    /*
     * Full walking cycle.
     *
     * 1 cycle ≈ 0.8 sec
     * Much more natural than multiplying the phase again.
     */

    const WALK_SPEED = 7.8;

    this.walkProgress += WALK_SPEED * dt;

    if (this.walkProgress >= Math.PI * 2) {
      this.walkProgress -= Math.PI * 2;
    }

    /*
     * Legs
     *
     * Left and right legs are opposite.
     */
    this.targetLegSwing =
      Math.sin(this.walkProgress) * 18;

    /*
     * Arms naturally oppose the legs.
     */
    this.targetArmSwing =
      -Math.sin(this.walkProgress) * 13;

    /*
     * Vertical movement happens twice per step.
     */
    this.targetBodyBob =
      Math.abs(
        Math.sin(this.walkProgress)
      ) * 3.5;
  }

  // ============================================================
  // BLINKING
  // ============================================================

  private updateBlink(delta: number) {
    this.blinkTimer += delta;

    if (
      !this.isBlinking &&
      this.blinkTimer >= this.nextBlinkInterval
    ) {
      this.isBlinking = true;

      this.blinkProgress = 0;

      this.blinkTimer = 0;

      this.blinkState = 'half';
    }

    if (!this.isBlinking) {
      return;
    }

    this.blinkProgress += delta;

    /*
     * Natural blink:
     *
     * 0-55ms    closing
     * 55-115ms  closed
     * 115-180ms opening
     */

    if (this.blinkProgress < 55) {
      this.blinkState = 'half';
    } else if (this.blinkProgress < 115) {
      this.blinkState = 'closed';
    } else if (this.blinkProgress < 180) {
      this.blinkState = 'half';
    } else {
      this.blinkState = 'open';

      this.isBlinking = false;

      this.scheduleNextBlink();
    }
  }

  private scheduleNextBlink() {
    /*
     * Human-like random interval.
     * Occasionally slightly longer.
     */

    this.nextBlinkInterval =
      2500 +
      Math.random() * 3500;
  }

  // ============================================================
  // GESTURES
  // ============================================================

  private updateGestures(delta: number) {
    if (this.currentState !== 'speaking') {
      this.gestureTimer = 0;
      return;
    }

    this.gestureTimer += delta;

    if (
      this.gestureTimer <
      this.nextGestureInterval
    ) {
      return;
    }

    this.gestureTimer = 0;

    this.scheduleNextGesture();

    /*
     * Presenter gesture rotation - predominantly open hands & presenter pointing
     */

    const gestures: GurujiGesture[] = [
      'pocket_point',
      'open_both_hands',
      'point_slide',
      'pocket_point',
      'open_hand',
      'both_hands_up',
      'open_both_hands',
      'pocket_point',
      'one_up_one_down',
      'emphasis',
    ];

    const available = gestures.filter(
      gesture =>
        gesture !== this.currentGesture
    );

    const next =
      available[
      Math.floor(
        Math.random() * available.length
      )
      ];

    this.currentGesture =
      next ?? 'open_both_hands';
  }

  private scheduleNextGesture() {
    this.nextGestureInterval =
      3000 +
      Math.random() * 2400;
  }

  // ============================================================
  // SMOOTHING
  // ============================================================

  private updateSmoothing(dt: number) {
    /*
     * Frame-rate independent smoothing.
     */

    const smoothing =
      1 - Math.exp(-10 * dt);

    this.currentBodyBob +=
      (this.targetBodyBob -
        this.currentBodyBob) *
      smoothing;

    this.currentLegSwing +=
      (this.targetLegSwing -
        this.currentLegSwing) *
      smoothing;

    this.currentArmSwing +=
      (this.targetArmSwing -
        this.currentArmSwing) *
      smoothing;
  }

  // ============================================================
  // SNAPSHOT
  // ============================================================

  public getSnapshot(): GurujiAnimationState {
    const t = this.elapsedTime;

    const isWalking =
      this.currentState === 'walking' ||
      this.currentState === 'exiting';

    /*
     * ----------------------------------------------------------
     * NATURAL BREATHING
     * ----------------------------------------------------------
     */

    const breathing =
      Math.sin(t * 1.7) * 0.8;

    /*
     * ----------------------------------------------------------
     * SPEECH ENERGY
     * ----------------------------------------------------------
     */

    const speechEnergy =
      this.currentState === 'speaking'
        ? Math.sin(t * 7.0) * 1.5
        : 0;

    /*
     * ----------------------------------------------------------
     * LISTENING NOD
     * ----------------------------------------------------------
     */

    const listeningNod =
      this.currentState === 'listening'
        ? Math.sin(t * 2.0) * 1.5
        : 0;

    // ==========================================================
    // DEFAULT ARMS
    // ==========================================================

    let leftArmAngle =
      2 + breathing;

    let leftForearmAngle =
      4 + breathing * 0.4;

    let rightArmAngle =
      -2 - breathing;

    let rightForearmAngle =
      -4 - breathing * 0.4;

    // ==========================================================
    // WALKING
    // ==========================================================

    if (isWalking) {
      /*
       * Arms oppose legs.
       */

      leftArmAngle =
        this.currentArmSwing;

      rightArmAngle =
        -this.currentArmSwing;

      /*
       * Keep forearms relatively relaxed.
       */

      leftForearmAngle =
        Math.sin(this.walkProgress) * 4;

      rightForearmAngle =
        -Math.sin(this.walkProgress) * 4;
    }

    // ==========================================================
    // THINKING (Natural Thinker Pose: Right hand to chin/temple, Left arm folded supporting elbow)
    // ==========================================================

    else if (
      this.currentState === 'thinking'
    ) {
      /*
       * Right arm moves inward and up to chin / temple
       */
      rightArmAngle =
        -32 +
        Math.sin(t * 1.5) * 0.8;

      rightForearmAngle =
        -92 +
        Math.sin(t * 1.5) * 1.0;

      /*
       * Left arm folds across lower chest supporting the right elbow
       */
      leftArmAngle =
        12 + breathing;

      leftForearmAngle =
        42 + breathing * 0.3;
    }

    // ==========================================================
    // LISTENING
    // ==========================================================

    else if (
      this.currentState === 'listening'
    ) {
      /*
       * Open relaxed posture.
       */

      leftArmAngle =
        -5 + breathing;

      leftForearmAngle =
        8 + listeningNod;

      rightArmAngle =
        5 - breathing;

      rightForearmAngle =
        -7 - listeningNod;
    }

    // ==========================================================
    // 1. OPEN BOTH HANDS (Welcoming Teaching Pose - Default)
    // ==========================================================

    else if (
      this.currentGesture ===
      'open_both_hands'
    ) {
      leftArmAngle =
        -22 +
        speechEnergy * 0.35;

      leftForearmAngle =
        -12 +
        speechEnergy * 0.35;

      rightArmAngle =
        22 -
        speechEnergy * 0.35;

      rightForearmAngle =
        12 -
        speechEnergy * 0.35;
    }

    // ==========================================================
    // 1. SIGNATURE PRESENTER POSE (Right Hand in Pocket, Left Hand Pointing Slide)
    // ==========================================================

    else if (
      this.currentGesture === 'pocket_point' ||
      this.currentGesture === 'point_slide'
    ) {
      /*
       * Left arm raised pointing and explaining the slide (matches reference image)
       */
      leftArmAngle =
        -36 +
        speechEnergy * 0.35;

      leftForearmAngle =
        -26 +
        speechEnergy * 0.45;

      /*
       * Right arm casually resting in blazer pocket
       */
      rightArmAngle =
        18 - breathing * 0.3;

      rightForearmAngle =
        18 - breathing * 0.3;
    }

    // ==========================================================
    // 3. OPEN SINGLE HAND (Welcoming Gesture)
    // ==========================================================

    else if (
      this.currentGesture ===
      'open_hand'
    ) {
      leftArmAngle =
        -24 +
        speechEnergy * 0.3;

      leftForearmAngle =
        -12 +
        speechEnergy * 0.35;

      rightArmAngle =
        -2 - breathing;

      rightForearmAngle =
        -2;
    }

    // ==========================================================
    // 4. BOTH HANDS UP (Emphatic Teaching)
    // ==========================================================

    else if (
      this.currentGesture ===
      'both_hands_up'
    ) {
      leftArmAngle =
        -28 +
        speechEnergy * 0.35;

      leftForearmAngle =
        -14 +
        speechEnergy * 0.4;

      rightArmAngle =
        28 -
        speechEnergy * 0.35;

      rightForearmAngle =
        14 -
        speechEnergy * 0.4;
    }

    // ==========================================================
    // 5. ONE HAND UP, OTHER DOWN (Explaining Contrast)
    // ==========================================================

    else if (
      this.currentGesture ===
      'one_up_one_down'
    ) {
      leftArmAngle =
        -30 +
        speechEnergy * 0.35;

      leftForearmAngle =
        -16 +
        speechEnergy * 0.4;

      rightArmAngle =
        -2 - breathing;

      rightForearmAngle =
        -2;
    }

    // ==========================================================
    // 6. EMPHASIS (Subtle Speech Pulse)
    // ==========================================================

    else if (
      this.currentGesture ===
      'emphasis'
    ) {
      leftArmAngle =
        -16 +
        speechEnergy * 0.35;

      leftForearmAngle =
        -8 +
        speechEnergy * 0.35;

      rightArmAngle =
        16 -
        speechEnergy * 0.35;

      rightForearmAngle =
        8 -
        speechEnergy * 0.35;
    }

    // ==========================================================
    // SPEAKING WITHOUT GESTURE
    // ==========================================================

    else if (
      this.currentState === 'speaking'
    ) {
      /*
       * Very subtle conversational movement.
       */

      leftArmAngle =
        2 +
        speechEnergy * 0.4 +
        breathing;

      leftForearmAngle =
        4 +
        speechEnergy * 0.35;

      rightArmAngle =
        -2 -
        speechEnergy * 0.4 -
        breathing;

      rightForearmAngle =
        -4 -
        speechEnergy * 0.35;
    }

    // ==========================================================
    // BODY
    // ==========================================================

    let bodyBob =
      this.currentBodyBob;

    /*
     * Speaking gets a very subtle body movement.
     */

    if (
      this.currentState === 'speaking'
    ) {
      bodyBob +=
        Math.abs(
          Math.sin(t * 3.5)
        ) * 0.8;
    }

    return {
      state: this.currentState,

      viseme: this.currentViseme,

      gesture: this.currentGesture,

      lookDirection:
        this.lookDirection,

      blinkState:
        this.blinkState,

      walkProgress:
        this.walkProgress,

      bodyBob,

      armSwing:
        this.currentArmSwing,

      legSwing:
        this.currentLegSwing,

      leftArmAngle,

      leftForearmAngle,

      rightArmAngle,

      rightForearmAngle,
    };
  }

  // ============================================================
  // NOTIFY
  // ============================================================

  private notify() {
    const snapshot =
      this.getSnapshot();

    this.listeners.forEach(
      callback => callback(snapshot)
    );
  }
}