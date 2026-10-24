import { expect, test } from '@playwright/test';
import { acceptAnalytics, brevoRequestsFor, events, expectNoPersonalData, skipConsentBanner, stubAnalytics, uniqueEmail } from './helpers';

test.beforeEach(async ({ page }) => {
  await stubAnalytics(page);
});

test('customer sign-up is stored in the customer list and counted only after acceptance', async ({ page }) => {
  const email = uniqueEmail('customer');
  await page.goto('/en');
  await acceptAnalytics(page);

  await page.getByRole('link', { name: /I need services/ }).first().click();
  const form = page.locator('#join form');
  await expect(form.getByRole('radio', { name: /I'm looking for services/ })).toBeChecked();
  await expect(form.getByLabel('Email address')).toBeFocused();

  await form.getByLabel('Email address').fill(email);
  await form.getByLabel('Country of residence').selectOption('PL');
  await form.getByText('An individual').click();
  await form.getByRole('checkbox', { name: /I agree to receive emails/ }).check();

  expect((await events(page)).map((e) => e.name)).not.toContain('waitlist_signup_customer');
  await form.getByRole('button', { name: 'Join the customer waitlist' }).click();

  await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible();
  await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeFocused();

  const [saved] = await brevoRequestsFor(email);
  expect(saved.path).toBe('/v3/contacts');
  expect(saved.apiKey).toBe('test-key');
  expect(saved.body?.listIds).toEqual([11]);
  expect(saved.body?.attributes).toMatchObject({
    CUSTOMER_COUNTRY: 'Poland',
    CUSTOMER_COUNTRY_CODE: 'PL',
    CUSTOMER_TYPE: 'Individual',
    SIGNUP_LANGUAGE: 'en',
    CONSENT_VERSION: '2026-10-v1/en',
  });
  expect(saved.body?.attributes?.CONSENT_TIMESTAMP).toMatch(/^\d{4}-\d{2}-\d{2}T/);

  const names = (await events(page)).map((e) => e.name);
  expect(names).toEqual(expect.arrayContaining(['cta_click', 'waitlist_form_start', 'waitlist_signup_customer']));
  expect(names).not.toContain('waitlist_signup_provider');
  await expectNoPersonalData(page, email);
});

test('provider sign-up uses the provider path, list and wording', async ({ page }) => {
  const email = uniqueEmail('provider');
  await page.goto('/en');
  await acceptAnalytics(page);

  await page.getByRole('link', { name: /I offer services/ }).first().click();
  const form = page.locator('#join form');
  await expect(form.getByRole('radio', { name: /I provide services/ })).toBeChecked();
  await expect(form.getByLabel('Country where you provide services')).toBeVisible();

  await form.getByLabel('Email address').fill(email);
  await form.getByLabel('Country where you provide services').selectOption('DE');
  await form.getByRole('checkbox', { name: /I agree to receive emails/ }).check();
  await form.getByRole('button', { name: 'Join the provider waitlist' }).click();

  await expect(page.getByRole('heading', { name: "You're on the provider list!" })).toBeVisible();
  const [saved] = await brevoRequestsFor(email);
  expect(saved.body?.listIds).toEqual([12]);
  expect(saved.body?.attributes).toMatchObject({ PROVIDER_COUNTRY: 'Germany', PROVIDER_COUNTRY_CODE: 'DE' });
  expect(saved.body?.attributes).not.toHaveProperty('PROVIDER_TYPE');
  expect(saved.body?.attributes).not.toHaveProperty('CUSTOMER_COUNTRY');

  const signups = (await events(page)).filter((e) => e.name.startsWith('waitlist_signup'));
  expect(signups).toEqual([{ name: 'waitlist_signup_provider', params: { audience: 'provider' } }]);
  await expectNoPersonalData(page, email);
});

test('invalid input is explained per field and nothing is sent', async ({ page }) => {
  await page.goto('/en#join');
  await acceptAnalytics(page);
  const form = page.locator('#join form');
  await form.getByRole('button', { name: 'Join the customer waitlist' }).click();

  await expect(form.getByText('Please enter your email address.')).toBeVisible();
  await expect(form.getByText('Please select a country.')).toBeVisible();
  await expect(form.getByText('Please tick the box to agree to receive launch updates.')).toBeVisible();
  await expect(form.getByLabel('Email address')).toBeFocused();
  await expect(form.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true');

  await form.getByLabel('Email address').fill('anna@example');
  await form.getByRole('button', { name: 'Join the customer waitlist' }).click();
  await expect(form.getByText(/Please enter a valid email address/)).toBeVisible();

  expect(await brevoRequestsFor('anna@example')).toHaveLength(0);
  const errors = (await events(page)).filter((e) => e.name === 'waitlist_form_error');
  expect(errors[0]?.params).toEqual({ audience: 'customer', error_type: 'validation' });
});

test('a failure in the contact tool shows an error and is not counted as a sign-up', async ({ page }) => {
  const email = uniqueEmail('fail500');
  await page.goto('/en#join');
  await acceptAnalytics(page);
  const form = page.locator('#join form');
  await form.getByLabel('Email address').fill(email);
  await form.getByLabel('Country of residence').selectOption('FR');
  await form.getByRole('checkbox', { name: /I agree/ }).check();
  await form.getByRole('button', { name: 'Join the customer waitlist' }).click();

  await expect(form.getByRole('alert').filter({ hasText: 'Something went wrong on our side' })).toBeVisible();
  await expect(form.getByRole('button', { name: 'Join the customer waitlist' })).toBeEnabled();
  const names = (await events(page)).map((e) => e.name);
  expect(names).not.toContain('waitlist_signup_customer');
  expect((await events(page)).find((e) => e.name === 'waitlist_form_error')?.params).toEqual({ audience: 'customer', error_type: 'server' });
});

test('the contact tool rejecting an address is shown on the email field', async ({ page }) => {
  await skipConsentBanner(page);
  await page.goto('/en#join');
  const form = page.locator('#join form');
  await form.getByLabel('Email address').fill(uniqueEmail('invalid'));
  await form.getByLabel('Country of residence').selectOption('ES');
  await form.getByRole('checkbox', { name: /I agree/ }).check();
  await form.getByRole('button', { name: 'Join the customer waitlist' }).click();
  await expect(form.getByText(/Please enter a valid email address/)).toBeVisible();
});

test('rate limiting and network problems show clear messages', async ({ page }) => {
  await skipConsentBanner(page);
  await page.goto('/en#join');
  const form = page.locator('#join form');
  const fill = async () => {
    await form.getByLabel('Email address').fill(uniqueEmail('limited'));
    await form.getByLabel('Country of residence').selectOption('NL');
    await form.getByRole('checkbox', { name: /I agree/ }).check();
  };
  await page.route('**/api/waitlist', (route) => route.fulfill({ status: 429, json: { ok: false, error: 'rate_limited' } }));
  await fill();
  await form.getByRole('button', { name: 'Join the customer waitlist' }).click();
  await expect(form.getByRole('alert')).toContainText('Too many attempts');

  await page.unroute('**/api/waitlist');
  await page.route('**/api/waitlist', (route) => route.abort('internetdisconnected'));
  await form.getByRole('button', { name: 'Join the customer waitlist' }).click();
  await expect(form.getByRole('alert')).toContainText("We couldn't reach the server");
});

test('form, validation and confirmation are localised', async ({ page }) => {
  await skipConsentBanner(page);
  const email = uniqueEmail('kunde');
  await page.goto('/de#join');
  const form = page.locator('#join form');
  await form.getByRole('button', { name: 'Auf die Kunden-Warteliste' }).click();
  await expect(form.getByText('Bitte gib deine E-Mail-Adresse ein.')).toBeVisible();
  await expect(form.getByText('Bitte wähle ein Land aus.')).toBeVisible();

  await form.getByLabel('E-Mail-Adresse').fill(email);
  await form.getByLabel('Wohnsitzland').selectOption('AT');
  await form.getByRole('checkbox', { name: /Ich möchte E-Mails von Loqelo/ }).check();
  await form.getByRole('button', { name: 'Auf die Kunden-Warteliste' }).click();
  await expect(page.getByRole('heading', { name: 'Du stehst auf der Liste!' })).toBeVisible();
  const [saved] = await brevoRequestsFor(email);
  expect(saved.body?.attributes).toMatchObject({ CUSTOMER_COUNTRY: 'Austria', SIGNUP_LANGUAGE: 'de', CONSENT_VERSION: '2026-10-v1/de' });
});

test('consent link opens the privacy policy in the same language', async ({ page, context }) => {
  await skipConsentBanner(page);
  await page.goto('/fr#join');
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.locator('#join form').getByRole('link', { name: 'politique de confidentialité' }).click(),
  ]);
  await expect(popup).toHaveURL(/\/fr\/privacy$/);
  await expect(popup.getByRole('heading', { level: 1 })).toHaveText('Politique de confidentialité');
});

test('the API refuses bots and other websites', async ({ request }) => {
  const email = uniqueEmail('bot');
  const body = { audience: 'customer', email, country: 'PL', consent: true, locale: 'en', elapsedMs: 9000 };
  const honeypot = await request.post('/api/waitlist', { data: { ...body, website: 'http://spam.example' }, headers: { origin: 'http://localhost:3200' } });
  expect(honeypot.status()).toBe(200);
  const crossSite = await request.post('/api/waitlist', { data: body, headers: { origin: 'https://evil.example' } });
  expect(crossSite.status()).toBe(403);
  const tooFast = await request.post('/api/waitlist', { data: { ...body, elapsedMs: 100 }, headers: { origin: 'http://localhost:3200' } });
  expect(tooFast.status()).toBe(400);
  expect(await brevoRequestsFor(email)).toHaveLength(0);
});
