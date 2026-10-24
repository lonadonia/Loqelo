import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE, isLocale } from '@/lib/i18n/config';
import { negotiateLocale } from '@/lib/i18n/detect';

/**
 * Sends visitors without a language in the URL (e.g. "/" or "/privacy") to the
 * best matching language version. URLs that already contain a language are
 * left alone, so shared and indexed links always show the same language.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split('/')[1];
  if (isLocale(firstSegment)) return NextResponse.next();

  const { locale } = negotiateLocale({
    cookieLocale: request.cookies.get(LOCALE_COOKIE)?.value,
    // Set by Vercel's edge network; Cloudflare uses cf-ipcountry.
    country: request.headers.get('x-vercel-ip-country') ?? request.headers.get('cf-ipcountry'),
    acceptLanguage: request.headers.get('accept-language'),
  });

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  const response = NextResponse.redirect(url, 307);
  // The redirect depends on who is asking, so it must never be cached.
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  // Everything except API routes, Next.js internals and files with an extension.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
