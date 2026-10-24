'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { track } from '@/lib/analytics';
import { Icon } from './icon';

type Props = { playLabel: string; videoLabel: string; duration: string; unmuteLabel: string };

const POSTER = '/media/loqelo-promo-poster.webp';

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
/** Autoplay only when the visitor allows motion and is not saving data. */
function canAutoplay() {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !saveData;
}

/** H.264 where supported (all major browsers), WebM otherwise; 1080p only on large screens. */
function pickSource(video: HTMLVideoElement) {
  const h264 = video.canPlayType('video/mp4; codecs="avc1.640028"') !== '';
  if (!h264) return '/media/loqelo-promo-720p.webm';
  const large = window.matchMedia('(min-width: 1024px)').matches;
  return large ? '/media/loqelo-promo-1080p.mp4' : '/media/loqelo-promo-720p.mp4';
}

/**
 * Promo video. It starts muted when scrolled into view (browsers only allow
 * muted autoplay) and pauses when scrolled away. Nothing is downloaded until
 * the visitor gets close. With reduced motion or data saving it waits for a click.
 */
export function VideoPlayer({ playLabel, videoLabel, duration, unmuteLabel }: Props) {
  const autoplay = useSyncExternalStore(subscribeMotion, canAutoplay, () => true);
  const wrapper = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const visible = useRef(false);
  const reported = useRef(new Set<number>());
  const played = useRef(false);
  const [src, setSrc] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [manualStarted, setManualStarted] = useState(false);

  useEffect(() => {
    if (!autoplay || !wrapper.current) return;
    const el = wrapper.current;
    // Start loading shortly before the video reaches the screen.
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && video.current) {
          setSrc((current) => current ?? pickSource(video.current!));
          near.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );
    // Play while at least half of it is visible, pause otherwise.
    const view = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.intersectionRatio >= 0.5;
        const v = video.current;
        if (!v) return;
        if (visible.current) void v.play().catch(() => undefined);
        else if (!v.paused) v.pause();
      },
      { threshold: [0, 0.5, 0.75] },
    );
    near.observe(el);
    view.observe(el);
    return () => {
      near.disconnect();
      view.disconnect();
    };
  }, [autoplay]);

  const startManually = () => {
    if (!video.current) return;
    setSrc(pickSource(video.current));
    setMuted(false);
    setManualStarted(true);
    visible.current = true;
  };

  const unmute = () => {
    const v = video.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = false;
    setMuted(false);
    void v.play().catch(() => undefined);
    track('promo_video_unmute');
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

  const showPlayButton = !autoplay && !manualStarted;

  return (
    <div ref={wrapper} className="relative aspect-video w-full overflow-hidden rounded-[22px] bg-deep shadow-3 ring-1 ring-white/10 sm:rounded-[32px]">
      <video
        ref={video}
        className="h-full w-full bg-black object-cover"
        src={src ?? undefined}
        poster={POSTER}
        muted={muted}
        playsInline
        preload={src ? 'auto' : 'none'}
        controls={!!src && (!muted || !autoplay)}
        aria-label={videoLabel}
        onCanPlay={(e) => {
          if (visible.current && e.currentTarget.paused && !e.currentTarget.ended) void e.currentTarget.play().catch(() => undefined);
        }}
        onPlay={() => {
          if (!played.current) {
            played.current = true;
            track('promo_video_play');
          }
        }}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => track('promo_video_complete')}
      />

      {autoplay && muted && (
        <button
          type="button"
          onClick={unmute}
          className="absolute bottom-4 right-4 inline-flex h-11 items-center gap-2 rounded-full bg-white/95 px-4 font-display text-[15px] font-semibold text-ink shadow-2 backdrop-blur transition-transform hover:scale-[1.03] sm:bottom-6 sm:right-6"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4V5z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
          {unmuteLabel}
        </button>
      )}

      {showPlayButton && (
        <button type="button" onClick={startManually} className="group absolute inset-0 h-full w-full text-left">
          <Image src={POSTER} alt="" fill sizes="(min-width: 1240px) 1160px, 100vw" className="object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-deep/70 via-deep/10 to-transparent" />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <span className="relative flex size-20 items-center justify-center rounded-full bg-white text-teal shadow-3 transition-transform duration-300 group-hover:scale-105 sm:size-24">
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
