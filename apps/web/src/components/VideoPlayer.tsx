'use client';

import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { VIDEO_WATCH_COMPLETION_THRESHOLD } from '@signalhub/shared';

interface VideoPlayerProps {
  videoId: string;
  requiredWatchPercent?: number;
  onWatchProgress?: (percent: number, completed: boolean) => void;
}

export function VideoPlayer({
  videoId,
  requiredWatchPercent = VIDEO_WATCH_COMPLETION_THRESHOLD,
  onWatchProgress,
}: VideoPlayerProps) {
  const [watchedPercent, setWatchedPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Simulated watch tracker heartbeat (increments by 10% per 3s when playing)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && watchedPercent < 100) {
      interval = setInterval(() => {
        setWatchedPercent((prev) => {
          const next = Math.min(prev + 10, 100);
          const completed = next >= requiredWatchPercent;
          if (completed && !isCompleted) {
            setIsCompleted(true);
          }
          onWatchProgress?.(next, completed);
          return next;
        });
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, watchedPercent, requiredWatchPercent, isCompleted, onWatchProgress]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-4">
      {/* Video Viewport Container */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-center items-center group">
        <iframe
          className="w-full h-full pointer-events-auto"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}`}
          title="Lesson Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>

        {/* Video Overlay Control Simulation */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 cursor-pointer" onClick={togglePlay}>
            <div className="w-16 h-16 rounded-full bg-sky-500/90 text-white flex items-center justify-center shadow-xl shadow-sky-500/30 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
            <p className="text-sm font-medium text-slate-200">Click to Play Lesson & Begin Verification</p>
          </div>
        )}
      </div>

      {/* Verified Watch Progress Engine Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span className="flex items-center space-x-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Verified Progress: <strong className="text-white">{watchedPercent}%</strong></span>
          </span>
          <span className="text-slate-400">
            Required Threshold: <strong className="text-sky-400">{requiredWatchPercent}%</strong>
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30'
                : 'bg-gradient-to-r from-sky-500 to-indigo-500'
            }`}
            style={{ width: `${watchedPercent}%` }}
          ></div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between pt-1">
          {isCompleted ? (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Video Watch Requirement Satisfied ✓</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-xs text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span>Watch to {requiredWatchPercent}% to fulfill lesson requirement</span>
            </div>
          )}

          <button
            onClick={togglePlay}
            className="text-xs text-slate-300 hover:text-sky-400 underline"
          >
            {isPlaying ? 'Pause Tracker' : 'Resume Video'}
          </button>
        </div>
      </div>
    </div>
  );
}
