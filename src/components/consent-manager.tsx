'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import {
  COOKIE_SETTINGS_EVENT,
  readConsent,
  safePageLocation,
  setAnalyticsActive,
  storeConsent,
  type ConsentChoice,
} from '@/lib/analytics';

type Props = {
  measurementId: string;
  locale: Locale;
  t: { title: string; text: string; accept: string; decline: string; more: string };
};

/** Loads Google Analytics only after explicit consent ("basic" Consent Mode). */
function loadAnalytics(measurementId: string, locale: Locale) {
  if (document.getElementById('ga4-loader')) {
    window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    setAnalyticsActive(true);
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    page_location: safePageLocation(),
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    site_language: locale,
  });
  const script = document.createElement('script');
  script.id = 'ga4-loader';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
  setAnalyticsActive(true);
}

function disableAnalytics() {
  setAnalyticsActive(false);
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  // Remove GA cookies that may have been set earlier.
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim();
    if (name && (name === '_ga' || name.startsWith('_ga_'))) {
      const host = window.location.hostname;
      const domains = [host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
      for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  }
}

export function ConsentManager({ measurementId, locale, t }: Props) {
  const [open, setOpen] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!measurementId) return;
    const stored = readConsent();
    if (stored === 'granted') loadAnalytics(measurementId, locale);
    // Ask only once nobody has chosen yet; show after first paint so it never blocks content.
    if (stored === null) {
      const id = window.setTimeout(() => setOpen(true), 600);
      return () => window.clearTimeout(id);
    }
  }, [measurementId, locale]);

  useEffect(() => {
    const reopen = () => {
      restoreFocus.current = document.activeElement as HTMLElement | null;
      setOpen(true);
      window.setTimeout(() => acceptRef.current?.focus(), 50);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const choose = useCallback(
    (choice: ConsentChoice) => {
      storeConsent(choice);
      if (choice === 'granted') loadAnalytics(measurementId, locale);
      else disableAnalytics();
      setOpen(false);
      restoreFocus.current?.focus?.();
    },
    [measurementId, locale],
  );

  if (!measurementId || !open) return null;

  return (
    <div
      role="region"
      aria-label={t.title}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl animate-rise rounded-[22px] bg-deep p-5 text-white shadow-3 on-dark sm:inset-x-6 sm:bottom-6 sm:p-6"
    >
      <p className="font-display text-lg font-semibold">{t.title}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-white/80">
        {t.text}{' '}
        <a href={`/${locale}/privacy`} className="font-semibold text-mint underline underline-offset-2">
          {t.more}
        </a>
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button ref={acceptRef} type="button" className="btn btn-mint flex-1" onClick={() => choose('granted')}>
          {t.accept}
        </button>
        <button type="button" className="btn flex-1 bg-white/10 text-white hover:bg-white/15" onClick={() => choose('denied')}>
          {t.decline}
        </button>
      </div>
    </div>
  );
}
