import { localeNames, locales, type Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { contactEmail, gaMeasurementId } from '@/lib/site';
import { CookieSettingsButton } from './cookie-settings-button';

export function SiteFooter({ locale, t, tagline, path = '' }: { locale: Locale; t: Dictionary['footer']; tagline: string; path?: string }) {
  return (
    <footer className="on-dark bg-deep text-white">
      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- official SVG logo, white text variant */}
            <img src="/brand/loqelo-logo-white.svg" alt="Loqelo" width={156} height={40} className="h-10 w-auto" loading="lazy" />
            <p lang="en" className="mt-5 font-display text-xl font-semibold">
              {tagline}
            </p>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/65">{t.about}</p>
          </div>
          <nav aria-label={t.navLabel} className="md:col-span-3">
            <ul className="space-y-3 text-[15px]">
              <li>
                <a href={`/${locale}/privacy`} className="text-white/80 hover:text-white">
                  {t.privacy}
                </a>
              </li>
              {gaMeasurementId && (
                <li>
                  <CookieSettingsButton label={t.cookies} />
                </li>
              )}
              {contactEmail && (
                <li>
                  <a href={`mailto:${contactEmail}`} className="text-white/80 hover:text-white">
                    {t.contact}: {contactEmail}
                  </a>
                </li>
              )}
            </ul>
          </nav>
          <nav aria-label={t.languages} className="md:col-span-4">
            <ul className="flex flex-wrap gap-2">
              {locales.map((l) => (
                <li key={l}>
                  <a
                    href={`/${l}${path}`}
                    hrefLang={l}
                    lang={l}
                    aria-current={l === locale ? 'page' : undefined}
                    className={`inline-flex h-10 items-center rounded-full px-4 text-[14px] font-semibold ring-1 transition-colors ${
                      l === locale ? 'bg-white text-deep ring-white' : 'text-white/80 ring-white/20 hover:ring-white/50'
                    }`}
                  >
                    {localeNames[l]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[14px] text-white/55 sm:flex-row">
          <p>
            © 2026 Loqelo. {t.rights}
          </p>
          <p>{t.places}</p>
        </div>
      </div>
    </footer>
  );
}
