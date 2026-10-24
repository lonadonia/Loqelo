'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Icon } from './icon';
import type { IconName } from './icon-paths';
import { JoinLink } from './join-link';

type Hero = Dictionary['hero'];
type Segment = { text: string; service?: string; tone?: string };

// One photo, place icon and set of chip icons per demo scenario (home, garden, office).
const scenes: { photo: string; position: string; place: IconName; detail: IconName; chips: IconName[] }[] = [
  { photo: '/photos/office.webp', position: '50% 30%', place: 'house', detail: 'grid', chips: ['house', 'grid'] },
  { photo: '/photos/garden.webp', position: '62% 50%', place: 'sprout', detail: 'sprout', chips: ['sprout', 'leaf'] },
  { photo: '/photos/installations-lg.webp', position: '40% 50%', place: 'briefcase', detail: 'bolt', chips: ['bolt', 'briefcase'] },
];

const tones: Record<string, { mark: string; dot: string }> = {
  mint: { mark: 'bg-mint-100/80', dot: 'bg-mint-d' },
  blue: { mark: 'bg-blue-50', dot: 'bg-blue' },
  amber: { mark: 'bg-amber-50', dot: 'bg-amber' },
};

const TYPE_MS = 38;
const CHIP_MS = 380;
const HOLD_MS = 2800;
const MAX_CYCLES = 2;

