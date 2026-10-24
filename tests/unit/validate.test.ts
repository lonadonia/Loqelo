import { describe, expect, it } from 'vitest';
import { parseSignup, validateEmail, validateFields } from '@/lib/waitlist/validate';

describe('validateEmail', () => {
  it.each(['anna@example.com', ' Anna.Kowalska+loqelo@Example.CO.UK ', 'jan@sub.domain.pl', 'a@xn--p1ai.xn--p1ai'])('accepts %s', (email) => {
    expect(validateEmail(email)).toBeNull();
  });
  it.each(['', '   '])('requires a value (%j)', (email) => {
    expect(validateEmail(email)).toBe('emailRequired');
  });
  it.each(['anna', 'anna@', 'anna@example', 'an na@example.com', 'anna@@example.com', 'anna@example.c', `${'a'.repeat(250)}@example.com`])(
    'rejects %s',
    (email) => {
      expect(validateEmail(email)).toBe('emailInvalid');
    },
  );
});

describe('validateFields', () => {
  it('reports every missing field', () => {
    expect(validateFields({ email: '', country: '', consent: false })).toEqual({
      email: 'emailRequired',
      country: 'countryRequired',
      consent: 'consentRequired',
    });
  });
  it('rejects unknown country codes', () => {
    expect(validateFields({ email: 'a@b.de', country: 'ZZ', consent: true })).toEqual({ country: 'countryRequired' });
  });
});

describe('parseSignup', () => {
  const valid = { audience: 'provider', email: ' Pro@Example.com ', country: 'de', consent: true, locale: 'de', type: 'business' };

  it('normalises a valid provider sign-up', () => {
    expect(parseSignup(valid)).toEqual({
      ok: true,
      signup: { audience: 'provider', email: 'pro@example.com', country: 'DE', type: 'business', locale: 'de' },
    });
  });
  it('treats the individual/business answer as optional and drops unknown values', () => {
    const result = parseSignup({ ...valid, type: 'company' });
    expect(result.ok && result.signup.type).toBeNull();
  });
  it('requires explicit consent (true, not truthy)', () => {
    expect(parseSignup({ ...valid, consent: 'yes' })).toEqual({ ok: false, errors: { consent: 'consentRequired' } });
  });
  it('rejects an unknown audience', () => {
    expect(parseSignup({ ...valid, audience: 'admin' }).ok).toBe(false);
  });
  it('falls back to English for an unknown locale', () => {
    const result = parseSignup({ ...valid, locale: 'xx' });
    expect(result.ok && result.signup.locale).toBe('en');
  });
});
