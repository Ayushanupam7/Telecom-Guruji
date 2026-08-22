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
    };
  }, [controller]);

  const {
    state,
    viseme,
    gesture,
    lookDirection,
    blinkState,
    bodyBob,
    leftArmAngle,
    leftForearmAngle,
    rightArmAngle,
    rightForearmAngle,
    legSwing,
  } = anim;

  // Eye pupil offset based on lookDirection
  let eyePupilOffsetX = 0;
  let eyePupilOffsetY = 0;
  if (lookDirection === 'left_slide') {
    eyePupilOffsetX = -3;
    eyePupilOffsetY = 1;
  } else if (lookDirection === 'center') {
    eyePupilOffsetX = 0;
    eyePupilOffsetY = -1.5;
  }

  // Eyebrow offset based on state
  let eyebrowOffset = 0;
  if (state === 'thinking') eyebrowOffset = -2.5;
  if (state === 'speaking') eyebrowOffset = -1.2;
  if (state === 'listening') eyebrowOffset = -1.8;

  const isWalking = state === 'walking' || state === 'exiting';

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        transform: `translateY(${-bodyBob}px)`,
        transition: isWalking ? 'none' : 'transform 0.15s ease-out',
      }}
    >
      <svg
        viewBox="0 0 280 380"
        className="w-full h-full drop-shadow-lg overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Indian Skin Tone Gradients */}
          <linearGradient id="gurujiSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eab384" />
            <stop offset="100%" stopColor="#c8824f" />
          </linearGradient>

          {/* Deep Navy Blazer Suit Gradient */}
          <linearGradient id="gurujiSuit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Suit Shadow / Darker Navy */}
          <linearGradient id="gurujiSuitDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#172033" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>

          {/* Crisp White Shirt */}
          <linearGradient id="gurujiShirt" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>

          {/* Telecom Guruji Cyan Tie */}
          <linearGradient id="gurujiTie" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Dark Charcoal Hair */}
          <linearGradient id="gurujiHair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
        </defs>

        {/* ========================================================================= */}
        {/* 1. LEGS & SHOES */}
        {/* ========================================================================= */}
        <g id="legs" transform="translate(140, 268)">
          {/* Left Leg */}
          <g
            transform={`rotate(${legSwing}, -16, 0)`}
            style={{ transition: isWalking ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          >
            {/* Trousers */}
            <path d="M -24 0 L -28 72 L -6 72 L -8 0 Z" fill="#1e293b" />
            {/* Formal Shoe */}
            <path d="M -30 72 Q -36 78 -33 83 L -5 83 Q 1 78 -5 72 Z" fill="#09090b" />
          </g>

          {/* Right Leg */}
          <g
            transform={`rotate(${-legSwing}, 16, 0)`}
            style={{ transition: isWalking ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          >
            {/* Trousers */}
            <path d="M 8 0 L 6 72 L 28 72 L 24 0 Z" fill="#1e293b" />
            {/* Formal Shoe */}
            <path d="M 5 72 Q -1 78 5 83 L 33 83 Q 36 78 30 72 Z" fill="#09090b" />
          </g>
        </g>

        {/* ========================================================================= */}
        {/* 2. TORSO & SUIT JACKET (Proportionate, Closed Tailored Fit) */}
        {/* ========================================================================= */}
        <g id="torso" transform="translate(140, 195)">
          {/* White Shirt Background */}
          <path d="M -24 -40 L 24 -40 L 18 35 L -18 35 Z" fill="url(#gurujiShirt)" />

          {/* Cyan Tie */}
          <path d="M -4 -35 L 4 -35 L 6 30 L 0 42 L -6 30 Z" fill="url(#gurujiTie)" />
          <polygon points="-5,-38 5,-38 3,-30 -3,-30" fill="#0284c7" />

          {/* Suit Jacket Body (Solid tailored navy blazer) */}
          <path
            d="M -42 -42 L -16 -42 L -5 32 L 0 52 L 5 32 L 16 -42 L 42 -42 L 40 70 L -40 70 Z"
            fill="url(#gurujiSuit)"
          />

          {/* Lapels */}
          {/* Left Lapel */}
          <path d="M -42 -42 L -18 -42 L -4 15 L -26 -10 Z" fill="url(#gurujiSuitDark)" />
          {/* Right Lapel */}
          <path d="M 42 -42 L 18 -42 L 4 15 L 26 -10 Z" fill="url(#gurujiSuitDark)" />

          {/* Jacket Center Seam & Buttons */}
          <line x1="0" y1="28" x2="0" y2="70" stroke="#090d16" strokeWidth="1.5" />
          <circle cx="0" cy="38" r="2" fill="#38bdf8" />
          <circle cx="0" cy="52" r="2" fill="#38bdf8" />

          {/* Telecom Guruji Lapel Pin */}
          <circle cx="-28" cy="-14" r="3.5" fill="#38bdf8" />
          <circle cx="-28" cy="-14" r="1.5" fill="#0f172a" />

          {/* Blazer Pockets */}
          <rect x="-38" y="42" width="16" height="3" rx="1" fill="url(#gurujiSuitDark)" />
          <rect x="22" y="42" width="16" height="3" rx="1" fill="url(#gurujiSuitDark)" />
        </g>

        {/* ========================================================================= */}
        {/* 3. SCREEN-LEFT ARM (Slide Side / Presenter Shoulder) */}
        {/* ========================================================================= */}
        <g id="left-arm" transform={`translate(98, 155) rotate(${leftArmAngle})`}>
          {/* Shoulder Joint Cap */}
          <circle cx="0" cy="0" r="7.5" fill="url(#gurujiSuit)" />

          {/* Upper Arm Sleeve */}
          <path
            d="M -7.5 0 L 7.5 0 L 6 48 L -6 48 Z"
            fill="url(#gurujiSuit)"
          />

          {/* Forearm */}
          <g transform={`translate(0, 48) rotate(${leftForearmAngle})`}>
            {/* Elbow Joint Cap */}
            <circle cx="0" cy="0" r="6" fill="url(#gurujiSuit)" />

            {/* Forearm Sleeve */}
            <path d="M -6 0 L 6 0 L 5 42 L -5 42 Z" fill="url(#gurujiSuit)" />
            {/* White Shirt Cuff */}
            <rect x="-5" y="40" width="10" height="3.5" rx="1" fill="#ffffff" />

            {/* Hand */}
            <g transform="translate(0, 43)">
              {gesture === 'point_slide' || gesture === 'pocket_point' || gesture === 'one_up_one_down' ? (
                /* Clear Pointing Hand towards Slide on Left */
                <g>
                  {/* Curled Fist Base */}
                  <ellipse cx="2" cy="4" rx="6" ry="6" fill="url(#gurujiSkin)" />
                  {/* Pointing Index Finger towards Left Slide */}
                  <path d="M 1 0 L -18 -8 Q -21 -5 -17 -2 L 1 4 Z" fill="url(#gurujiSkin)" />
                  {/* Thumb over fist */}
                  <path d="M 0 -2 Q 3 -6 6 -3 Q 6 1 2 2 Z" fill="url(#gurujiSkin)" />
                  {/* Finger creases */}
                  <path d="M 0 3 Q 4 5 1 8" stroke="#b46f3e" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                </g>
              ) : gesture === 'open_hand' || gesture === 'open_both_hands' || gesture === 'both_hands_up' ? (
                /* Open Welcoming Palm */
                <g>
                  <circle cx="0" cy="4" r="6" fill="url(#gurujiSkin)" />
                  <path d="M -1 1 L -10 -3 Q -12 -1 -8 3 L -1 5 Z" fill="url(#gurujiSkin)" />
                  <path d="M 0 -1 L -5 -7 Q -3 -8 0 -4 L 1 0 Z" fill="url(#gurujiSkin)" />
                </g>
              ) : gesture === 'join_hands' ? (
                /* Joined Palm / Namaste Focus */
                <g>
                  <circle cx="0" cy="3" r="5.5" fill="url(#gurujiSkin)" />
                  <path d="M -1 -2 Q 2 -8 3 -8 Q 4 -5 1 2 Z" fill="url(#gurujiSkin)" />
                  <path d="M 1 2 Q 4 4 2 7" stroke="#b46f3e" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                </g>
              ) : gesture === 'folded_arms' || state === 'thinking' ? (
                /* Left Hand Folded Across Holding Arm / Wrist */
                <g>
                  <circle cx="0" cy="4" r="5.5" fill="url(#gurujiSkin)" />
                  <path d="M 1 2 Q 4 5 1 7" stroke="#b46f3e" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                  <path d="M -2 1 Q -4 4 -1 6" stroke="#b46f3e" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </g>
              ) : (
                /* Natural Resting Hand */
                <g>
                  <circle cx="0" cy="4" r="6" fill="url(#gurujiSkin)" />
                  {/* Inward Thumb */}
                  <path d="M 2 2 Q 4 5 2 7" stroke="#b46f3e" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                </g>
              )}
            </g>
          </g>
        </g>

        {/* ========================================================================= */}
        {/* 4. SCREEN-RIGHT ARM (Audience Side / Right Shoulder) */}
        {/* ========================================================================= */}
        <g id="right-arm" transform={`translate(182, 155) rotate(${rightArmAngle})`}>
          {/* Shoulder Joint Cap */}
          <circle cx="0" cy="0" r="7.5" fill="url(#gurujiSuit)" />

          {/* Upper Arm Sleeve */}
          <path
            d="M -7.5 0 L 7.5 0 L 6 48 L -6 48 Z"
            fill="url(#gurujiSuit)"
          />

          {/* Forearm */}
          <g transform={`translate(0, 48) rotate(${rightForearmAngle})`}>
            {/* Elbow Joint Cap */}
            <circle cx="0" cy="0" r="6" fill="url(#gurujiSuit)" />

            {/* Forearm Sleeve */}
            <path d="M -6 0 L 6 0 L 5 42 L -5 42 Z" fill="url(#gurujiSuit)" />
            {/* White Shirt Cuff */}
            <rect x="-5" y="40" width="10" height="3.5" rx="1" fill="#ffffff" />

            {/* Hand */}
            <g transform="translate(0, 43)">
              {gesture === 'pocket_point' || gesture === 'point_slide' ? (
                /* Hand Casually Hooked in Blazer Pocket (Presenter Stance) */
                <g>
                  {/* Fingers inside pocket */}
                  <rect x="-4" y="0" width="8" height="5" rx="2" fill="#0f172a" />
                  {/* Visible Thumb & Knuckle hooked over pocket */}
                  <path d="M -2 0 Q -7 3 -4 7 Q -1 8 0 4 Z" fill="url(#gurujiSkin)" />
                  <path d="M -3 3 Q -5 4 -3 6" stroke="#b46f3e" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </g>
              ) : gesture === 'open_both_hands' || gesture === 'both_hands_up' ? (
                /* Open Welcoming Palm on Right */
                <g>
                  <circle cx="0" cy="4" r="6" fill="url(#gurujiSkin)" />
                  <path d="M 1 1 L 10 -3 Q 12 -1 8 3 L 1 5 Z" fill="url(#gurujiSkin)" />
                  <path d="M 0 -1 L 5 -7 Q 3 -8 0 -4 L -1 0 Z" fill="url(#gurujiSkin)" />
                </g>
              ) : gesture === 'join_hands' ? (
                /* Joined Palm / Namaste Focus */
                <g>
                  <circle cx="0" cy="3" r="5.5" fill="url(#gurujiSkin)" />
                  <path d="M 1 -2 Q -2 -8 -3 -8 Q -4 -5 -1 2 Z" fill="url(#gurujiSkin)" />
                  <path d="M -1 2 Q -4 4 -2 7" stroke="#b46f3e" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                </g>
              ) : gesture === 'folded_arms' ? (
                /* Folded Tucked Hand */
                <g>
                  <circle cx="0" cy="4" r="5.5" fill="url(#gurujiSkin)" />
                  <path d="M -1 2 Q -4 5 -1 7" stroke="#b46f3e" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                </g>
              ) : state === 'thinking' ? (
                /* Right Hand Touching Temple / Side of Head */
                <g>
                  <circle cx="0" cy="3" r="5.5" fill="url(#gurujiSkin)" />
                  <path d="M 0 -1 Q -2 -6 1 -7 Q 3 -5 1 0 Z" fill="url(#gurujiSkin)" />
                  <path d="M -2 2 Q -4 4 -2 6" stroke="#b46f3e" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                </g>
              ) : (
                /* Natural Resting Hand */
                <g>
                  <circle cx="0" cy="4" r="6" fill="url(#gurujiSkin)" />
                  {/* Inward Thumb */}
                  <path d="M -2 2 Q -4 5 -2 7" stroke="#b46f3e" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                </g>
              )}
            </g>
          </g>
        </g>

        {/* ========================================================================= */}
        {/* 5. NECK & COLLAR */}
        {/* ========================================================================= */}
        <g id="neck" transform="translate(140, 152)">
          <path d="M -11 -10 L 11 -10 L 9 5 L -9 5 Z" fill="url(#gurujiSkin)" />
          {/* White Shirt Collar Points */}
          <polygon points="-16,2 -1,5 -10,-8" fill="#ffffff" />
          <polygon points="16,2 1,5 10,-8" fill="#ffffff" />
        </g>

        {/* ========================================================================= */}
        {/* 6. HEAD, FACE, HAIR & GLASSES */}
        {/* ========================================================================= */}
        <g id="head" transform="translate(140, 102)">
          {/* Ears */}
          <ellipse cx="-40" cy="-4" rx="6.5" ry="10" fill="#c8824f" />
          <ellipse cx="40" cy="-4" rx="6.5" ry="10" fill="#c8824f" />

          {/* Face Base */}
          <path
            d="M -36 -28 C -38 18 -24 46 0 46 C 24 46 38 18 36 -28 C 36 -52 -36 -52 -36 -28 Z"
            fill="url(#gurujiSkin)"
          />

          {/* Clean Groomed Stubble/Beard Accent */}
          <path
            d="M -30 5 C -24 40 0 44 0 44 C 0 44 24 40 30 5 C 28 16 18 38 0 40 C -18 38 -28 16 -30 5 Z"
            fill="#1c1917"
            opacity="0.2"
          />

          {/* Hair */}
          <path
            d="M -40 -28 C -40 -62 28 -66 42 -32 C 42 -18 38 -14 34 -23 C 28 -46 -18 -46 -34 -23 C -38 -14 -40 -18 -40 -28 Z"
            fill="url(#gurujiHair)"
          />
          <path
            d="M -22 -48 Q 0 -58 22 -44"
            stroke="#3f3f46"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Eyebrows */}
          <g transform={`translate(0, ${eyebrowOffset})`}>
            <path d="M -28 -15 Q -17 -20 -8 -16" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 8 -16 Q 17 -20 28 -15" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>

          {/* Eyes (Blinking Support) */}
          <g id="eyes">
            {/* Left Eye */}
            <g transform="translate(-17, -5)">
              {blinkState === 'closed' ? (
                <path d="M -9 0 Q 0 3.5 9 0" stroke="#1c1917" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              ) : blinkState === 'half' ? (
                <g>
                  <ellipse cx="0" cy="0" rx="8.5" ry="3" fill="#ffffff" />
                  <ellipse cx={eyePupilOffsetX * 0.7} cy={eyePupilOffsetY} rx="3" ry="2.8" fill="#1c1917" />
                </g>
              ) : (
                <g>
                  <ellipse cx="0" cy="0" rx="8.5" ry="5.5" fill="#ffffff" />
                  <ellipse cx={eyePupilOffsetX} cy={eyePupilOffsetY} rx="4.8" ry="5" fill="#3f2314" />
                  <ellipse cx={eyePupilOffsetX} cy={eyePupilOffsetY} rx="2.6" ry="2.8" fill="#09090b" />
                  <circle cx={eyePupilOffsetX - 1.2} cy={eyePupilOffsetY - 1.2} r="1" fill="#ffffff" />
                </g>
              )}
            </g>

            {/* Right Eye */}
            <g transform="translate(17, -5)">
              {blinkState === 'closed' ? (
                <path d="M -9 0 Q 0 3.5 9 0" stroke="#1c1917" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              ) : blinkState === 'half' ? (
                <g>
                  <ellipse cx="0" cy="0" rx="8.5" ry="3" fill="#ffffff" />
                  <ellipse cx={eyePupilOffsetX * 0.7} cy={eyePupilOffsetY} rx="3" ry="2.8" fill="#1c1917" />
                </g>
              ) : (
                <g>
                  <ellipse cx="0" cy="0" rx="8.5" ry="5.5" fill="#ffffff" />
                  <ellipse cx={eyePupilOffsetX} cy={eyePupilOffsetY} rx="4.8" ry="5" fill="#3f2314" />
                  <ellipse cx={eyePupilOffsetX} cy={eyePupilOffsetY} rx="2.6" ry="2.8" fill="#09090b" />
                  <circle cx={eyePupilOffsetX - 1.2} cy={eyePupilOffsetY - 1.2} r="1" fill="#ffffff" />
                </g>
              )}
            </g>
          </g>

          {/* Modern Glasses */}
          <g id="glasses">
            <rect x="-29" y="-14" width="24" height="17" rx="3.5" fill="none" stroke="#0284c7" strokeWidth="2" />
            <rect x="5" y="-14" width="24" height="17" rx="3.5" fill="none" stroke="#0284c7" strokeWidth="2" />
            <path d="M -5 -6 Q 0 -9 5 -6" stroke="#0284c7" strokeWidth="2" fill="none" />
            <path d="M -29 -6 L -38 -8" stroke="#0284c7" strokeWidth="1.8" fill="none" />
            <path d="M 29 -6 L 38 -8" stroke="#0284c7" strokeWidth="1.8" fill="none" />
            <path d="M -24 -10 L -12 0" stroke="#bae6fd" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
            <path d="M 10 -10 L 22 0" stroke="#bae6fd" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
          </g>

          {/* Nose */}
          <path d="M 0 -7 L -2 9 Q 0 12 3 10" stroke="#a66236" strokeWidth="1.8" fill="none" strokeLinecap="round" />

          {/* 7. PHONETIC MOUTH VISEMES */}
          <g id="mouth" transform="translate(0, 22)">
            {viseme === 'rest' && (
              <path d="M -11 0 Q 0 5 11 0" stroke="#6b2512" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            )}

            {viseme === 'A' && (
              <g>
                <ellipse cx="0" cy="2" rx="9" ry="6" fill="#450a0a" />
                <path d="M -7 -1 Q 0 -3 7 -1 Q 5 1 0 2 Q -5 1 -7 -1 Z" fill="#ffffff" />
                <ellipse cx="0" cy="5" rx="4.5" ry="2.5" fill="#dc2626" />
              </g>
            )}

            {viseme === 'E' && (
              <g>
                <path d="M -11 -1 Q 0 -3 11 -1 Q 9 4 0 4 Q -9 4 -11 -1 Z" fill="#450a0a" />
                <rect x="-8" y="-1" width="16" height="2.5" rx="1" fill="#ffffff" />
              </g>
            )}

            {viseme === 'I' && (
              <g>
                <ellipse cx="0" cy="2" rx="6.5" ry="4.5" fill="#450a0a" />
                <rect x="-5" y="0" width="10" height="2" rx="0.8" fill="#ffffff" />
              </g>
            )}

            {viseme === 'O' && (
              <g>
                <ellipse cx="0" cy="3" rx="6" ry="6.5" fill="#450a0a" stroke="#6b2512" strokeWidth="1" />
                <ellipse cx="0" cy="5.5" rx="3.5" ry="2.2" fill="#dc2626" />
              </g>
            )}

            {viseme === 'U' && (
              <g>
                <circle cx="0" cy="3" r="4" fill="#450a0a" />
                <circle cx="0" cy="3" r="2" fill="#dc2626" />
              </g>
            )}

            {viseme === 'consonant' && (
              <g>
                <path d="M -10 0 Q 0 1 10 0 Q 7 3.5 0 3.5 Q -7 3.5 -10 0 Z" fill="#450a0a" />
                <rect x="-7" y="0" width="14" height="1.8" rx="0.5" fill="#ffffff" />
              </g>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}
