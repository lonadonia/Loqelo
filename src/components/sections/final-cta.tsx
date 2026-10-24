import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Icon } from '../icon';
import { JoinLink } from '../join-link';

export function FinalCta({ t, tagline }: { t: Dictionary['finalCta']; tagline: string }) {
  return (
    <section aria-labelledby="final-title" className="px-3 pb-3 sm:px-6 sm:pb-6">
      <div className="on-dark relative overflow-hidden rounded-[32px] bg-teal px-6 py-16 text-white sm:rounded-[40px] sm:px-12 sm:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full bg-[radial-gradient(closest-side,rgba(101,200,166,0.55),transparent)]" />
          <div className="absolute -bottom-40 -left-20 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(3,28,38,0.55),transparent)]" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center" data-reveal>
          <p lang="en" className="font-display text-lg font-semibold text-white">
            {tagline}
          </p>
          <h2 id="final-title" className="mt-3 text-[clamp(2.6rem,6vw,4.75rem)] leading-[1]">
            {t.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white">{t.text}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <JoinLink audience="customer" location="final" className="btn min-h-14 bg-white px-7 text-[17px] text-teal-d hover:bg-mint-50">
              <Icon name="house" size={20} />
              {t.customer}
            </JoinLink>
            <JoinLink audience="provider" location="final" className="btn btn-dark min-h-14 px-7 text-[17px]">
              <Icon name="helmet" size={20} />
              {t.provider}
            </JoinLink>
          </div>
        </div>
      </div>
    </section>
  );
}
