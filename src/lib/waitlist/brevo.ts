import 'server-only';
import { englishCountryName } from '../countries';
import type { WaitlistSignup } from './validate';

/**
 * Brevo (https://www.brevo.com) stores the waitlist. Customers and providers go
 * to separate lists; audience-specific attributes are kept apart so one person
 * can be on both lists without one sign-up overwriting the other.
 */
export type BrevoConfig = {
  apiKey: string;
  baseUrl: string;
  listIds: { customer: number; provider: number };
  doi: { templateId: number; redirectionUrl: string } | null;
};

export function brevoConfig(env: Record<string, string | undefined> = process.env): BrevoConfig | null {
  const apiKey = env.BREVO_API_KEY?.trim();
  const customer = Number(env.BREVO_LIST_ID_CUSTOMERS);
  const provider = Number(env.BREVO_LIST_ID_PROVIDERS);
  if (!apiKey || !Number.isInteger(customer) || customer <= 0 || !Number.isInteger(provider) || provider <= 0) return null;
  const templateId = Number(env.BREVO_DOI_TEMPLATE_ID);
  const redirectionUrl = env.BREVO_DOI_REDIRECT_URL?.trim();
  return {
    apiKey,
    // Overridable for automated tests against a local mock; production uses Brevo's API.
    baseUrl: (env.BREVO_API_BASE_URL?.trim() || 'https://api.brevo.com/v3').replace(/\/+$/, ''),
    listIds: { customer, provider },
    doi: Number.isInteger(templateId) && templateId > 0 && redirectionUrl ? { templateId, redirectionUrl } : null,
  };
}

export class BrevoError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(`Brevo request failed (${status} ${code})`);
  }
}

export function contactAttributes(signup: WaitlistSignup, consentVersion: string, now: Date) {
  const prefix = signup.audience === 'customer' ? 'CUSTOMER' : 'PROVIDER';
  const attributes: Record<string, string> = {
    [`${prefix}_COUNTRY`]: englishCountryName(signup.country),
    [`${prefix}_COUNTRY_CODE`]: signup.country,
    SIGNUP_LANGUAGE: signup.locale,
    CONSENT_TIMESTAMP: now.toISOString(),
    CONSENT_VERSION: `${consentVersion}/${signup.locale}`,
  };
  // Optional answer: only written when given, so an earlier answer is never erased.
  if (signup.type) attributes[`${prefix}_TYPE`] = signup.type === 'business' ? 'Business' : 'Individual';
  return attributes;
}

export async function addToWaitlist(
  config: BrevoConfig,
  signup: WaitlistSignup,
  consentVersion: string,
  now = new Date(),
): Promise<{ mode: 'subscribed' | 'confirm' }> {
  const listId = config.listIds[signup.audience];
  const attributes = contactAttributes(signup, consentVersion, now);
  const doi = config.doi;
  const url = doi ? `${config.baseUrl}/contacts/doubleOptinConfirmation` : `${config.baseUrl}/contacts`;
  const body = doi
    ? { email: signup.email, attributes, includeListIds: [listId], templateId: doi.templateId, redirectionUrl: doi.redirectionUrl }
    : { email: signup.email, attributes, listIds: [listId], updateEnabled: true };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'api-key': config.apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });

  if (response.ok) return { mode: doi ? 'confirm' : 'subscribed' };

  const data = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
  // Already known contact: treat as success so the form never reveals who is on the list.
  if (response.status === 400 && data.code === 'duplicate_parameter') return { mode: doi ? 'confirm' : 'subscribed' };
  if (response.status === 400 && data.code === 'invalid_parameter' && /email/i.test(data.message ?? '')) {
    throw new BrevoError(400, 'invalid_email');
  }
  throw new BrevoError(response.status, data.code ?? 'unknown');
}
