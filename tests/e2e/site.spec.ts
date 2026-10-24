import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { acceptAnalytics, events, skipConsentBanner, stubAnalytics } from './helpers';

test.describe('language detection', () => {
  const cases: Array<[string, Record<string, string>, string]> = [
    ['country with one language', { 'x-vercel-ip-country': 'PL', 'accept-language': 'en-US,en;q=0.9' }, '/pl'],
    ['multilingual country + browser', { 'x-vercel-ip-country': 'BE', 'accept-language': 'fr-BE,fr;q=0.9' }, '/fr'],
    ['unsupported country → browser', { 'x-vercel-ip-country': 'IT', 'accept-language': 'it-IT,es;q=0.6' }, '/es'],
    ['unknown country + unsupported language → English', { 'accept-language': 'ja-JP' }, '/en'],
    ['manual choice wins over location', { 'x-vercel-ip-country': 'DE', cookie: 'NEXT_LOCALE=nl' }, '/nl'],
  ];
  for (const [name, headers, expected] of cases) {
    test(name, async ({ request }) => {
      const response = await request.get('/', { headers, maxRedirects: 0 });
      expect(response.status()).toBe(307);
      expect(response.headers().location).toBe(expected);
      expect(response.headers()['cache-control']).toContain('no-store');
    });
  }

  test('deep links keep their path', async ({ request }) => {
    const response = await request.get('/privacy', { headers: { 'x-vercel-ip-country': 'NL' }, maxRedirects: 0 });
    expect(response.headers().location).toBe('/nl/privacy');
  });
});

test('manual language choice switches the page and is remembered', async ({ page, context }) => {
  await skipConsentBanner(page);
  await page.goto('/en');
  await page.getByRole('button', { name: /Choose language/ }).click();
  await page.getByRole('menuitem', { name: 'Polski' }).click();
  await expect(page).toHaveURL(/\/pl$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Everything your place needs.');
  await expect(page.getByText('Wszystko, czego potrzebuje Twoje miejsce.', { exact: true })).toBeVisible();
  const cookie = (await context.cookies()).find((c) => c.name === 'NEXT_LOCALE');
  expect(cookie?.value).toBe('pl');
  await page.goto('/');
  await expect(page).toHaveURL(/\/pl$/);
});

test('suggests the browser language when location picked another one', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();
  await skipConsentBanner(page);
  await page.goto('/pl');
  const bar = page.getByText('Diese Seite gibt es auch auf Deutsch.');
  await expect(bar).toBeVisible();
  await page.getByRole('link', { name: 'Auf Deutsch wechseln' }).click();
  await expect(page).toHaveURL(/\/de$/);
  await context.close();
});

