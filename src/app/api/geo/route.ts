import { NextResponse } from 'next/server';
import { isCountryCode } from '@/lib/countries';

export const dynamic = 'force-dynamic';

/**
 * Country of the current request (from the hosting platform's IP geolocation),
 * used only to list that country first in the waitlist form. Not stored.
 */
export function GET(request: Request) {
  const raw = (request.headers.get('x-vercel-ip-country') ?? request.headers.get('cf-ipcountry') ?? '').toUpperCase();
  return NextResponse.json({ country: isCountryCode(raw) ? raw : null }, { headers: { 'Cache-Control': 'private, no-store' } });
}
