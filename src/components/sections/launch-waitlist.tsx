import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { countryOptions } from '@/lib/countries';
import { turnstileSiteKey } from '@/lib/site';
import { WaitlistForm } from '../waitlist-form';

// Countries listed first in the selector for each language (the visitor's
// detected country is added in front of these in the browser).
const suggestedByLocale: Record<Locale, string[]> = {
  en: ['GB', 'IE', 'US'],
  pl: ['PL'],
  de: ['DE', 'AT', 'CH'],
  nl: ['NL', 'BE'],
  fr: ['FR', 'BE', 'CH', 'LU'],
  es: ['ES', 'MX'],
};

export function LaunchWaitlist({ locale, launch, t }: { locale: Locale; launch: Dictionary['launch']; t: Dictionary['waitlist'] }) {
  return (
    <section id="waitlist" aria-labelledby="launch-title" className="relative scroll-mt-20 overflow-hidden py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 bottom-0 h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(101,200,166,0.2),transparent)]" />
      </div>
      <div className="container-page relative grid gap-12 lg:grid-cols-12 lg:gap-14">
        <div id="launch" className="scroll-mt-28 lg:col-span-5" data-reveal>
          <p className="eyebrow">{launch.eyebrow}</p>
          <h2 id="launch-title" className="mt-3 text-[clamp(2.2rem,4.6vw,3.75rem)] leading-[1.04]">
            {launch.title}
          </h2>

          {/* Month-and-year calendar page: no launch day is announced, so none is shown. */}
          <div aria-hidden="true" className="mt-8 w-[min(260px,70%)] -rotate-2 overflow-hidden rounded-[24px] bg-white shadow-3 ring-1 ring-line">
            <div className="relative flex items-center justify-center bg-teal py-3 font-display text-lg font-semibold uppercase tracking-[0.14em] text-white">
              <span className="absolute left-6 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-white/40" />
              <span className="absolute right-6 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-white/40" />
              {launch.month}
            </div>
            <div className="px-6 pb-6 pt-4 text-center">
              <span className="block font-display text-[clamp(3.6rem,8vw,5.2rem)] font-semibold leading-none tracking-[-0.04em] text-ink">{launch.year}</span>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1 text-[13px] font-semibold text-mint-ink">
                {/* eslint-disable-next-line @next/next/no-img-element -- the Loqelo mark */}
                <img src="/brand/loqelo-icon.svg" alt="" width={14} height={14} className="size-3.5" />
                Loqelo
              </span>
            </div>
          </div>

          <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-2">{launch.text}</p>

          <ol className="mt-10 space-y-0">
            {launch.timeline.map((item, i) => {
              const last = i === launch.timeline.length - 1;
              return (
                <li key={item.title} className="relative flex gap-4 pb-7 last:pb-0">
                  {!last && <span aria-hidden="true" className="absolute left-[15px] top-9 h-[calc(100%-36px)] w-[2px] bg-[repeating-linear-gradient(to_bottom,var(--color-teal-100)_0_6px,transparent_6px_11px)]" />}
                  <span
                    aria-hidden="true"
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                      i === 0 ? 'bg-mint text-deep' : last ? 'bg-white ring-2 ring-teal' : 'bg-white ring-2 ring-teal-100'
                    }`}
                  >
                    {last ? (
                      // eslint-disable-next-line @next/next/no-img-element -- the Loqelo mark as map pin, as in the UI kit
                      <img src="/brand/loqelo-icon.svg" alt="" width={18} height={18} className="size-[18px]" />
                    ) : (
                      <span className={`size-2.5 rounded-full ${i === 0 ? 'bg-deep' : 'bg-teal-100'}`} />
                    )}
                  </span>
                  <div className="pt-0.5">
                    <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-teal-d">{item.label}</p>
                    <p className="mt-1 font-display text-xl font-semibold">{item.title}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="lg:col-span-7" data-reveal>
          <div id="join" className="scroll-mt-24 lg:sticky lg:top-[100px]">
            <div className="mb-6">
              <p className="eyebrow">{t.eyebrow}</p>
              <h2 className="mt-2 text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.06]">{t.title}</h2>
              <p className="mt-2 text-[17px] text-ink-2">{t.lead}</p>
            </div>
            <WaitlistForm
              locale={locale}
              t={t}
              countries={countryOptions(locale)}
              suggestedCodes={suggestedByLocale[locale]}
              privacyHref={`/${locale}/privacy`}
              turnstileSiteKey={turnstileSiteKey}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
