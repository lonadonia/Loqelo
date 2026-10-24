import { isCountryCode, type CountryCode } from '../countries';
import { isLocale, type Locale } from '../i18n/config';

export type Audience = 'customer' | 'provider';
export type SignupType = 'individual' | 'business';

/** What the browser sends to /api/waitlist. */
export type WaitlistRequest = {
  audience: Audience;
  email: string;
  country: string;
  type?: string | null;
  consent: boolean;
  locale: string;
  /** Honeypot: must stay empty. */
  website?: string;
  /** Milliseconds between the form appearing and being submitted. */
  elapsedMs?: number;
  turnstileToken?: string | null;
};

export type WaitlistSignup = {
  audience: Audience;
  email: string;
  country: CountryCode;
  type: SignupType | null;
  locale: Locale;
};

export type FieldError = 'emailRequired' | 'emailInvalid' | 'countryRequired' | 'consentRequired';
export type FieldErrors = Partial<Record<'email' | 'country' | 'consent', FieldError>>;

// Deliberately pragmatic: one "@", a dot in the domain, no spaces, sane length.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.([a-z]{2,}|xn--[a-z0-9-]{2,})$/i;

export function normaliseEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): FieldError | null {
  const email = normaliseEmail(value);
  if (!email) return 'emailRequired';
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return 'emailInvalid';
  return null;
}

/** Field validation shared by the form (instant feedback) and the API (authoritative). */
export function validateFields(input: { email: string; country: string; consent: boolean }): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  if (!isCountryCode(input.country)) errors.country = 'countryRequired';
  if (input.consent !== true) errors.consent = 'consentRequired';
  return errors;
}

export function parseSignup(body: unknown): { ok: true; signup: WaitlistSignup } | { ok: false; errors: FieldErrors } {
  const data = (body ?? {}) as Partial<WaitlistRequest>;
  const audience = data.audience === 'customer' || data.audience === 'provider' ? data.audience : null;
  const email = typeof data.email === 'string' ? data.email : '';
  const country = typeof data.country === 'string' ? data.country.toUpperCase() : '';
  const errors = validateFields({ email, country, consent: data.consent === true });
  if (!audience || Object.keys(errors).length > 0) return { ok: false, errors };
  const type = data.type === 'individual' || data.type === 'business' ? data.type : null;
  return {
    ok: true,
    signup: {
      audience,
      email: normaliseEmail(email),
      country: country as CountryCode,
      type,
      locale: isLocale(data.locale) ? data.locale : 'en',
    },
  };
}
