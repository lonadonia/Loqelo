# 04 — QA and acceptance checklist

Test run: 24 Oct 2026, Node 22.22, Chromium (Playwright 1.63), production builds. Statuses: `VERIFIED_PASS`, `IMPLEMENTED_NOT_TESTED`, `BLOCKED_EXTERNAL`, `NOT_APPLICABLE`.

## 1. Automated results

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | VERIFIED_PASS (0 problems) |
| Types | `npm run typecheck` | VERIFIED_PASS |
| Unit tests | `npm test` | VERIFIED_PASS: 69 tests in 5 files (validation, language detection, Brevo payloads, API route security, translations) |
| End-to-end | `npm run test:e2e` | VERIFIED_PASS: 64 tests (32 scenarios × desktop 1440 and Pixel 7), against a mock Brevo API |
| Production build | `npm run build` | VERIFIED_PASS: 12 static locale pages + 2 API routes + proxy |
| Vercel build | GitHub-linked project | VERIFIED_PASS: deployment READY; see 05 |

## 2. Requirement acceptance

| Test | REQ | Scenario | Evidence | Status |
|---|---|---|---|---|
| QA-01 | 001 | Logo + exact tagline in hero, all locales | e2e `main content…`; unit tagline test | VERIFIED_PASS |
| QA-02 | 002 | Concept and audiences explained | Screenshots 1440/390 | VERIFIED_PASS |
| QA-03 | 003 | Video downloads nothing at the top of the page; plays with sound in its section after any click; pauses when scrolled away and resumes from the same point; under a strict autoplay policy it starts muted and unmutes on the first click; reduced motion → click-to-play | e2e `promo video plays with sound…` + reduced-motion test; strict policy checked with a simulated browser rule | VERIFIED_PASS |
| QA-04 | 004 | Preview tabs, lightbox, arrow keys, Escape | e2e `platform preview…` | VERIFIED_PASS |
| QA-05 | 005 | 4 journey steps present; sticky stage follows scroll | e2e + 1440 screenshot (step 3) | VERIFIED_PASS |
| QA-06 | 006 | February 2027 in every locale; no day shown | unit; calendar tile | VERIFIED_PASS |
| QA-07 | 007/008 | Customer path: CTA preselects, focus on email, saved to list 11 with country, type, language, consent | e2e customer test (mock Brevo payload asserted) | VERIFIED_PASS |
| QA-08 | 007/009 | Provider path: own labels, list 12, provider attributes only | e2e provider test | VERIFIED_PASS |
| QA-09 | 010 | Consent required (strict `true`), timestamp + version stored, privacy link opens in the same language | unit + e2e | VERIFIED_PASS (wording needs legal approval) |
| QA-10 | 011 | Confirmation shown and focused only after server success | e2e | VERIFIED_PASS |
| QA-11 | 011 | Errors: field validation, contact tool 500, rejected address, 429, network failure | e2e (4 tests) | VERIFIED_PASS |
| QA-12 | 012 | Real Brevo account: lists, attributes, CSV export | Needs the client's Brevo account; `api.brevo.com` is unreachable from the build sandbox | BLOCKED_EXTERNAL |
| QA-13 | 013/014 | GA4 loads only after consent; config has no ads/signals and no query string; events allow-listed; no “@” in any analytics call; decline/revoke stops tracking | e2e `analytics consent` (2 tests) + `expectNoPersonalData` | VERIFIED_PASS (stubbed gtag) |
| QA-14 | 013 | Real GA4 reports (countries, key events) | Needs the client's GA4 property | BLOCKED_EXTERNAL |
| QA-15 | 015 | No horizontal overflow at 1440/1024/768/390/360 on /en, /de, /fr/privacy | e2e (5 tests) | VERIFIED_PASS |
| QA-16 | 017 | Redirects: PL→pl, BE+fr→fr, IT+es→es, JP→en, cookie wins; deep links keep path; no-store | e2e (6 tests) + unit (9) | VERIFIED_PASS |
| QA-17 | 017 | Manual switch remembered; browser-language suggestion bar | e2e (2 tests) | VERIFIED_PASS |
| QA-18 | 017 | Localised validation and confirmation (de) | e2e | VERIFIED_PASS |
| QA-19 | 018 | Title, canonical, hreflang incl. x-default, OG image, sitemap, robots, JSON-LD | e2e `SEO basics` | VERIFIED_PASS |
| QA-20 | 019 | Honeypot (silent drop), too-fast submit, cross-origin, non-JSON, oversize, Turnstile failure, rate limit, no email in logs | unit route tests + e2e API test | VERIFIED_PASS |
| QA-21 | 019 | Live Cloudflare Turnstile widget | Needs keys; `challenges.cloudflare.com` is unreachable from the sandbox | BLOCKED_EXTERNAL |
| QA-22 | 027 | axe (WCAG 2.0/2.1 A+AA): no serious or critical issues on /en, /pl, /en/privacy, desktop and mobile | e2e (6 tests) | VERIFIED_PASS (automated only; no screen-reader session) |
| QA-23 | 027 | Reduced motion: full demo, no autoplay controls | e2e | VERIFIED_PASS |
| QA-24 | 016 | Performance | Static prerender, 45 KB + 39 KB fonts, images optimised, video on demand. No Lighthouse score claimed | IMPLEMENTED_NOT_TESTED (no lab measurement) |
| QA-25 | — | Real devices (iOS Safari, Android Chrome, Firefox) | Not available in this environment | IMPLEMENTED_NOT_TESTED |

## 3. Visual review (screenshots taken)

1440: hero, how-it-works step 3, waitlist · 1024: hero/waitlist in German · 768: hero/preview in French · 390: hero/waitlist in Polish, privacy · 360: hero/waitlist in Spanish. Issues found and fixed during review: an empty composer while typing (added a “Recognising services…” state); the video label overlapping the poster; illegibly small step screenshots (now tight crops); uneven gallery heights; a “02” date that could read as a launch day (replaced by a month/year tile); colour contrast; tab wrapping on mobile; CTAs scrolling to launch info instead of the form on mobile.

## 4. Open risks before go-live

1. Brevo, GA4 and Turnstile accounts and keys (client).
2. Privacy policy and consent text: legal approval, controller details, contact email.
3. Native review of the PL/DE/NL/FR/ES translations.
4. Licence confirmation for the client-supplied “Your photos”.
5. Vercel plan: Hobby is non-commercial; use Pro, or move to a Node.js host, before the public launch.
