'use client';

import { useEffect, useRef, useState } from 'react';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { PhoneFrame, ScreenCard, screens, type ScreenKey } from '../frames';
import { Icon } from '../icon';
import type { IconName } from '../icon-paths';

const stepScreens: ScreenKey[] = ['stepDescribe', 'stepMatch', 'stepOffers', 'mobileOffers'];
const stepIcons: IconName[] = ['edit', 'match', 'layers', 'check'];

function StepScreen({ screen, alt, stage = false }: { screen: ScreenKey; alt: string; stage?: boolean }) {
  const s = screens[screen];
  if (screen.startsWith('mobile')) {
    return (
      <PhoneFrame
        {...s}
        alt={alt}
        sizes="(min-width: 1024px) 240px, 70vw"
        className={stage ? 'mx-auto w-[200px] xl:w-[230px]' : 'mx-auto w-[min(300px,72%)]'}
      />
    );
  }
  return <ScreenCard {...s} alt={alt} sizes="(min-width: 1024px) 640px, 100vw" />;
}

export function HowItWorks({ t }: { t: Dictionary['how'] }) {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" aria-labelledby="how-title" className="bg-white py-20 sm:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center" data-reveal>
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="how-title" className="mt-3 text-[clamp(2.2rem,4.6vw,3.75rem)] leading-[1.04]">
            {t.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-2">{t.lead}</p>
        </div>

        <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-12">
          <ol className="relative lg:col-span-5">
            {/* progress rail */}
            <span aria-hidden="true" className="absolute bottom-6 left-[23px] top-6 hidden w-[2px] rounded bg-line lg:block">
              <span
                className="block w-full rounded bg-teal transition-[height] duration-500 ease-out"
                style={{ height: `${(active / (t.steps.length - 1)) * 100}%` }}
              />
            </span>
            {t.steps.map((step, i) => (
              <li
                key={step.title}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                data-step={i}
                aria-current={active === i ? 'step' : undefined}
                className="relative pb-12 last:pb-0 lg:flex lg:min-h-[52vh] lg:items-center lg:pb-0"
              >
                <div className="flex gap-5">
                  <span
                    className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full font-display text-[15px] font-semibold transition-colors duration-500 ${
                      active === i ? 'bg-teal text-white shadow-[0_8px_20px_-8px_rgba(7,126,136,0.8)]' : 'bg-white text-teal ring-2 ring-teal-100'
                    }`}
                  >
                    <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <span className="sr-only">{t.stepLabel.replace('{n}', String(i + 1))}</span>
                  </span>
                  <div className="lg:max-w-md">
                    <h3
                      className={`flex items-center gap-2 pt-2 text-[26px] leading-tight transition-colors duration-500 sm:text-3xl ${
                        active === i ? 'text-ink' : 'lg:text-subtle'
                      }`}
                    >
                      {step.title}
                      <Icon name={stepIcons[i]} size={22} className="text-mint-ink" />
                    </h3>
                    <p className={`mt-3 text-[17px] leading-relaxed transition-colors duration-500 ${active === i ? 'text-ink-2' : 'text-ink-2 lg:text-subtle'}`}>
                      {step.text}
                    </p>
                  </div>
                </div>
                {/* Mobile and tablet: screen right under its step */}
                <div className="mt-6 lg:hidden">
                  <StepScreen screen={stepScreens[i]} alt={step.alt} />
                </div>
              </li>
            ))}
          </ol>

          {/* Desktop: sticky stage that follows the active step */}
          <div className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-[110px]">
              <div className="relative flex aspect-[16/12] items-center justify-center overflow-hidden rounded-[32px] bg-[linear-gradient(160deg,var(--color-teal-50),var(--color-bg)_55%,var(--color-mint-50))] p-8 ring-1 ring-line/70">
                {t.steps.map((step, i) => (
                  <div
                    key={step.title}
                    aria-hidden={active !== i}
                    className={`absolute inset-8 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${
                      active === i ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
                    }`}
                  >
                    <div className="w-full">
                      <StepScreen screen={stepScreens[i]} alt={step.alt} stage />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-subtle">
                <span className="size-1.5 rounded-full bg-mint" aria-hidden="true" />
                {t.note}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-10 flex items-center justify-center gap-2 text-[13px] text-subtle lg:hidden">
          <span className="size-1.5 rounded-full bg-mint" aria-hidden="true" />
          {t.note}
        </p>
      </div>
    </section>
  );
}
