'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { track } from '@/lib/analytics';
import { Icon } from './icon';

type Props = { playLabel: string; videoLabel: string; duration: string };

/**
 * Click-to-play promo video. Nothing is downloaded until the visitor presses
 * play; small screens and data-saver connections get the 720p file.
 */
export function VideoPlayer({ playLabel, videoLabel, duration }: Props) {
  const [started, setStarted] = useState(false);
  const [src, setSrc] = useState('/media/loqelo-promo-720p.mp4');
  const video = useRef<HTMLVideoElement>(null);
  const reported = useRef(new Set<number>());

  const start = () => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const large = window.matchMedia('(min-width: 1024px) and (min-resolution: 1dppx)').matches;
    setSrc(large && !connection?.saveData ? '/media/loqelo-promo-1080p.mp4' : '/media/loqelo-promo-720p.mp4');
    setStarted(true);
    track('promo_video_play');
    requestAnimationFrame(() => {
      video.current?.focus();
      void video.current?.play().catch(() => undefined);
    });
  };

  const onTimeUpdate = () => {
    const el = video.current;
    if (!el?.duration) return;
    const percent = (el.currentTime / el.duration) * 100;
    for (const mark of [25, 50, 75] as const) {
      if (percent >= mark && !reported.current.has(mark)) {
        reported.current.add(mark);
        track('promo_video_progress', { percent: mark });
      }
    }
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[22px] bg-deep shadow-3 ring-1 ring-white/10 sm:rounded-[32px]">
      {started ? (
        <video
          ref={video}
          className="h-full w-full bg-black object-contain"
          controls
          playsInline
          preload="auto"
          poster="/media/loqelo-promo-poster.webp"
          aria-label={videoLabel}
          onTimeUpdate={onTimeUpdate}
          onEnded={() => track('promo_video_complete')}
        >
          <source src={src} type="video/mp4" />
          {/* Open-codec fallback for browsers without H.264 support */}
          <source src="/media/loqelo-promo-720p.webm" type="video/webm" />
        </video>
      ) : (
        <button type="button" onClick={start} className="group absolute inset-0 h-full w-full text-left">
          <Image
            src="/media/loqelo-promo-poster.webp"
            alt=""
            fill
            sizes="(min-width: 1240px) 1160px, 100vw"
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.02]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-deep/70 via-deep/10 to-transparent" />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <span className="relative flex size-20 items-center justify-center rounded-full bg-white text-teal shadow-3 transition-transform duration-300 group-hover:scale-105 sm:size-24">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/40 [animation-duration:2.4s] motion-reduce:hidden" />
              <Icon name="play" size={34} strokeWidth={2} className="relative translate-x-0.5" />
            </span>
            <span className="sr-only sm:not-sr-only sm:rounded-full sm:bg-deep/75 sm:px-4 sm:py-2 sm:font-display sm:text-[15px] sm:font-semibold sm:text-white sm:backdrop-blur">
              {playLabel} · {duration}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
