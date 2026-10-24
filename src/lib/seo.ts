import type { Metadata } from 'next';
import { locales, localeTags, ogLocales, type Locale } from './i18n/config';
import { siteUrl } from './site';

/** Canonical + hreflang alternates for a path that exists in every language ('' or '/privacy'). */
export function alternatesFor(locale: Locale, path: string): Metadata['alternates'] {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[localeTags[l]] = `${siteUrl}/${l}${path}`;
  languages['x-default'] = `${siteUrl}${path || '/'}`;
  return { canonical: `${siteUrl}/${locale}${path}`, languages };
}

export function openGraphFor(locale: Locale, title: string, description: string, alt: string, path = ''): Metadata['openGraph'] {
  return {
    type: 'website',
    siteName: 'Loqelo',
    url: `${siteUrl}/${locale}${path}`,
    title,
    description,
    locale: ogLocales[locale],
    alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocales[l]),
    images: [{ url: `${siteUrl}/og/loqelo-og.jpg`, width: 1200, height: 630, alt }],
  };
}
