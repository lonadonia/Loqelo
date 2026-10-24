import 'server-only';

/**
 * Best-effort sliding-window limit per IP, kept in memory of the running
 * function instance. It slows down scripted abuse; Turnstile is the main
 * protection. Nothing is persisted.
 */
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function maxRequests() {
  const configured = Number(process.env.WAITLIST_RATE_LIMIT);
  return Number.isInteger(configured) && configured > 0 ? configured : 6;
}

export function isRateLimited(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return recent.length > maxRequests();
}
