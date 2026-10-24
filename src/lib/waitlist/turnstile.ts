import 'server-only';

/** Server-side check of a Cloudflare Turnstile token. */
export async function verifyTurnstile(secret: string, token: string | null | undefined, ip: string | null): Promise<boolean> {
  if (!token || token.length > 4096) return false;
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set('remoteip', ip);
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
