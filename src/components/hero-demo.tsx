'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Icon } from './icon';
import type { IconName } from './icon-paths';

type Demo = Dictionary['hero']['demo'];
type Segment = { text: string; service?: string; tone?: string };

const photos = [
  { src: '/photos/home.webp', icon: 'house' as IconName, position: '50% 60%' },
  { src: '/photos/garden.webp', icon: 'sprout' as IconName, position: '45% 50%' },
  { src: '/photos/office.webp', icon: 'briefcase' as IconName, position: '50% 35%' },
];

const tones: Record<string, { mark: string; chip: string; dot: string }> = {
  mint: { mark: 'bg-mint-100/80', chip: 'bg-mint-50 text-mint-ink ring-mint-100', dot: 'bg-mint-d' },
  blue: { mark: 'bg-blue-50', chip: 'bg-blue-50 text-[#055a8c] ring-blue/15', dot: 'bg-blue' },
  amber: { mark: 'bg-amber-50', chip: 'bg-amber-50 text-[#99560f] ring-amber/20', dot: 'bg-amber' },
};

const TYPE_MS = 36;
const CHIP_MS = 420;
const HOLD_MS = 2600;

function subscribeReducedMotion(callback: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
const getReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function HeroDemo({ t }: { t: Demo }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState({ typed: 0, chips: 0 });
  const [playing, setPlaying] = useState(true);
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const animating = playing && !reduced;

  const scenario = t.scenarios[index].segments as Segment[];
  const starts = useMemo(() => scenario.map((_, i) => scenario.slice(0, i).reduce((n, s) => n + s.text.length, 0)), [scenario]);
  const fullLength = scenario.reduce((n, s) => n + s.text.length, 0);
  const services = scenario.filter((s) => s.service);
  const duration = fullLength * TYPE_MS + services.length * CHIP_MS + HOLD_MS;
  const count = t.scenarios.length;

  // Typing → recognised services → hold → next place. State only changes when
  // a new character or chip appears, not on every animation frame.
  useEffect(() => {
    if (!animating) return;
    const startedAt = performance.now();
    const typingEnds = fullLength * TYPE_MS;
    let last = '';
    let frame = requestAnimationFrame(function tick(now) {
      const elapsed = now - startedAt;
      if (elapsed >= duration) {
        setIndex((i) => (i + 1) % count);
        setProgress({ typed: 0, chips: 0 });
        return;
      }
      const typed = Math.min(fullLength, Math.floor(elapsed / TYPE_MS));
      const chips = elapsed < typingEnds ? 0 : Math.min(services.length, Math.floor((elapsed - typingEnds) / CHIP_MS));
      const key = `${typed}:${chips}`;
      if (key !== last) {
        last = key;
        setProgress({ typed, chips });
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [animating, index, duration, fullLength, services.length, count]);

  const typed = animating ? progress.typed : fullLength;
  const chips = animating ? progress.chips : services.length;
  const choose = (i: number) => {
    setIndex(i);
    setProgress({ typed: 0, chips: 0 });
  };

  const rendered = scenario.map((segment, i) => {
    const start = starts[i];
    const end = start + segment.text.length;
    const visible = segment.text.slice(0, Math.max(0, typed - start));
    if (!visible) return null;
    const complete = typed >= end;
    if (!segment.service) return <span key={i}>{visible}</span>;
    const tone = tones[segment.tone ?? 'mint'];
    return (
      <mark
        key={i}
        className={`rounded-[6px] px-0.5 text-ink transition-colors duration-500 ${complete ? tone.mark : 'bg-transparent'}`}
      >
        {visible}
      </mark>
    );
  });

  return (
    <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
      <div className="relative aspect-[4/4.3] sm:aspect-[5/4.6] lg:aspect-[5/5.2]">
        {/* Photo panel */}
        <div className="absolute right-0 top-0 h-[74%] w-full overflow-hidden rounded-[28px] bg-teal-100 shadow-2 sm:h-[80%] sm:w-[84%] lg:rounded-[32px]">
          {photos.map((photo, i) => (
            <Image
              key={photo.src}
              src={photo.src}
              alt=""
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 560px, (min-width: 640px) 80vw, 100vw"
              className={`object-cover transition-[opacity,transform] duration-[1200ms] ease-out ${
                i === index ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
              }`}
              style={{ objectPosition: photo.position }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-deep/35 via-transparent to-deep/10" />

          {/* Place switcher */}
          <div
            role="group"
            aria-label={t.preview}
            className="absolute left-3 top-3 flex gap-1 rounded-full bg-white/85 p-1 shadow-1 backdrop-blur sm:left-4 sm:top-4"
          >
            {t.places.map((place, i) => (
              <button
                key={place}
                type="button"
                aria-pressed={i === index}
                onClick={() => choose(i)}
                className={`relative flex h-9 items-center gap-1.5 overflow-hidden rounded-full px-3 font-display text-[14px] font-semibold transition-colors ${
                  i === index ? 'bg-deep text-white' : 'text-ink-2 hover:text-ink'
                }`}
              >
                <Icon name={photos[i].icon} size={16} />
                {place}
                {i === index && animating && (
                  <span
                    key={`${index}-progress`}
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-[3px] bg-mint"
                    style={{ animation: `lq-progress ${duration}ms linear forwards` }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Composer card — recreated from the platform's "What do you need?" box */}
        <div
          className="absolute bottom-0 left-0 w-[94%] rounded-[24px] bg-white p-5 shadow-3 ring-1 ring-line/70 sm:w-[78%] sm:p-6"
          aria-live="off"
        >
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold text-ink">{t.label}</span>
            <span className="text-subtle">{t.anyLanguage}</span>
          </div>
          <p className="sr-only">{scenario.map((segment) => segment.text).join('')}</p>
          <p aria-hidden="true" className="mt-3 min-h-[3.2em] font-display text-[19px] leading-[1.45] text-ink sm:text-[21px]">
            {rendered}
            {animating && (
              <span aria-hidden="true" className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-pulse bg-teal" />
            )}
          </p>
          <div className="mt-4 border-t border-line pt-4">
            {chips > 0 ? (
              <p className="flex items-center gap-2 text-[13px] font-semibold text-mint-ink">
                <Icon name="match" size={16} />
                {t.found.replace('{count}', String(services.length))}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-[13px] font-semibold text-subtle">
                <span aria-hidden="true" className="flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <span key={dot} className="size-1.5 animate-pulse rounded-full bg-teal/60" style={{ animationDelay: `${dot * 180}ms` }} />
                  ))}
                </span>
                {t.recognising}
              </p>
            )}
            <ul className="mt-2.5 flex min-h-[34px] flex-wrap gap-2">
              {services.map((s, i) => {
                const tone = tones[s.tone ?? 'mint'];
                return (
                  <li
                    key={`${index}-${s.service}`}
                    className={`inline-flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-[13px] font-semibold ring-1 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${tone.chip} ${
                      i < chips ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-1 scale-95 opacity-0'
                    }`}
                  >
                    <span className={`flex size-5 items-center justify-center rounded-full text-white ${tone.dot}`}>
                      <Icon name="check" size={12} strokeWidth={2.5} />
                    </span>
                    {s.service}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 pl-1 text-[13px] text-subtle sm:justify-end">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-mint" aria-hidden="true" />
          {t.preview}
        </span>
        {!reduced && (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 font-semibold text-ink-2 ring-1 ring-line hover:bg-white"
          >
            {playing ? (
              <>
                <span aria-hidden="true" className="flex gap-[3px]">
                  <span className="h-3 w-[3px] rounded bg-current" />
                  <span className="h-3 w-[3px] rounded bg-current" />
                </span>
                {t.pause}
              </>
            ) : (
              <>
                <Icon name="play" size={14} />
                {t.play}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
