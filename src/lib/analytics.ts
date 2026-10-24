'use client';

/**
 * Privacy-safe analytics helpers (Google Analytics 4).
 *
 * Rules enforced here:
 * - Nothing is sent unless the visitor accepted analytics (GA is not even loaded before that).
 * - Parameters are limited to a fixed allow-list of non-personal values:
 *   no email addresses, no countries typed into forms, no free text.
 * - Successful sign-ups are reported as separate events per audience, and only
 *   after the contact tool has accepted the registration.
 */

export type Audience = 'customer' | 'provider';

export type AnalyticsEvent =
  | 'waitlist_signup_customer'
  | 'waitlist_signup_provider'
  | 'waitlist_form_view'
  | 'waitlist_form_start'
  | 'waitlist_form_error'
  | 'cta_click'
  | 'promo_video_play'
  | 'promo_video_unmute'
  | 'promo_video_progress'
  | 'promo_video_complete'
  | 'language_change';

type SafeParams = {
  audience?: Audience;
  error_type?: 'validation' | 'server' | 'network' | 'spam' | 'rate_limited' | 'unavailable';
  cta_location?: 'header' | 'hero' | 'audiences' | 'launch' | 'final' | 'menu';
  percent?: 25 | 50 | 75;
  from_language?: string;
  to_language?: string;
  site_language?: string;
};

const ALLOWED_KEYS = new Set(['audience', 'error_type', 'cta_location', 'percent', 'from_language', 'to_language', 'site_language']);

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export const CONSENT_STORAGE_KEY = 'lq-analytics-consent-v1';
export type ConsentChoice = 'granted' | 'denied';

export function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function storeConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    /* storage unavailable (private mode): the choice lasts for this page view */
  }
}

let analyticsActive = false;
export function setAnalyticsActive(active: boolean) {
  analyticsActive = active;
}

export function track(event: AnalyticsEvent, params: SafeParams = {}) {
  if (typeof window === 'undefined' || !analyticsActive || typeof window.gtag !== 'function') return;
  const clean: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (ALLOWED_KEYS.has(key) && (typeof value === 'string' || typeof value === 'number')) clean[key] = value;
  }
  window.gtag('event', event, clean);
}

/** Page location without query string or hash, so nothing typed or campaign-specific can leak. */
export function safePageLocation() {
  return `${window.location.origin}${window.location.pathname}`;
}

export const COOKIE_SETTINGS_EVENT = 'lq:cookie-settings';
export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
