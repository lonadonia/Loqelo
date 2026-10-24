'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { CountryOption } from '@/lib/countries';
import { validateFields, type Audience, type FieldErrors } from '@/lib/waitlist/validate';
import { track } from '@/lib/analytics';
import { AUDIENCE_EVENT } from './join-link';
import { Icon } from './icon';

type T = Dictionary['waitlist'];
type ServerError = 'server' | 'network' | 'rateLimited' | 'spam' | 'unavailable';
type Status = { state: 'idle' | 'submitting' } | { state: 'success'; mode: 'subscribed' | 'confirm' };

type Props = {
  locale: Locale;
  t: T;
  countries: CountryOption[];
  suggestedCodes: string[];
  privacyHref: string;
  turnstileSiteKey: string;
};

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const API_ERRORS: Record<string, ServerError> = {
  rate_limited: 'rateLimited',
  spam: 'spam',
  unavailable: 'unavailable',
  server: 'server',
};

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('cf-turnstile-script');
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile'))));
    script.addEventListener('error', () => reject(new Error('turnstile')));
    if (!existing) {
      script.id = 'cf-turnstile-script';
      (script as HTMLScriptElement).src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      (script as HTMLScriptElement).async = true;
      document.head.appendChild(script);
    }
  });
}

export function WaitlistForm({ locale, t, countries, suggestedCodes, privacyHref, turnstileSiteKey }: Props) {
  const [audience, setAudience] = useState<Audience>('customer');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [type, setType] = useState<'individual' | 'business' | ''>('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<ServerError | null>(null);
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const [geoCountry, setGeoCountry] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const formId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLSelectElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileId = useRef<string | null>(null);
  const mountedAt = useRef(0);
  const started = useRef(new Set<Audience>());
  const viewed = useRef(new Set<Audience>());
  const geoRequested = useRef(false);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const selectAudience = useCallback((next: Audience, focus = false) => {
    setAudience(next);
    setErrors({});
    setServerError(null);
    if (focus) {
      const section = document.getElementById('join');
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      section?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      window.setTimeout(() => emailRef.current?.focus({ preventScroll: true }), reduce ? 0 : 650);
    }
  }, []);

  // Calls to action elsewhere on the page choose the path for the visitor.
  useEffect(() => {
    const onAudience = (event: Event) => selectAudience((event as CustomEvent<Audience>).detail, true);
    window.addEventListener(AUDIENCE_EVENT, onAudience);
    // Deep links such as loqelo.com/en#join-provider open the right path.
    const frame = requestAnimationFrame(() => {
      const hash = window.location.hash;
      if (hash === '#join-provider' || hash === '#join-customer') selectAudience(hash === '#join-provider' ? 'provider' : 'customer', true);
    });
    return () => {
      window.removeEventListener(AUDIENCE_EVENT, onAudience);
      cancelAnimationFrame(frame);
    };
  }, [selectAudience]);

  // Funnel step 1: the form was actually seen (per path).
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewed.current.has(audience)) {
          viewed.current.add(audience);
          track('waitlist_form_view', { audience });
        }
        if (entry.isIntersecting && !geoRequested.current) {
          geoRequested.current = true;
          fetch('/api/geo')
            .then((r) => (r.ok ? r.json() : null))
            .then((data: { country?: string } | null) => data?.country && setGeoCountry(data.country))
            .catch(() => undefined);
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [audience]);

  // Spam protection widget (only when configured). Invisible unless Cloudflare needs an interaction.
  useEffect(() => {
    if (!turnstileSiteKey || status.state === 'success') return;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !turnstileRef.current || turnstileId.current) return;
        turnstileId.current = api.render(turnstileRef.current, {
          sitekey: turnstileSiteKey,
          appearance: 'interaction-only',
          language: locale,
          callback: (token: string) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(null),
          'error-callback': () => setTurnstileToken(null),
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (turnstileId.current) window.turnstile?.remove(turnstileId.current);
      turnstileId.current = null;
    };
  }, [turnstileSiteKey, locale, status.state]);

  const markStarted = () => {
    if (!started.current.has(audience)) {
      started.current.add(audience);
      track('waitlist_form_start', { audience });
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.state === 'submitting') return;
    setServerError(null);
    const found = validateFields({ email, country, consent });
    setErrors(found);
    if (found.email || found.country || found.consent) {
      track('waitlist_form_error', { audience, error_type: 'validation' });
      (found.email ? emailRef : found.country ? countryRef : consentRef).current?.focus();
      return;
    }

    setStatus({ state: 'submitting' });
    const website = (event.currentTarget.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience,
          email,
          country,
          type: type || null,
          consent,
          locale,
          website,
          elapsedMs: Date.now() - mountedAt.current,
          turnstileToken,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok: true; mode: 'subscribed' | 'confirm' }
        | { ok: false; error: string; fields?: FieldErrors }
        | null;

      if (response.ok && data?.ok) {
        // Counted only now that the contact tool has accepted the registration.
        track(audience === 'customer' ? 'waitlist_signup_customer' : 'waitlist_signup_provider', { audience });
        setStatus({ state: 'success', mode: data.mode });
        window.setTimeout(() => successRef.current?.focus(), 50);
        return;
      }
      if (data && !data.ok && data.error === 'validation' && data.fields) {
        setErrors(data.fields);
        track('waitlist_form_error', { audience, error_type: 'validation' });
      } else {
        const mapped = (data && !data.ok && API_ERRORS[data.error]) || 'server';
        setServerError(mapped);
        track('waitlist_form_error', {
          audience,
          error_type: mapped === 'rateLimited' ? 'rate_limited' : mapped === 'network' ? 'network' : mapped,
        });
      }
      setStatus({ state: 'idle' });
      if (turnstileId.current) {
        window.turnstile?.reset(turnstileId.current);
        setTurnstileToken(null);
      }
    } catch {
      setServerError('network');
      setStatus({ state: 'idle' });
      track('waitlist_form_error', { audience, error_type: 'network' });
    }
  };

  const reset = () => {
    setEmail('');
    setCountry('');
    setType('');
    setConsent(false);
    setErrors({});
    setTurnstileToken(null);
    setStatus({ state: 'idle' });
    mountedAt.current = Date.now();
    window.setTimeout(() => emailRef.current?.focus(), 50);
  };

  const suggested = Array.from(new Set([geoCountry, ...suggestedCodes].filter(Boolean) as string[]))
    .map((code) => countries.find((c) => c.code === code))
    .filter((c): c is CountryOption => !!c);

  const isProvider = audience === 'provider';
  const errorId = (field: string) => `${formId}-${field}-error`;
  const [before, after] = t.consent.split('{privacy}');
  const submitting = status.state === 'submitting';

  return (
    <div ref={cardRef} className="relative">
      <span id="join-customer" className="absolute -top-28" aria-hidden="true" />
      <span id="join-provider" className="absolute -top-28" aria-hidden="true" />

      {status.state === 'success' ? (
        <div role="status" className="card p-7 text-center sm:p-10">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-mint-50 text-mint-ink ring-8 ring-mint-50/50">
            <Icon name="check" size={30} strokeWidth={2.25} />
          </span>
          <h3 ref={successRef} tabIndex={-1} className="mt-5 text-3xl outline-none">
            {status.mode === 'confirm' ? t.success.confirmTitle : isProvider ? t.success.providerTitle : t.success.customerTitle}
          </h3>
          <p className="mx-auto mt-3 max-w-md text-[17px] leading-relaxed text-ink-2">
            {status.mode === 'confirm' ? t.success.confirmText : isProvider ? t.success.providerText : t.success.customerText}
          </p>
          <button type="button" onClick={reset} className="btn btn-ghost mt-7">
            {t.success.again}
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={onSubmit} aria-describedby={`${formId}-note`} className="card overflow-hidden">
          <fieldset className="p-3 sm:p-4">
            <legend className="sr-only">{t.chooseLabel}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(['customer', 'provider'] as const).map((key) => {
                const selected = audience === key;
                const copy = t[key];
                return (
                  <label
                    key={key}
                    className={`relative flex cursor-pointer items-start gap-3.5 rounded-[20px] p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal ${
                      selected
                        ? key === 'provider'
                          ? 'bg-deep text-white'
                          : 'bg-teal-50 text-ink ring-2 ring-teal'
                        : 'bg-bg text-ink hover:bg-line-2'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value={key}
                      checked={selected}
                      onChange={() => selectAudience(key)}
                      className="sr-only"
                    />
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                        selected ? (key === 'provider' ? 'bg-mint text-deep' : 'bg-teal text-white') : 'bg-white text-teal'
                      }`}
                    >
                      <Icon name={key === 'provider' ? 'helmet' : 'house'} size={21} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[17px] font-semibold leading-snug">{copy.title}</span>
                      <span className={`mt-0.5 block text-[14px] ${selected && key === 'provider' ? 'text-white/70' : 'text-subtle'}`}>{copy.text}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? (key === 'provider' ? 'border-mint bg-mint' : 'border-teal bg-teal') : 'border-faint bg-white'
                      }`}
                    >
                      {selected && <span className={`size-2 rounded-full ${key === 'provider' ? 'bg-deep' : 'bg-white'}`} />}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-5 px-5 pb-6 pt-3 sm:px-8 sm:pb-8">
            {serverError && (
              <div role="alert" className="flex gap-3 rounded-[14px] bg-red-50 p-4 text-[15px] text-[#9b3029]">
                <Icon name="x" size={20} className="mt-0.5 shrink-0" />
                <p>{t.errors[serverError]}</p>
              </div>
            )}
            {Object.keys(errors).length > 0 && !serverError && (
              <p role="alert" className="sr-only">
                {t.errors.summary}
              </p>
            )}

            <div>
              <label htmlFor={`${formId}-email`} className="block text-[15px] font-semibold">
                {t.fields.email}
              </label>
              <input
                ref={emailRef}
                id={`${formId}-email`}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                required
                maxLength={254}
                placeholder={t.fields.emailPlaceholder}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  markStarted();
                  if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
                }}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? errorId('email') : undefined}
                className="field-input mt-2"
              />
              {errors.email && (
                <p id={errorId('email')} className="mt-2 flex items-center gap-1.5 text-[14px] font-medium text-[#b23a31]">
                  <Icon name="x" size={15} /> {t.errors[errors.email]}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-country`} className="block text-[15px] font-semibold">
                {isProvider ? t.fields.countryProvider : t.fields.countryCustomer}
              </label>
              <div className="relative mt-2">
                <select
                  ref={countryRef}
                  id={`${formId}-country`}
                  name="country"
                  required
                  autoComplete={isProvider ? 'off' : 'country'}
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    markStarted();
                    if (errors.country) setErrors((x) => ({ ...x, country: undefined }));
                  }}
                  aria-invalid={errors.country ? true : undefined}
                  aria-describedby={errors.country ? errorId('country') : undefined}
                  className={`field-input appearance-none pr-12 ${country ? '' : 'text-faint'}`}
                >
                  <option value="" disabled>
                    {t.fields.countryPlaceholder}
                  </option>
                  {suggested.length > 0 && (
                    <optgroup label={t.fields.suggested}>
                      {suggested.map((c) => (
                        <option key={`s-${c.code}`} value={c.code} className="text-ink">
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={t.fields.allCountries}>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code} className="text-ink">
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <Icon name="chevDown" size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-subtle" />
              </div>
              {errors.country && (
                <p id={errorId('country')} className="mt-2 flex items-center gap-1.5 text-[14px] font-medium text-[#b23a31]">
                  <Icon name="x" size={15} /> {t.errors[errors.country]}
                </p>
              )}
            </div>

            <fieldset>
              <legend className="text-[15px] font-semibold">
                {t.fields.typeLegend} <span className="font-normal text-subtle">({t.fields.optional})</span>
              </legend>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {(isProvider ? (['business', 'individual'] as const) : (['individual', 'business'] as const)).map((value) => (
                  <label
                    key={value}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[15px] font-medium ring-1 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal ${
                      type === value ? 'bg-teal-50 text-teal-d ring-teal' : 'bg-white text-ink-2 ring-line hover:ring-faint'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={value}
                      checked={type === value}
                      onChange={() => {
                        setType(value);
                        markStarted();
                      }}
                      className="sr-only"
                    />
                    <Icon name={value === 'business' ? 'briefcase' : 'user'} size={17} />
                    {t.fields[value]}
                  </label>
                ))}
                {type && (
                  <button type="button" onClick={() => setType('')} className="px-2 text-[14px] font-semibold text-teal underline-offset-2 hover:underline">
                    {t.fields.clear}
                  </button>
                )}
              </div>
            </fieldset>

            <div>
              <div className="flex gap-3">
                <input
                  ref={consentRef}
                  id={`${formId}-consent`}
                  name="consent"
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    markStarted();
                    if (errors.consent) setErrors((x) => ({ ...x, consent: undefined }));
                  }}
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={errors.consent ? errorId('consent') : undefined}
                  className="mt-0.5 size-6 shrink-0 cursor-pointer rounded-[7px] accent-teal"
                />
                <label htmlFor={`${formId}-consent`} className="text-[15px] leading-relaxed text-ink-2">
                  {before}
                  <a href={privacyHref} target="_blank" rel="noopener" className="font-semibold text-teal underline underline-offset-2">
                    {t.consentLink}
                  </a>
                  {after}
                </label>
              </div>
              {errors.consent && (
                <p id={errorId('consent')} className="ml-9 mt-2 flex items-center gap-1.5 text-[14px] font-medium text-[#b23a31]">
                  <Icon name="x" size={15} /> {t.errors[errors.consent]}
                </p>
              )}
            </div>

            {/* Honeypot for bots: hidden from people and assistive technology. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
              </label>
            </div>

            {turnstileSiteKey && <div ref={turnstileRef} className="empty:hidden" />}

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className={`btn min-h-14 w-full text-[17px] ${isProvider ? 'btn-dark' : 'btn-primary'}`}
            >
              {submitting ? (
                <>
                  <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  {t.submitting}
                </>
              ) : (
                <>
                  {isProvider ? t.submitProvider : t.submitCustomer}
                  <Icon name="arrowRight" size={19} />
                </>
              )}
            </button>
            <p id={`${formId}-note`} className="flex items-center justify-center gap-2 text-center text-[13px] text-subtle">
              <Icon name="lock" size={15} className="shrink-0" />
              {t.privacyNote}
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
