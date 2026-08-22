'use client';

import React, { useEffect, useState } from 'react';
import { GurujiAnimationState, GurujiAnimationController } from './GurujiAnimationController';
import { GurujiAvatarState } from '@signalhub/types';

interface GurujiAvatarProps {
  controller: GurujiAnimationController;
  avatarState?: GurujiAvatarState;
  className?: string;
  isMini?: boolean;
}

export function GurujiAvatar({ controller, className = '', isMini = false }: GurujiAvatarProps) {
  const [anim, setAnim] = useState<GurujiAnimationState>(() => controller.getSnapshot());

  useEffect(() => {
    controller.startLoop();
    const unsubscribe = controller.subscribe((state) => {
      setAnim(state);
    });
    return () => {
      unsubscribe();
      // Do not stop loop if other components listen
    };
  }, [controller]);

  const { state, viseme, gesture, lookDirection, blinkState, bodyBob, armSwing, legSwing } = anim;

  // Eye pupil offset based on lookDirection
  let eyePupilOffsetX = 0;
  let eyePupilOffsetY = 0;
  if (lookDirection === 'left_slide') {
    eyePupilOffsetX = -3.5;
    eyePupilOffsetY = 1;
  } else if (lookDirection === 'audience') {
    eyePupilOffsetX = 0;
    eyePupilOffsetY = 0;
  } else if (lookDirection === 'center') {
    eyePupilOffsetX = 0;
    eyePupilOffsetY = -1.5; // Thinking (looking slightly up)
  }

  // Eyebrow offset based on state
  let eyebrowOffset = 0;
  if (state === 'thinking') eyebrowOffset = -3;
  if (state === 'speaking') eyebrowOffset = -1.5;
  if (state === 'listening') eyebrowOffset = -2;

  // Left Arm (Gesture Arm) angles
  let leftArmRotation = 0;
  let leftForearmRotation = 0;
  let leftHandRotation = 0;

  if (state === 'walking' || state === 'exiting') {
    leftArmRotation = armSwing;
  } else if (gesture === 'point_slide') {
    leftArmRotation = -48; // Point towards slide (left)
    leftForearmRotation = -24;
    leftHandRotation = -15;
  } else if (gesture === 'open_hand') {
    leftArmRotation = -32;
    leftForearmRotation = -12;
  } else if (gesture === 'emphasis') {
    leftArmRotation = -22;
    leftForearmRotation = -8;
  } else if (state === 'listening') {
    leftArmRotation = -12;
  }

  // Right Arm angles
  let rightArmRotation = 0;
  if (state === 'walking' || state === 'exiting') {
    rightArmRotation = -armSwing;
  } else if (state === 'thinking') {
    rightArmRotation = 35; // Hand near chin
  }

  const isWalking = state === 'walking' || state === 'exiting';

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        transform: `translateY(${-bodyBob}px)`,
        transition: isWalking ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      <svg
        viewBox="0 0 280 400"
        className="w-full h-full drop-shadow-2xl overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="gurujiSkin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0a370" />
            <stop offset="100%" stopColor="#c8824f" />
          </linearGradient>

          <linearGradient id="gurujiSuit" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="gurujiShirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          <linearGradient id="gurujiTie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          <linearGradient id="gurujiHair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c1917" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>

          <linearGradient id="gurujiGlasses" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <filter id="avatarShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. LEGS & SHOES (Articulated Walking) */}
        <g id="legs" transform="translate(140, 290)">
          {/* Left Leg */}
          <g
            transform={`rotate(${legSwing}, 0, 0)`}
            style={{ transition: isWalking ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          >
            {/* Thigh & Calf */}
            <path
              d="M -22 0 L -30 65 L -10 65 L -4 0 Z"
              fill="#0f172a"
            />
            {/* Shoe */}
            <path
              d="M -32 65 Q -38 72 -30 78 L -5 78 Q -2 72 -8 65 Z"
              fill="#09090b"
            />
          </g>

          {/* Right Leg */}
          <g
            transform={`rotate(${-legSwing}, 0, 0)`}
            style={{ transition: isWalking ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          >
            {/* Thigh & Calf */}
            <path
              d="M 4 0 L 10 65 L 30 65 L 22 0 Z"
              fill="#1e293b"
            />
            {/* Shoe */}
            <path
              d="M 8 65 Q 2 72 5 78 L 30 78 Q 38 72 32 65 Z"
              fill="#09090b"
            />
          </g>
        </g>

        {/* 2. TORSO, JACKET, SHIRT & TIE */}
        <g id="torso" transform="translate(140, 200)">
          {/* Inner Shirt */}
          <path
            d="M -30 -40 L 30 -40 L 35 90 L -35 90 Z"
            fill="url(#gurujiShirt)"
          />

          {/* Cyan Telecom Guruji Tie */}
          <path
            d="M -5 -35 L 5 -35 L 8 40 L 0 55 L -8 40 Z"
            fill="url(#gurujiTie)"
          />
          {/* Tie Knot */}
          <polygon points="-6,-38 6,-38 4,-30 -4,-30" fill="#0284c7" />

          {/* Blazer Suit Jacket (Left & Right Flaps) */}
          <path
            d="M -45 -45 L -20 -45 L -8 50 L -42 90 L -52 85 Z"
            fill="url(#gurujiSuit)"
          />
          <path
            d="M 45 -45 L 20 -45 L 8 50 L 42 90 L 52 85 Z"
            fill="url(#gurujiSuit)"
          />

          {/* Telecom Guruji Lapel Badge */}
          <circle cx="-28" cy="-18" r="4.5" fill="#38bdf8" />
          <path d="M -29 -20 L -27 -18 L -29 -16" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* 3. RIGHT ARM (Background/Audience side) */}
        <g
          id="right-arm"
          transform="translate(185, 160)"
          style={{
            transformOrigin: '0 0',
            transform: `rotate(${rightArmRotation}deg)`,
            transition: isWalking ? 'none' : 'transform 0.4s ease-out',
          }}
        >
          {/* Upper Arm */}
          <path d="M -5 0 L 15 50 L -2 52 L -15 0 Z" fill="#0f172a" />
          {/* Forearm & Hand */}
          <g transform="translate(5, 48)">
            <path d="M -6 0 L 8 48 L -4 48 L -14 0 Z" fill="#0f172a" />
            {/* Hand */}
            <circle cx="2" cy="54" r="8" fill="url(#gurujiSkin)" />
          </g>
        </g>

        {/* 4. LEFT ARM (Gesture/Slide-pointing Arm) */}
        <g
          id="left-arm"
          transform="translate(95, 160)"
          style={{
            transformOrigin: '0 0',
            transform: `rotate(${leftArmRotation}deg)`,
            transition: isWalking ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Upper Arm */}
          <path d="M 15 0 L -10 50 L 5 52 L 25 0 Z" fill="#1e293b" />

          {/* Forearm */}
          <g
            transform="translate(-5, 48)"
            style={{
              transformOrigin: '0 0',
              transform: `rotate(${leftForearmRotation}deg)`,
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <path d="M 8 0 L -8 48 L 4 48 L 16 0 Z" fill="#1e293b" />

            {/* Hand & Pointing Finger */}
            <g
              transform="translate(-3, 50)"
              style={{
                transformOrigin: '0 0',
                transform: `rotate(${leftHandRotation}deg)`,
              }}
            >
              {gesture === 'point_slide' ? (
                /* Extended Index Finger Pointing Left */
                <g>
                  {/* Palm */}
                  <circle cx="0" cy="4" r="7" fill="url(#gurujiSkin)" />
                  {/* Pointing Index Finger towards Slide (Left) */}
                  <path
                    d="M -2 2 Q -18 -8 -24 -6 Q -26 -2 -18 2 L -2 6 Z"
                    fill="url(#gurujiSkin)"
                  />
                  {/* Thumb */}
                  <path d="M 0 -2 Q -4 -8 0 -10 Q 4 -8 2 -2 Z" fill="#c8824f" />
                </g>
              ) : gesture === 'open_hand' ? (
                /* Open Explaining Hand */
                <g>
                  <circle cx="0" cy="4" r="7.5" fill="url(#gurujiSkin)" />
                  <path d="M -4 2 L -12 -2 Q -14 2 -10 6 L -4 8 Z" fill="url(#gurujiSkin)" />
                  <path d="M -3 0 L -10 -8 Q -8 -12 -4 -6 L 0 0 Z" fill="url(#gurujiSkin)" />
                </g>
              ) : (
                /* Relaxed Hand */
                <circle cx="0" cy="4" r="7.5" fill="url(#gurujiSkin)" />
              )}
            </g>
          </g>
        </g>

        {/* 5. NECK & COLLAR */}
        <g id="neck" transform="translate(140, 155)">
          <path d="M -12 -12 L 12 -12 L 10 6 L -10 6 Z" fill="url(#gurujiSkin)" />
          {/* Shirt Collar Points */}
          <polygon points="-18,2 -2,6 -12,-10" fill="#ffffff" />
          <polygon points="18,2 2,6 12,-10" fill="#ffffff" />
        </g>

        {/* 6. HEAD, FACE, HAIR & GLASSES */}
        <g id="head" transform="translate(140, 105)">
          {/* Ears */}
          <ellipse cx="-42" cy="-4" rx="7" ry="11" fill="#c8824f" />
          <ellipse cx="42" cy="-4" rx="7" ry="11" fill="#c8824f" />

          {/* Face Base */}
          <path
            d="M -38 -30 C -40 20 -25 48 0 48 C 25 48 40 20 38 -30 C 38 -55 -38 -55 -38 -30 Z"
            fill="url(#gurujiSkin)"
          />

          {/* Groomed Short Beard / Stubble Contour */}
          <path
            d="M -32 5 C -25 42 0 46 0 46 C 0 46 25 42 32 5 C 30 18 20 40 0 42 C -20 40 -30 18 -32 5 Z"
            fill="#1c1917"
            opacity="0.25"
          />

          {/* Modern Styled Hair */}
          <path
            d="M -42 -30 C -42 -65 30 -70 44 -35 C 44 -20 40 -15 36 -25 C 30 -50 -20 -50 -36 -25 C -40 -15 -42 -20 -42 -30 Z"
            fill="url(#gurujiHair)"
          />
          {/* Hair Texture Highlights */}
          <path
            d="M -25 -52 Q 0 -62 25 -48"
            stroke="#3f3f46"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Eyebrows */}
          <g transform={`translate(0, ${eyebrowOffset})`}>
            {/* Left Eyebrow */}
            <path
              d="M -30 -16 Q -18 -22 -8 -17"
              stroke="#1c1917"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right Eyebrow */}
            <path
              d="M 8 -17 Q 18 -22 30 -16"
              stroke="#1c1917"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Eyes (Blinking Animation Support) */}
          <g id="eyes">
            {/* Left Eye */}
            <g transform="translate(-18, -6)">
              {blinkState === 'closed' ? (
                <path d="M -10 0 Q 0 4 10 0" stroke="#1c1917" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              ) : blinkState === 'half' ? (
                <g>
                  <ellipse cx="0" cy="0" rx="9" ry="3" fill="#ffffff" />
                  <ellipse cx={eyePupilOffsetX * 0.7} cy={eyePupilOffsetY} rx="3.5" ry="3" fill="#1c1917" />
                </g>
              ) : (
                <g>
                  {/* Sclera (White) */}
                  <ellipse cx="0" cy="0" rx="9" ry="6" fill="#ffffff" />
                  {/* Iris */}
                  <ellipse cx={eyePupilOffsetX} cy={eyePupilOffsetY} rx="5" ry="5.5" fill="#3f2314" />
                  {/* Pupil */}
                  <ellipse cx={eyePupilOffsetX} cy={eyePupilOffsetY} rx="2.8" ry="3" fill="#09090b" />
                  {/* Catchlight */}
                  <circle cx={eyePupilOffsetX - 1.5} cy={eyePupilOffsetY - 1.5} r="1.2" fill="#ffffff" />
                </g>
              )}
            </g>

            {/* Right Eye */}
            <g transform="translate(18, -6)">
              {blinkState === 'closed' ? (
                <path d="M -10 0 Q 0 4 10 0" stroke="#1c1917" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              ) : blinkState === 'half' ? (
                <g>
                  <ellipse cx="0" cy="0" rx="9" ry="3" fill="#ffffff" />
                  <ellipse cx={eyePupilOffsetX * 0.7} cy={eyePupilOffsetY} rx="3.5" ry="3" fill="#1c1917" />
                </g>
              ) : (
                <g>
                  {/* Sclera (White) */}
                  <ellipse cx="0" cy="0" rx="9" ry="6" fill="#ffffff" />
                  {/* Iris */}
                  <ellipse cx={eyePupilOffsetX} cy={eyePupilOffsetY} rx="5" ry="5.5" fill="#3f2314" />
                  {/* Pupil */}
                  <ellipse cx={eyePupilOffsetX} cy={eyePupilOffsetY} rx="2.8" ry="3" fill="#09090b" />
                  {/* Catchlight */}
                  <circle cx={eyePupilOffsetX - 1.5} cy={eyePupilOffsetY - 1.5} r="1.2" fill="#ffffff" />
                </g>
              )}
            </g>
          </g>

          {/* Stylish Glasses Frames with Blue Gradient */}
          <g id="glasses">
            {/* Left Frame */}
            <rect
              x="-31"
              y="-15"
              width="25"
              height="18"
              rx="4"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.2"
            />
            {/* Right Frame */}
            <rect
              x="6"
              y="-15"
              width="25"
              height="18"
              rx="4"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.2"
            />
            {/* Bridge */}
            <path d="M -6 -7 Q 0 -10 6 -7" stroke="#0284c7" strokeWidth="2.2" fill="none" />
            {/* Temples */}
            <path d="M -31 -7 L -40 -9" stroke="#0284c7" strokeWidth="2" fill="none" />
            <path d="M 31 -7 L 40 -9" stroke="#0284c7" strokeWidth="2" fill="none" />
            {/* Glare line */}
            <path d="M -26 -11 L -12 0" stroke="#bae6fd" strokeWidth="1" opacity="0.6" strokeLinecap="round" />
            <path d="M 11 -11 L 25 0" stroke="#bae6fd" strokeWidth="1" opacity="0.6" strokeLinecap="round" />
          </g>

          {/* Nose */}
          <path
            d="M 0 -8 L -2 10 Q 0 13 4 11"
            stroke="#a66236"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* 7. REALISTIC PHONETIC MOUTH VISEMES */}
          <g id="mouth" transform="translate(0, 24)">
            {viseme === 'rest' && (
              /* Friendly, warm closed smile */
              <path
                d="M -12 0 Q 0 6 12 0"
                stroke="#6b2512"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            )}

            {viseme === 'A' && (
              /* Wide open A mouth */
              <g>
                <ellipse cx="0" cy="2" rx="10" ry="7" fill="#450a0a" />
                <path d="M -8 -1 Q 0 -3 8 -1 Q 6 1 0 2 Q -6 1 -8 -1 Z" fill="#ffffff" />
                <ellipse cx="0" cy="5" rx="5" ry="3" fill="#dc2626" />
              </g>
            )}

            {viseme === 'E' && (
              /* Wide horizontal stretched E mouth */
              <g>
                <path d="M -12 -1 Q 0 -3 12 -1 Q 10 5 0 5 Q -10 5 -12 -1 Z" fill="#450a0a" />
                <rect x="-9" y="-1" width="18" height="3" rx="1" fill="#ffffff" />
              </g>
            )}

            {viseme === 'I' && (
              /* Narrow open I mouth */
              <g>
                <ellipse cx="0" cy="2" rx="7" ry="5" fill="#450a0a" />
                <rect x="-6" y="0" width="12" height="2" rx="1" fill="#ffffff" />
              </g>
            )}

            {viseme === 'O' && (
              /* Round circular O mouth */
              <g>
                <ellipse cx="0" cy="3" rx="6.5" ry="7" fill="#450a0a" stroke="#6b2512" strokeWidth="1" />
                <ellipse cx="0" cy="6" rx="4" ry="2.5" fill="#dc2626" />
              </g>
            )}

            {viseme === 'U' && (
              /* Small puckered U mouth */
              <g>
                <circle cx="0" cy="3" r="4.5" fill="#450a0a" />
                <circle cx="0" cy="3" r="2.5" fill="#dc2626" />
              </g>
            )}

            {viseme === 'consonant' && (
              /* Teeth together consonant mouth */
              <g>
                <path d="M -11 0 Q 0 1 11 0 Q 8 4 0 4 Q -8 4 -11 0 Z" fill="#450a0a" />
                <rect x="-8" y="0" width="16" height="2" rx="0.5" fill="#ffffff" />
              </g>
            )}
          </g>
        </g>
      </svg>

      {/* Floating State Mini Pill */}
      {!isMini && (
        <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-zinc-900/90 dark:bg-black/90 border border-sky-500/30 text-[10px] font-mono font-bold text-sky-400 shadow-md backdrop-blur flex items-center space-x-1.5 pointer-events-none">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              state === 'speaking'
                ? 'bg-emerald-400 animate-ping'
                : state === 'listening'
                ? 'bg-amber-400 animate-pulse'
                : state === 'walking' || state === 'arriving'
                ? 'bg-indigo-400 animate-pulse'
                : state === 'thinking'
                ? 'bg-purple-400 animate-spin'
                : 'bg-sky-400'
            }`}
          />
          <span className="capitalize">
            {state === 'walking'
              ? 'Arriving...'
              : state === 'speaking'
              ? 'Speaking...'
              : state === 'listening'
              ? 'Listening...'
              : state === 'thinking'
              ? 'Thinking...'
              : state === 'exiting'
              ? 'Exiting...'
              : 'Guruji ● Ready'}
          </span>
        </div>
      )}
    </div>
  );
}
