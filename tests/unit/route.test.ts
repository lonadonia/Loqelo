import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/waitlist/route';
import { isRateLimited } from '@/lib/waitlist/rate-limit';

const ENV = { ...process.env };
let ipCounter = 0;

function request(body: unknown, headers: Record<string, string> = {}) {
  ipCounter += 1;
  return new Request('https://loqelo.com/api/waitlist', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://loqelo.com',
      host: 'loqelo.com',
      'x-forwarded-for': `203.0.113.${ipCounter}`,
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const valid = { audience: 'customer', email: 'anna@example.com', country: 'PL', consent: true, locale: 'pl', elapsedMs: 8000, website: '' };

beforeEach(() => {
  process.env.BREVO_API_KEY = 'test-key';
  process.env.BREVO_LIST_ID_CUSTOMERS = '11';
  process.env.BREVO_LIST_ID_PROVIDERS = '12';
  process.env.BREVO_API_BASE_URL = 'https://brevo.test/v3';
  delete process.env.TURNSTILE_SECRET_KEY;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  process.env = { ...ENV };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('POST /api/waitlist', () => {
  it('saves a valid sign-up and reports success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, mode: 'subscribed' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).listIds).toEqual([11]);
  });

  it('answers 503 "unavailable" while Brevo is not configured — never a fake success', async () => {
    delete process.env.BREVO_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(request(valid));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: 'unavailable' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('silently drops honeypot submissions', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(request({ ...valid, website: 'https://spam.example' }));
    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects forms submitted faster than a person can fill them', async () => {
    const response = await POST(request({ ...valid, elapsedMs: 300 }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'spam' });
  });

  it('rejects cross-site and non-JSON requests', async () => {
    expect((await POST(request(valid, { origin: 'https://evil.example' }))).status).toBe(403);
    expect((await POST(request(valid, { 'content-type': 'text/plain' }))).status).toBe(415);
    expect((await POST(request('{not json'))).status).toBe(400);
    expect((await POST(request({ ...valid, email: 'x'.repeat(5000) }))).status).toBe(413);
  });

  it('returns field errors for invalid input', async () => {
    const response = await POST(request({ ...valid, email: 'nope', country: '', consent: false }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: 'validation',
      fields: { email: 'emailInvalid', country: 'countryRequired', consent: 'consentRequired' },
    });
  });

  it('requires a valid Turnstile token when spam protection is configured', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret';
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ success: false }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(request({ ...valid, turnstileToken: 'bad-token' }));
    expect(response.status).toBe(403);
    expect(fetchMock.mock.calls[0][0]).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
  });

  it('reports a server error when Brevo fails, without logging the email address', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ code: 'internal_error' }, { status: 500 })));
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await POST(request(valid));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ ok: false, error: 'server' });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain('anna@example.com');
  });
});

describe('isRateLimited', () => {
  it('allows a few attempts per address, then blocks', () => {
    const results = Array.from({ length: 8 }, () => isRateLimited('198.51.100.7', 1_000));
    expect(results.filter(Boolean)).toHaveLength(2);
    expect(isRateLimited('198.51.100.7', 1_000 + 11 * 60 * 1000)).toBe(false);
  });
});
