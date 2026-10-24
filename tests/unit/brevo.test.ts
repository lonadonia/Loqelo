import { afterEach, describe, expect, it, vi } from 'vitest';
import { addToWaitlist, brevoConfig, contactAttributes } from '@/lib/waitlist/brevo';
import type { WaitlistSignup } from '@/lib/waitlist/validate';

const signup: WaitlistSignup = { audience: 'customer', email: 'anna@example.com', country: 'PL', type: 'individual', locale: 'pl' };
const now = new Date('2026-10-24T10:00:00.000Z');

describe('brevoConfig', () => {
  it('is null until the key and both list IDs are set', () => {
    expect(brevoConfig({})).toBeNull();
    expect(brevoConfig({ BREVO_API_KEY: 'k', BREVO_LIST_ID_CUSTOMERS: '3' })).toBeNull();
    expect(brevoConfig({ BREVO_API_KEY: 'k', BREVO_LIST_ID_CUSTOMERS: '3', BREVO_LIST_ID_PROVIDERS: 'x' })).toBeNull();
  });
  it('enables double opt-in only with both template and redirect URL', () => {
    const env = { BREVO_API_KEY: 'k', BREVO_LIST_ID_CUSTOMERS: '3', BREVO_LIST_ID_PROVIDERS: '4' };
    expect(brevoConfig(env)?.doi).toBeNull();
    expect(brevoConfig({ ...env, BREVO_DOI_TEMPLATE_ID: '7' })?.doi).toBeNull();
    expect(brevoConfig({ ...env, BREVO_DOI_TEMPLATE_ID: '7', BREVO_DOI_REDIRECT_URL: 'https://loqelo.com/en' })?.doi).toEqual({
      templateId: 7,
      redirectionUrl: 'https://loqelo.com/en',
    });
  });
});

describe('contactAttributes', () => {
  it('stores customer answers and consent proof under customer-specific names', () => {
    expect(contactAttributes(signup, '2026-10-v1', now)).toEqual({
      CUSTOMER_COUNTRY: 'Poland',
      CUSTOMER_COUNTRY_CODE: 'PL',
      CUSTOMER_TYPE: 'Individual',
      SIGNUP_LANGUAGE: 'pl',
      CONSENT_TIMESTAMP: '2026-10-24T10:00:00.000Z',
      CONSENT_VERSION: '2026-10-v1/pl',
    });
  });
  it('never writes an empty optional answer', () => {
    const attributes = contactAttributes({ ...signup, audience: 'provider', type: null }, 'v', now);
    expect(attributes).not.toHaveProperty('PROVIDER_TYPE');
    expect(attributes.PROVIDER_COUNTRY).toBe('Poland');
  });
});

describe('addToWaitlist', () => {
  const config = { apiKey: 'secret', baseUrl: 'https://api.brevo.test/v3', listIds: { customer: 3, provider: 4 }, doi: null };
  afterEach(() => vi.unstubAllGlobals());

  it('adds the contact to the audience list and updates existing contacts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(addToWaitlist(config, { ...signup, audience: 'provider' }, 'v', now)).resolves.toEqual({ mode: 'subscribed' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.test/v3/contacts');
    expect(init.headers['api-key']).toBe('secret');
    expect(JSON.parse(init.body)).toMatchObject({ email: 'anna@example.com', listIds: [4], updateEnabled: true });
  });
  it('uses the double opt-in endpoint when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const doi = { ...config, doi: { templateId: 9, redirectionUrl: 'https://loqelo.com/en' } };
    await expect(addToWaitlist(doi, signup, 'v', now)).resolves.toEqual({ mode: 'confirm' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.brevo.test/v3/contacts/doubleOptinConfirmation');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ includeListIds: [3], templateId: 9 });
  });
  it('turns Brevo errors into a typed error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ code: 'unauthorized', message: 'Key not found' }, { status: 401 })));
    await expect(addToWaitlist(config, signup, 'v', now)).rejects.toMatchObject({ status: 401, code: 'unauthorized' });
  });
  it('treats a duplicate contact as success so membership is never revealed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ code: 'duplicate_parameter' }, { status: 400 })));
    await expect(addToWaitlist(config, signup, 'v', now)).resolves.toEqual({ mode: 'subscribed' });
  });
});
