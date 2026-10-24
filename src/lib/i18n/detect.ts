import { defaultLocale, isLocale, type Locale } from './config';

/**
 * Supported languages spoken in each country (ISO 3166-1 alpha-2), most widely
 * used first. Countries with several entries are disambiguated with the
 * browser's Accept-Language header. Countries not listed fall back to the
 * browser language, then to the default locale.
 */
export const countryLanguages: Record<string, Locale[]> = {
  // English
  GB: ['en'], IE: ['en'], US: ['en', 'es'], AU: ['en'], NZ: ['en'], MT: ['en'], ZA: ['en'],
  IN: ['en'], SG: ['en'], PH: ['en'], NG: ['en'], KE: ['en'], GH: ['en'], JM: ['en'], TT: ['en'],
  CA: ['en', 'fr'],
  // Polish
  PL: ['pl'],
  // German
  DE: ['de'], AT: ['de'], LI: ['de'], CH: ['de', 'fr'], LU: ['fr', 'de'],
  // Dutch
  NL: ['nl'], BE: ['nl', 'fr'], SR: ['nl'], AW: ['nl'], CW: ['nl'], SX: ['nl'],
  // French
  FR: ['fr'], MC: ['fr'], SN: ['fr'], CI: ['fr'], CM: ['fr'], ML: ['fr'], BF: ['fr'], NE: ['fr'],
  TG: ['fr'], BJ: ['fr'], GA: ['fr'], CG: ['fr'], CD: ['fr'], MG: ['fr'], HT: ['fr'], RE: ['fr'],
  GP: ['fr'], MQ: ['fr'], GF: ['fr'], YT: ['fr'], NC: ['fr'], PF: ['fr'],
  // Spanish
  ES: ['es'], MX: ['es'], AR: ['es'], CO: ['es'], CL: ['es'], PE: ['es'], VE: ['es'], EC: ['es'],
  GT: ['es'], CU: ['es'], BO: ['es'], DO: ['es'], HN: ['es'], PY: ['es'], SV: ['es'], NI: ['es'],
  CR: ['es'], PA: ['es'], UY: ['es'], PR: ['es', 'en'], GQ: ['es'],
};

/** Supported locales from an Accept-Language header, in the visitor's order of preference. */
export function browserLocales(acceptLanguage: string | null | undefined): Locale[] {
  if (!acceptLanguage) return [];
  const ranked = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const weight = q ? Number.parseFloat(q.slice(2)) : 1;
      return { lang: tag.trim().toLowerCase().split('-')[0], weight: Number.isNaN(weight) ? 0 : weight, index };
    })
    .filter((entry) => entry.lang && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);

  const result: Locale[] = [];
  for (const { lang } of ranked) {
    if (isLocale(lang) && !result.includes(lang)) result.push(lang);
  }
  return result;
}

export type LocaleReason = 'cookie' | 'country+browser' | 'country' | 'browser' | 'default';

/**
 * Picks the locale for a visitor without a language in the URL.
 * Order: manual choice → visitor country (browser language breaks ties in
 * multilingual countries) → browser language → default.
 */
export function negotiateLocale(input: {
  cookieLocale?: string | null;
  country?: string | null;
  acceptLanguage?: string | null;
}): { locale: Locale; reason: LocaleReason } {
  if (isLocale(input.cookieLocale)) return { locale: input.cookieLocale, reason: 'cookie' };

  const browser = browserLocales(input.acceptLanguage);
  const fromCountry = input.country ? countryLanguages[input.country.toUpperCase()] ?? [] : [];

  if (fromCountry.length > 0) {
    const shared = browser.find((locale) => fromCountry.includes(locale));
    if (shared) return { locale: shared, reason: 'country+browser' };
    return { locale: fromCountry[0], reason: 'country' };
  }
  if (browser.length > 0) return { locale: browser[0], reason: 'browser' };
  return { locale: defaultLocale, reason: 'default' };
}
