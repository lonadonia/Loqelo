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
 * Promo video that plays by itself while its section is on screen, pauses when
 * the visitor scrolls away and continues where it stopped when they come back.
 *
 * It starts with sound whenever the browser allows it (browsers require the
 * visitor to have clicked or tapped the page at least once). Otherwise it starts
 * muted and the sound comes on with the visitor's first click or tap anywhere,
 * or with the "Turn sound on" button. Nothing is downloaded until the visitor is
 * close; with reduced motion or data saving it waits for a click instead.
 */
export function VideoPlayer({ playLabel, videoLabel, duration, unmuteLabel }: Props) {
  const autoplay = useSyncExternalStore(subscribeMotion, canAutoplay, () => true);
  const wrapper = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inView = useRef(false);
  const selfPausing = useRef(false);
  const userPaused = useRef(false);
  const userMuted = useRef(false);
  const expectedMuted = useRef(false);
  const reported = useRef(new Set<number>());
  const played = useRef(false);
  const [src, setSrc] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [manualStarted, setManualStarted] = useState(false);

  /** Changes made by this component (not by the visitor through the video controls). */
  const setVideoMuted = (v: HTMLVideoElement, value: boolean) => {
    expectedMuted.current = value;
    v.muted = value;
    setMuted(value);
  };

  /** Play with sound if allowed, otherwise muted (sound follows on the next click). */
  const playNow = () => {
    const v = video.current;
    if (!v || !v.currentSrc || userPaused.current) return;
    if (v.ended) v.currentTime = 0;
    if (!v.paused) return;
    setVideoMuted(v, userMuted.current);
    v.play().catch(() => {
      setVideoMuted(v, true);
      void v.play().catch(() => undefined);
    });
  };

  const unmute = () => {
    const v = video.current;
    if (!v) return;
    userMuted.current = false;
    setVideoMuted(v, false);
    if (v.paused && inView.current) void v.play().catch(() => undefined);
    track('promo_video_unmute');
  };

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
    // Play while at least half of the video is visible; pause (keeping the position) otherwise.
    const view = new IntersectionObserver(
      ([entry]) => {
        const v = video.current;
        const visible = entry.intersectionRatio >= 0.5;
        if (visible === inView.current) return;
        inView.current = visible;
        if (!v) return;
        if (visible) {
          playNow();
        } else {
          userPaused.current = false;
          if (!v.paused) {
            selfPausing.current = true;
            v.pause();
          }
        }
      },
      { threshold: [0, 0.5, 0.75] },
    );
    near.observe(el);
    view.observe(el);

    // The first click/tap/key press anywhere unlocks sound in every browser.
    const onFirstInteraction = (event: Event) => {
      const v = video.current;
      if (!v || userMuted.current || (event.target instanceof Node && v.contains(event.target))) return;
      if (v.muted && inView.current) {
        setVideoMuted(v, false);
        if (v.paused) void v.play().catch(() => undefined);
      }
    };
    window.addEventListener('pointerdown', onFirstInteraction, { capture: true });
    window.addEventListener('keydown', onFirstInteraction, { capture: true });
    return () => {
      near.disconnect();
      view.disconnect();
      window.removeEventListener('pointerdown', onFirstInteraction, { capture: true });
      window.removeEventListener('keydown', onFirstInteraction, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- playNow and setVideoMuted only use refs and a state setter
  }, [autoplay]);

  const startManually = () => {
    if (!video.current) return;
    setSrc(pickSource(video.current));
    setManualStarted(true);
    inView.current = true;
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
        playsInline
        preload={src ? 'auto' : 'none'}
        controls={!!src}
        aria-label={videoLabel}
        onCanPlay={() => {
          if (inView.current) playNow();
        }}
        onPlay={() => {
          if (!played.current) {
            played.current = true;
            track('promo_video_play');
          }
        }}
        onPause={() => {
          // A pause we did not cause comes from the visitor: respect it until they scroll away.
          if (!selfPausing.current && !video.current?.ended) userPaused.current = true;
          selfPausing.current = false;
        }}
        onVolumeChange={(e) => {
          const v = e.currentTarget;
          // A change we did not make comes from the video controls: remember the visitor's choice.
          if (v.muted !== expectedMuted.current) {
            userMuted.current = v.muted;
            expectedMuted.current = v.muted;
          }
          setMuted(v.muted);
        }}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => track('promo_video_complete')}
      />

      {!!src && muted && (
        <button
          type="button"
          onClick={unmute}
          className="absolute right-4 top-4 inline-flex h-11 items-center gap-2 rounded-full bg-white/95 px-4 font-display text-[15px] font-semibold text-ink shadow-2 backdrop-blur transition-transform hover:scale-[1.03] sm:right-6 sm:top-6"
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
