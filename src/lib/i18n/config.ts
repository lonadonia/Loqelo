export const locales = ['en', 'pl', 'de', 'nl', 'fr', 'es'] as const;
export type Locale = (typeof locales)[number];

/** Used when neither location nor browser language points to a supported locale. */
export const defaultLocale: Locale = 'en';

/** Cookie that stores a visitor's manual language choice (strictly functional). */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pl: 'Polski',
  de: 'Deutsch',
  nl: 'Nederlands',
  fr: 'Français',
  es: 'Español',
};

/** BCP 47 tags for <html lang>, hreflang and Open Graph. */
export const localeTags: Record<Locale, string> = {
  en: 'en',
  pl: 'pl',
  de: 'de',
  nl: 'nl',
  fr: 'fr',
  es: 'es',
};

export const ogLocales: Record<Locale, string> = {
  en: 'en_GB',
  pl: 'pl_PL',
  de: 'de_DE',
  nl: 'nl_NL',
  fr: 'fr_FR',
  es: 'es_ES',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