function subscribeReducedMotion(callback: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
const getReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The hero's interactive part, modelled on the Loqelo Home design: a request
 * being typed into the "What do you need?" box, the services Loqelo recognises,
 * and the matching photo with floating detail cards. The animation holds while
 * the pointer or keyboard focus is on it, stops after two rounds, and is static
 * for visitors who prefer reduced motion.
 */
export function HeroStage({ t, intro, footer }: { t: Hero; intro: ReactNode; footer: ReactNode }) {
  const demo = t.demo;
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState({ typed: 0, chips: 0 });
  const [finished, setFinished] = useState(false);
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const held = useRef(false);
  const manual = useRef(false);
  const advances = useRef(0);
  const animating = !reduced && !finished;

  const scenario = demo.scenarios[index];
  const segments = scenario.segments as Segment[];
  const starts = useMemo(() => segments.map((_, i) => segments.slice(0, i).reduce((n, s) => n + s.text.length, 0)), [segments]);
  const fullLength = segments.reduce((n, s) => n + s.text.length, 0);
  const services = segments.filter((s) => s.service);
  const count = demo.scenarios.length;

  useEffect(() => {
    if (!animating) return;
    const typingEnds = fullLength * TYPE_MS;
    const duration = typingEnds + services.length * CHIP_MS + HOLD_MS;
    let last = '';
    let startedAt = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const elapsed = now - startedAt;
      if (elapsed >= duration) {
        if (manual.current) {
          setFinished(true);
          return;
        }
        if (held.current) {
          // Keep the finished request on screen while someone is looking at it.
          startedAt = now - duration;
          frame = requestAnimationFrame(tick);
          return;
        }
        advances.current += 1;
        if (advances.current >= count * MAX_CYCLES) {
          setIndex(0);
          setFinished(true);
          return;
        }
        setIndex((i) => (i + 1) % count);
        setProgress({ typed: 0, chips: 0 });
        return;
      }
      const typed = Math.min(fullLength, Math.floor(elapsed / TYPE_MS));
      const chips = elapsed < typingEnds ? 0 : Math.min(services.length, Math.floor((elapsed - typingEnds) / CHIP_MS) + 1);
      const key = `${typed}:${chips}`;
      if (key !== last) {
        last = key;
        setProgress({ typed, chips });
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [animating, index, fullLength, services.length, count]);

  const typed = animating ? progress.typed : fullLength;
  const chips = animating ? progress.chips : services.length;

  const choose = (i: number) => {
    manual.current = true;
    setFinished(false);
    setIndex(i);
    setProgress({ typed: 0, chips: 0 });
  };

  const sentence = segments.map((segment, i) => {
    const start = starts[i];
    const visible = segment.text.slice(0, Math.max(0, typed - start));
    if (!visible) return null;
    if (!segment.service) return <span key={i}>{visible}</span>;
    const complete = typed >= start + segment.text.length;
    return (
      <mark
        key={i}
        className={`rounded-[6px] px-1 text-ink transition-colors duration-500 ${complete ? tones[segment.tone ?? 'mint'].mark : 'bg-transparent'}`}
      >
        {visible}
      </mark>
    );
  });

  const hold = {
    onPointerEnter: () => (held.current = true),
    onPointerLeave: () => (held.current = false),
    onFocusCapture: () => (held.current = true),
    onBlurCapture: () => (held.current = false),
  };

  return (
    <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-7 xl:pr-6">
        {intro}

        {/* "What do you need?" request box */}
        <div {...hold} className="mt-8 overflow-hidden rounded-[24px] bg-white shadow-2 ring-1 ring-line/80 lg:max-w-[720px]">
          <div className="px-5 pt-5 sm:px-7 sm:pt-6">
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="font-semibold text-ink-2">{demo.label}</span>
              <span className="text-subtle">{demo.anyLanguage}</span>
            </div>
            <p className="sr-only">{segments.map((s) => s.text).join('')}</p>
            <p aria-hidden="true" className="mt-3 min-h-[2.9em] font-display text-[19px] font-medium leading-[1.45] text-ink sm:min-h-[1.45em] sm:text-[22px]">
              {sentence}
              {animating && typed < fullLength && (
                <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-pulse bg-teal" />
              )}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 pb-5 sm:pb-6">
              <span aria-hidden="true" className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] text-ink ring-1 ring-line">
                <Icon name="mic" size={16} />
                {demo.speak}
              </span>
              <span aria-hidden="true" className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] text-ink ring-1 ring-line">
                <Icon name="pin" size={16} />
                {scenario.city}
              </span>
              <JoinLink audience="customer" location="hero" className="btn btn-primary mt-2 min-h-[52px] w-full px-7 text-[16px] sm:ml-auto sm:mt-0 sm:w-auto">
                {demo.cta}
                <Icon name="arrowRight" size={18} strokeWidth={2} />
              </JoinLink>
            </div>
          </div>

          <div className="border-t border-line bg-[#f6faf8] px-5 py-4 sm:px-7">
            <p className={`flex items-center gap-2 text-[13px] font-semibold ${chips > 0 ? 'text-mint-ink' : 'text-subtle'}`}>
              {chips > 0 ? (
                <>
                  <Icon name="match" size={16} />
                  {demo.found.replace('{count}', String(services.length))}
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                      <span key={dot} className="size-1.5 animate-pulse rounded-full bg-teal/60" style={{ animationDelay: `${dot * 180}ms` }} />
                    ))}
                  </span>
                  {demo.recognising}
                </>
              )}
            </p>
            <ul className="mt-3 flex min-h-[38px] flex-wrap gap-2">
              {services.map((s, i) => (
                <li
                  key={`${index}-${s.service}`}
                  className={`inline-flex items-center gap-2 rounded-full bg-mint-50 py-1.5 pl-1.5 pr-3 text-[14px] text-ink ring-1 ring-mint-100 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
                    i < chips ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-1 scale-95 opacity-0'
                  }`}
                >
                  <span className={`flex size-6 items-center justify-center rounded-full text-white ${tones[s.tone ?? 'mint'].dot}`}>
                    <Icon name={scenes[index].chips[i] ?? 'check'} size={13} strokeWidth={2} />
                  </span>
                  {s.service}
                  <Icon name="x" size={13} className="text-subtle" />
                </li>
              ))}
              <li
                aria-hidden="true"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] text-ink-2 ring-1 ring-line transition-opacity duration-500 ${
                  chips >= services.length ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Icon name="plus" size={14} />
                {demo.add}
              </li>
            </ul>
          </div>
        </div>

        {footer}
      </div>

      {/* Photo with floating cards (tablet and desktop) */}
      <div {...hold} className="relative mx-auto hidden w-full max-w-[500px] pb-14 pt-4 sm:block lg:col-span-5 lg:mr-0 lg:max-w-none lg:pl-6">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-teal-100 shadow-3">
          {scenes.map((scene, i) => (
            <Image
              key={scene.photo}
              src={scene.photo}
              alt=""
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 480px, 500px"
              className={`object-cover transition-[opacity,transform] duration-[1200ms] ease-out ${i === index ? 'scale-100 opacity-100' : 'scale-[1.05] opacity-0'}`}
              style={{ objectPosition: scene.position }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-deep/25 via-transparent to-transparent" />

          <div role="group" aria-label={demo.preview} className="absolute left-4 top-4 flex gap-1 rounded-full bg-white/85 p-1 shadow-1 backdrop-blur">
            {demo.places.map((place, i) => (
              <button
                key={place}
                type="button"
                aria-pressed={i === index}
                onClick={() => choose(i)}
                className={`flex h-9 items-center gap-1.5 rounded-full px-3 font-display text-[14px] font-semibold transition-colors ${
                  i === index ? 'bg-deep text-white' : 'text-ink-2 hover:text-ink'
                }`}
              >
                <Icon name={scenes[i].place} size={15} />
                {place}
              </button>
            ))}
          </div>
        </div>

        {/* Request detail, top right (as in the design) */}
        <div
          key={`detail-${index}`}
          className="absolute -right-2 top-[16%] flex animate-rise items-center gap-3 rounded-[18px] bg-white py-3 pl-3 pr-5 shadow-2 ring-1 ring-line/70 xl:-right-5"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-teal text-white">
            <Icon name={scenes[index].detail} size={20} />
          </span>
          <span>
            <span className="block text-[12px] text-subtle">{scenario.detailLabel}</span>
            <span className="block whitespace-nowrap font-display text-[16px] font-semibold text-ink">{scenario.detail}</span>
          </span>
        </div>

        {/* Next step, bottom left */}
        <div className="absolute bottom-0 left-0 w-[min(340px,82%)] rounded-[20px] bg-white p-4 shadow-3 ring-1 ring-line/70 lg:-left-2 xl:-left-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue text-white">
              <Icon name="layers" size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] text-subtle">{t.offersCard.label}</span>
              <span className="flex items-center gap-1.5 font-display text-[16px] font-semibold text-ink">
                {t.offersCard.title}
                <Icon name="shield" size={15} className="shrink-0 text-teal" />
              </span>
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="text-[13px] text-subtle">{t.offersCard.meta}</span>
            <span aria-hidden="true" className="flex -space-x-1">
              {[
                ['CP', 'bg-teal'],
                ['GC', 'bg-mint-ink'],
                ['FN', 'bg-blue'],
              ].map(([initials, bg]) => (
                <span key={initials} className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white ${bg}`}>
                  {initials}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
