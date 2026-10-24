import type { Dictionary } from '@/lib/i18n/dictionaries';
import { HeroStage } from '../hero-stage';
import { Icon } from '../icon';
import { JoinLink } from '../join-link';
import type { IconName } from '../icon-paths';

const trustIcons: IconName[] = ['shield', 'bell', 'check'];

export function Hero({ t }: { t: Dictionary['hero'] }) {
  const words = t.tagline.trim().split(' ');
  const last = words.pop();

  const intro = (
    <>
      <p className="inline-flex animate-rise items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-[14px] font-semibold text-ink shadow-1 ring-1 ring-line/80">
        <span className="flex size-7 items-center justify-center rounded-full bg-teal-50">
          {/* eslint-disable-next-line @next/next/no-img-element -- Loqelo mark */}
          <img src="/brand/loqelo-icon.svg" alt="" width={16} height={16} className="size-4" />
        </span>
        {t.badge}
      </p>

      <h1
        id="hero-title"
        lang="en"
        className="mt-6 animate-rise font-display text-[clamp(2.6rem,4.7vw,4.15rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-ink [animation-delay:80ms]"
      >
        {words.join(' ')}{' '}
        <span className="relative inline-block whitespace-nowrap text-teal">
          {last}
          {/* Mint underline stroke, as under “Describe it.” in the design */}
          <svg aria-hidden="true" viewBox="0 0 400 18" preserveAspectRatio="none" className="absolute -bottom-[0.16em] left-[-2%] h-[0.16em] w-[106%] text-mint">
            <path d="M3 13 C 110 4, 260 3, 397 8" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          </svg>
        </span>
      </h1>
      {t.taglineTranslation && (
        <p className="mt-5 animate-rise font-display text-xl font-medium text-ink-2 [animation-delay:120ms]">{t.taglineTranslation}</p>
      )}

      <p className="mt-7 max-w-[38rem] animate-rise text-lg leading-relaxed text-ink-2 sm:text-[19px] [animation-delay:160ms]">{t.lead}</p>
    </>
  );

  const footer = (
    <div className="mt-6 flex flex-col gap-4">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] text-ink-2">
        <span>{t.providerPrompt}</span>
        <JoinLink
          audience="provider"
          location="hero"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 font-display font-semibold text-ink shadow-1 ring-1 ring-line transition-colors hover:ring-faint"
        >
          <Icon name="helmet" size={18} className="text-teal" />
          {t.ctaProviderHint}
          <Icon name="arrowRight" size={16} />
        </JoinLink>
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-subtle">
        {t.trust.map((item, i) => (
          <li key={item} className="inline-flex items-center gap-1.5">
            <Icon name={trustIcons[i] ?? 'check'} size={16} className="text-mint-ink" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative -mt-[76px] overflow-hidden bg-[linear-gradient(180deg,#f4f7f6_0%,#eef4f3_70%,#e9f1f0_100%)] pb-16 pt-[108px] sm:-mt-[92px] sm:pb-20 sm:pt-[132px] lg:pb-20 lg:pt-[128px]"
    >
      {/* Soft brand shapes, like the curved background in the Home design */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[12%] -top-[20%] h-[640px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(101,200,166,0.18),transparent)]" />
        <div className="absolute -bottom-[340px] -left-[180px] h-[640px] w-[640px] rounded-full border-[60px] border-white/45" />
        <div className="absolute -bottom-[260px] left-[140px] h-[420px] w-[420px] rounded-full bg-white/30" />
        <div className="absolute -right-[8%] top-[18%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(7,126,136,0.10),transparent)]" />
      </div>

      <div className="relative mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <HeroStage t={t} intro={intro} footer={footer} />
      </div>
    </section>
  );
}
