import { describe, expect, it } from 'vitest';
import { browserLocales, negotiateLocale } from '@/lib/i18n/detect';

describe('browserLocales', () => {
  it('keeps supported languages in order of preference', () => {
    expect(browserLocales('fr-BE,fr;q=0.9,en;q=0.8,de;q=0.7')).toEqual(['fr', 'en', 'de']);
  });
  it('respects q-values regardless of order and ignores unsupported languages', () => {
    expect(browserLocales('it;q=0.9,pl;q=0.5,es')).toEqual(['es', 'pl']);
  });
  it('handles missing headers', () => {
    expect(browserLocales(null)).toEqual([]);
    expect(browserLocales('')).toEqual([]);
  });
});

describe('negotiateLocale', () => {
  it('always honours a manual choice', () => {
    expect(negotiateLocale({ cookieLocale: 'de', country: 'PL', acceptLanguage: 'pl' })).toEqual({ locale: 'de', reason: 'cookie' });
  });
  it('uses the visitor country for single-language countries', () => {
    expect(negotiateLocale({ country: 'PL', acceptLanguage: 'en-US' })).toEqual({ locale: 'pl', reason: 'country' });
    expect(negotiateLocale({ country: 'nl', acceptLanguage: null }).locale).toBe('nl');
  });
  it('uses the browser language to choose within multilingual countries', () => {
    expect(negotiateLocale({ country: 'BE', acceptLanguage: 'fr-BE,fr;q=0.9' })).toEqual({ locale: 'fr', reason: 'country+browser' });
    expect(negotiateLocale({ country: 'CH', acceptLanguage: 'de-CH' }).locale).toBe('de');
    expect(negotiateLocale({ country: 'CA', acceptLanguage: 'fr-CA' }).locale).toBe('fr');
  });
  it('falls back to the main language of a multilingual country when the browser does not help', () => {
    expect(negotiateLocale({ country: 'BE', acceptLanguage: 'it' })).toEqual({ locale: 'nl', reason: 'country' });
  });
  it('uses the browser language for countries without a supported language', () => {
    expect(negotiateLocale({ country: 'IT', acceptLanguage: 'it-IT,de;q=0.6' })).toEqual({ locale: 'de', reason: 'browser' });
  });
  it('falls back to English when nothing matches', () => {
    expect(negotiateLocale({ country: 'JP', acceptLanguage: 'ja' })).toEqual({ locale: 'en', reason: 'default' });
    expect(negotiateLocale({})).toEqual({ locale: 'en', reason: 'default' });
  });
  it('ignores an invalid cookie value', () => {
    expect(negotiateLocale({ cookieLocale: 'xx', country: 'ES' }).locale).toBe('es');
  });
});
