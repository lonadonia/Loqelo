'use client';

import { useEffect, useState } from 'react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pathForLocale, readLocaleCookie, rememberLocale } from '@/lib/i18n/client';
import { track } from '@/lib/analytics';

type Suggestion = { text: string; switch: string; dismiss: string };

/**
 * Location picks the first language, but location is not a reliable signal of
 * preference. If the browser prefers another supported language and the visitor
 * has not chosen one yet, offer it — in that language.
 */
export function LanguageSuggestion({ locale, suggestions }: { locale: Locale; suggestions: Record<Locale, Suggestion> }) {
  const [suggested, setSuggested] = useState<Locale | null>(null);

  useEffect(() => {
    if (readLocaleCookie()) return;
    const preferred = (navigator.languages?.length ? navigator.languages : [navigator.language])
      .map((tag) => tag?.toLowerCase().split('-')[0])
      .find((lang) => isLocale(lang));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only information, read once after mount
    if (preferred && isLocale(preferred) && preferred !== locale) setSuggested(preferred);
  }, [locale]);

  if (!suggested) return null;
  const s = suggestions[suggested];

  return (
    <div lang={suggested} className="relative z-[55] bg-deep text-white on-dark">
      <div className="container-page flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5 text-[15px]">
        <p>{s.text}</p>
        <div className="flex items-center gap-2">
          <a
            href={pathForLocale(suggested, window.location.pathname, window.location.hash)}
            hrefLang={suggested}
            className="rounded-full bg-mint px-4 py-1.5 font-display font-semibold text-deep"
            onClick={() => {
              rememberLocale(suggested);
              track('language_change', { from_language: locale, to_language: suggested });
            }}
          >
            {s.switch}
          </a>
          <button
            type="button"
            className="rounded-full px-3 py-1.5 font-display text-white/80 hover:text-white"
            onClick={() => {
              rememberLocale(locale);
              setSuggested(null);
            }}
          >
            {s.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
