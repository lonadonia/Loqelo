/** Public, non-secret site settings. Values come from environment variables (see .env.example). */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://loqelo.com').replace(/\/+$/, '');
export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '';
export const controllerDetails = process.env.NEXT_PUBLIC_CONTROLLER_DETAILS || '';
export const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

/**
 * Version of the waitlist consent wording. Bump it whenever the consent text in
 * src/content/*.json changes; it is stored with every contact as proof of what
 * the person agreed to.
 */
export const consentVersion = '2026-10-v1';
