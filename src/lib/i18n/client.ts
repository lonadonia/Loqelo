'use client';

import { LOCALE_COOKIE, type Locale } from './config';

export function readLocaleCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Remembers a manual language choice for a year (functional cookie, no consent needed). */
export function rememberLocale(locale: Locale) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

/** Same page in another language: /pl/privacy -> /de/privacy, keeping the #section. */
export function pathForLocale(locale: Locale, pathname: string, hash = '') {
  const rest = pathname.split('/').slice(2).join('/');
  return `/${locale}${rest ? `/${rest}` : ''}${hash}`;
}
