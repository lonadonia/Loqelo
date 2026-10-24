import { expect, type Page } from '@playwright/test';

export const MOCK_BREVO = 'http://127.0.0.1:4010';

export type MockRequest = { method: string; path: string; apiKey: string | null; body: { email?: string; listIds?: number[]; attributes?: Record<string, string> } | null };

export async function brevoRequestsFor(email: string): Promise<MockRequest[]> {
  const response = await fetch(`${MOCK_BREVO}/__requests`);
  const all = (await response.json()) as MockRequest[];
  return all.filter((r) => r.body?.email === email);
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Serve an empty gtag.js so analytics calls stay in window.dataLayer and never leave the test. */
export async function stubAnalytics(page: Page) {
  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* gtag stub */' }),
  );
  await page.route('https://*.google-analytics.com/**', (route) => route.fulfill({ status: 204, body: '' }));
}

/** Pretend the visitor already declined analytics, so the banner does not cover the page. */
export async function skipConsentBanner(page: Page) {
  await page.addInitScript(() => window.localStorage.setItem('lq-analytics-consent-v1', 'denied'));
}

export async function acceptAnalytics(page: Page) {
  await page.getByRole('button', { name: 'Accept analytics' }).click();
}

/** Every gtag() call made so far, as plain arrays: ['event', name, params]. */
export async function analyticsCalls(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>)));
}

export async function events(page: Page) {
  return (await analyticsCalls(page)).filter((call) => call[0] === 'event').map((call) => ({ name: call[1] as string, params: call[2] as Record<string, unknown> }));
}

export async function expectNoPersonalData(page: Page, email: string) {
  const serialized = JSON.stringify(await analyticsCalls(page));
  expect(serialized).not.toContain(email);
  expect(serialized).not.toContain('@');
}
