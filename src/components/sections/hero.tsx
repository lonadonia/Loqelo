import type { Dictionary } from '@/lib/i18n/dictionaries';
import { HeroDemo } from '../hero-demo';
import { Icon } from '../icon';
import { JoinLink } from '../join-link';

export function Hero({ t }: { t: Dictionary['hero'] }) {
  const words = t.tagline.trim().split(' ');
  const last = words.pop();

  return (
    <section id="top" aria-labelledby="hero-title" className="relative -mt-[72px] overflow-hidden pb-16 pt-[96px] sm:pb-20 lg:pb-28 lg:pt-[112px]">
      {/* Soft brand light: teal and mint from the logo gradient */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[20%] -top-[30%] h-[720px] w-[720px] rounded-full bg-[radial-gradient(closest-side,rgba(101,200,166,0.22),transparent)]" />
        <div className="absolute -right-[10%] top-[10%] h-[640px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(7,126,136,0.12),transparent)]" />
      </div>

      <div className="container-page relative grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6 xl:pr-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- official SVG logo */}
          <img
            id="hero-logo"
            src="/brand/loqelo-logo.svg"
            alt="Loqelo"
            width={281}
            height={72}
            className="h-14 w-auto animate-rise sm:h-16 lg:h-[72px]"
            fetchPriority="high"
          />

          <p className="mt-8 inline-flex animate-rise items-center gap-2.5 rounded-full bg-white py-1.5 pl-2 pr-4 text-[14px] font-semibold text-ink shadow-1 ring-1 ring-line [animation-delay:80ms]">
            <span className="relative flex size-6 items-center justify-center rounded-full bg-teal-50 text-teal">
              <Icon name="calendar" size={14} />
            </span>
            {t.badge}
          </p>

          <h1
            id="hero-title"
            lang="en"
            className="mt-5 animate-rise font-display text-[clamp(3rem,7.4vw,6.4rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-ink [animation-delay:140ms]"
          >
            {words.join(' ')} <span className="text-teal">{last}</span>
          </h1>
          {t.taglineTranslation && (
            <p className="mt-3 animate-rise font-display text-xl font-medium text-ink-2 [animation-delay:180ms]">
              {t.taglineTranslation}
            </p>
          )}

          <p className="mt-6 max-w-[34rem] animate-rise text-lg leading-relaxed text-ink-2 sm:text-[19px] [animation-delay:220ms]">
            {t.lead}
          </p>

          <div className="mt-8 flex animate-rise flex-col gap-3 sm:flex-row sm:flex-wrap [animation-delay:280ms]">
            <JoinLink audience="customer" location="hero" className="btn btn-primary min-h-14 px-7 text-[17px]">
              <Icon name="house" size={20} />
              {t.ctaCustomer}
              <span className="sr-only"> — {t.ctaCustomerHint}</span>
            </JoinLink>
            <JoinLink audience="provider" location="hero" className="btn btn-dark min-h-14 px-7 text-[17px]">
              <Icon name="helmet" size={20} />
              {t.ctaProvider}
              <span className="sr-only"> — {t.ctaProviderHint}</span>
            </JoinLink>
          </div>

          <p className="mt-5 flex animate-rise items-center gap-2 text-[14px] text-subtle [animation-delay:320ms]">
            <Icon name="shield" size={16} className="shrink-0 text-mint-ink" />
            {t.note}
          </p>
        </div>

        <div className="animate-rise lg:col-span-6 [animation-delay:200ms]">
          <HeroDemo t={t.demo} />
        </div>
      </div>
    </section>
  );
}