test('main content, tagline, launch date and both paths are present', async ({ page }) => {
  await skipConsentBanner(page);
  await page.goto('/en');
  await expect(page.locator('#hero-logo')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Everything your place needs.');
  await expect(page.getByText('Launching February 2027').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'From one sentence to the right pro.' })).toBeVisible();
  for (const step of ['Describe your need', 'Get matched', 'Receive offers', 'Choose your provider']) {
    await expect(page.getByRole('heading', { name: step })).toBeAttached();
  }
  await expect(page.getByRole('heading', { name: 'Launching February 2027.' })).toBeAttached();
  await expect(page.getByRole('radio', { name: /I'm looking for services/ })).toBeAttached();
  await expect(page.getByRole('radio', { name: /I provide services/ })).toBeAttached();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
});

test('platform preview tabs and lightbox work with keyboard', async ({ page }) => {
  await skipConsentBanner(page);
  await page.goto('/en#preview');
  const tab = page.getByRole('tab', { name: 'For providers' });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Design preview · sample data').first()).toBeVisible();
  await page.getByRole('button', { name: /Enlarge screen: Jobs for you/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByText('Send your offer')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('promo video loads only on demand and plays', async ({ page }) => {
  await skipConsentBanner(page);
  const videoRequests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/media/loqelo-promo') && !r.url().includes('poster')) videoRequests.push(r.url());
  });
  await page.goto('/en#video');
  await page.waitForTimeout(500);
  expect(videoRequests).toHaveLength(0);
  await page.getByRole('button', { name: /Play the Loqelo video/ }).click();
  const video = page.locator('video');
  await expect(video).toBeVisible();
  await expect
    .poll(async () => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15_000 })
    .toBeGreaterThan(0.5);
  expect(videoRequests.length).toBeGreaterThan(0);
});

test.describe('analytics consent', () => {
  test('nothing is loaded or tracked when analytics is declined', async ({ page }) => {
    await stubAnalytics(page);
    const gaRequests: string[] = [];
    page.on('request', (r) => {
      if (/googletagmanager|google-analytics/.test(r.url())) gaRequests.push(r.url());
    });
    await page.goto('/en');
    await page.getByRole('button', { name: 'Decline' }).click();
    await page.getByRole('link', { name: /I need services/ }).first().click();
    await page.waitForTimeout(800);
    expect(gaRequests).toHaveLength(0);
    expect(await page.evaluate(() => window.dataLayer?.length ?? 0)).toBe(0);
    const stored = await page.evaluate(() => localStorage.getItem('lq-analytics-consent-v1'));
    expect(stored).toBe('denied');
  });

  test('accepting loads GA4 without advertising features and the choice can be changed', async ({ page }) => {
    await stubAnalytics(page);
    await page.goto('/en?utm_source=test#top');
    await acceptAnalytics(page);
    const calls = await page.evaluate(() => (window.dataLayer ?? []).map((e) => Array.from(e as ArrayLike<unknown>)));
    const config = calls.find((c) => c[0] === 'config');
    expect(config?.[1]).toBe('G-TEST000000');
    expect(config?.[2]).toMatchObject({ allow_google_signals: false, allow_ad_personalization_signals: false });
    expect(String((config?.[2] as { page_location: string }).page_location)).not.toContain('utm_source');
    const consent = calls.find((c) => c[0] === 'consent' && c[1] === 'default');
    expect(consent?.[2]).toMatchObject({ analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });

    await page.getByRole('button', { name: 'Cookie settings' }).click();
    await page.getByRole('button', { name: 'Decline' }).click();
    const after = await page.evaluate(() => (window.dataLayer ?? []).map((e) => Array.from(e as ArrayLike<unknown>)));
    expect(after.some((c) => c[0] === 'consent' && c[1] === 'update' && (c[2] as { analytics_storage?: string }).analytics_storage === 'denied')).toBe(true);
    const before = (await events(page)).length;
    await page.getByRole('link', { name: /I offer services/ }).first().click();
    expect((await events(page)).length).toBe(before);
  });
});

test('reduced motion shows the complete demo without animation controls', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await skipConsentBanner(page);
  await page.goto('/en');
  await expect(page.getByText('We found 2 services')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause the demo' })).toHaveCount(0);
  await context.close();
});

for (const width of [1440, 1024, 768, 390, 360]) {
  test(`no horizontal overflow at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await skipConsentBanner(page);
    for (const path of ['/en', '/de', '/fr/privacy']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
    await context.close();
  });
}

for (const path of ['/en', '/pl', '/en/privacy']) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await skipConsentBanner(page);
    await page.goto(path);
    await page.waitForTimeout(800);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)).toEqual([]);
  });
}

test('SEO basics: titles, hreflang, sitemap and robots', async ({ page, request }) => {
  await page.goto('/es');
  await expect(page).toHaveTitle(/Everything your place needs\. Lanzamiento en febrero de 2027/);
  await expect(page.locator('link[rel="alternate"][hreflang="pl"]')).toHaveAttribute('href', /\/pl$/);
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/es$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /loqelo-og\.jpg$/);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/nl/privacy');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap:');
});
