import { NextResponse } from 'next/server';
import { addToWaitlist, brevoConfig, BrevoError } from '@/lib/waitlist/brevo';
import { isRateLimited } from '@/lib/waitlist/rate-limit';
import { verifyTurnstile } from '@/lib/waitlist/turnstile';
import { parseSignup, type WaitlistRequest } from '@/lib/waitlist/validate';
import { consentVersion } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_FILL_MS = 1200;
const MAX_BODY_BYTES = 4096;

type ErrorCode = 'validation' | 'spam' | 'rate_limited' | 'unavailable' | 'server' | 'bad_request';

function fail(status: number, error: ErrorCode, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function ok(mode: 'subscribed' | 'confirm') {
  return NextResponse.json({ ok: true, mode }, { headers: { 'Cache-Control': 'no-store' } });
}

function clientIp(request: Request) {
  return request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

/** Rejects cross-site posts: the browser always sends Origin on fetch POSTs. */
function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, 'bad_request');
  if (!request.headers.get('content-type')?.includes('application/json')) return fail(415, 'bad_request');

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return fail(413, 'bad_request');
  let body: WaitlistRequest;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, 'bad_request');
  }

  // Honeypot filled in: answer like a success so bots learn nothing, store nothing.
  if (typeof body.website === 'string' && body.website.trim() !== '') return ok('subscribed');
  if (typeof body.elapsedMs !== 'number' || body.elapsedMs < MIN_FILL_MS) return fail(400, 'spam');

  const ip = clientIp(request);
  if (isRateLimited(ip ?? 'unknown')) return fail(429, 'rate_limited');

  const parsed = parseSignup(body);
  if (!parsed.ok) return fail(400, 'validation', { fields: parsed.errors });

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (turnstileSecret && !(await verifyTurnstile(turnstileSecret, body.turnstileToken, ip))) return fail(403, 'spam');

  const config = brevoConfig();
  if (!config) {
    console.error('[waitlist] Brevo is not configured: set BREVO_API_KEY, BREVO_LIST_ID_CUSTOMERS and BREVO_LIST_ID_PROVIDERS.');
    return fail(503, 'unavailable');
  }

  try {
    const result = await addToWaitlist(config, parsed.signup, consentVersion);
    return ok(result.mode);
  } catch (error) {
    if (error instanceof BrevoError && error.code === 'invalid_email') {
      return fail(400, 'validation', { fields: { email: 'emailInvalid' } });
    }
    // Log the failure type only — never the email address or other form content.
    console.error('[waitlist] contact could not be saved:', error instanceof BrevoError ? `${error.status} ${error.code}` : (error as Error)?.name);
    return fail(502, 'server');
  }
}
