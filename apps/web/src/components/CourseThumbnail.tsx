'use client';

import React, { useState } from 'react';
import { Play, Image as ImageIcon, Video, Film, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface CourseThumbnailProps {
  thumbnailUrl?: string | null;
  thumbnailType?: 'image' | 'video' | string | null;
  category?: string;
  title?: string;
  className?: string;
  aspectRatio?: string;
  showBadge?: boolean;
  autoPlayVideo?: boolean;
}

export const DEFAULT_CATEGORY_THUMBNAILS: Record<string, string> = {
  'Computer Science': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
  'Full-Stack Dev': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  'AI & Data Science': 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
  'Systems': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
  'DEFAULT': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
};

// Default sample video loops for course previews
export const SAMPLE_VIDEO_THUMBNAILS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
];

export function CourseThumbnail({
  thumbnailUrl,
  thumbnailType = 'image',
  category = 'Computer Science',
  title = 'Course',
  className = '',
  aspectRatio = 'aspect-video',
  showBadge = true,
  autoPlayVideo = false,
}: CourseThumbnailProps) {
  const { dict } = useLanguage();
  const [imgError, setImgError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlayVideo);
  const [isMuted, setIsMuted] = useState(true);

  const fallbackImage = DEFAULT_CATEGORY_THUMBNAILS[category] || DEFAULT_CATEGORY_THUMBNAILS.DEFAULT;
  const activeUrl = thumbnailUrl && thumbnailUrl.trim() !== '' ? thumbnailUrl : fallbackImage;
  const isVideo = thumbnailType === 'video' || (activeUrl && (activeUrl.endsWith('.mp4') || activeUrl.endsWith('.webm') || activeUrl.includes('video')));

  // Youtube Embed Helper
  const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1` : null;
  };

  const youtubeEmbed = isVideo ? getYoutubeEmbedUrl(activeUrl) : null;

  return (
    <div className={`relative overflow-hidden rounded-2xl group ${aspectRatio} ${className} bg-slate-950`}>
      {isVideo ? (
        youtubeEmbed ? (
          <div className="w-full h-full relative">
            <iframe
              src={youtubeEmbed}
              title={title}
              className="w-full h-full border-0 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            <div className="absolute inset-0 bg-transparent" />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <video
              src={activeUrl}
              poster={fallbackImage}
              muted={isMuted}
              loop
              playsInline
              autoPlay={autoPlayVideo || isPlaying}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Play/Pause & Mute Overlay Controls */}
            <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }}
                className="w-10 h-10 rounded-full bg-sky-500/90 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="w-9 h-9 rounded-full bg-slate-900/80 text-white flex items-center justify-center shadow-md hover:bg-slate-800 transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )
      ) : (
        /* Image Thumbnail */
        <img
          src={imgError ? fallbackImage : activeUrl}
          alt={title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      {/* Media Type Badge */}
      {showBadge && (
        <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase backdrop-blur-md bg-slate-950/70 text-white border border-white/20 shadow-md">
          {isVideo ? (
            <>
              <Video className="w-3 h-3 text-sky-400" />
              <span>{dict.verifiedCourse}</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-3 h-3 text-emerald-400" />
              <span>{dict.verifiedCourse}</span>
            </>
          )}
        </div>
      )}

      {/* Gradient Overlay Shadow */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60 pointer-events-none" />
    </div>
  );
}
