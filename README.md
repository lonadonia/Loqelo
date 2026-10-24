# Loqelo — pre-launch website

Pre-launch landing page for **Loqelo**, the platform that connects customers with service providers for the home, garden and office. Tagline: **“Everything your place needs.”** Planned launch: **February 2027**.

The site explains the concept, shows the promotional video and platform screenshots, and collects waitlist sign-ups from **customers** and **service providers** in six languages. Sign-ups go to **Brevo** (contact management, CSV export). Visits, countries and sign-up conversions go to **Google Analytics 4**, but only after the visitor consents.

> Client-facing instructions (editing text, contacts, CSV export, analytics, deployment) are in **[docs/USER_MANUAL.md](docs/USER_MANUAL.md)**.
> Design and delivery documentation: [docs/design-handoff/loqelo-prelaunch/](docs/design-handoff/loqelo-prelaunch/).

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS 4, design tokens from the Loqelo UI kit (`src/app/globals.css`) |
| Fonts | Outfit + DM Sans (supplied, OFL), self-hosted WOFF2 |
| Contacts | Brevo API via a server route (`/api/waitlist`); the key never reaches the browser |
| Spam protection | Honeypot + minimum fill time + same-origin check + rate limit + optional Cloudflare Turnstile |
| Analytics | Google Analytics 4, loaded only after consent; no personal data in events |
| Languages | en (default), pl, de, nl, fr, es: JSON files in `src/content/` |
| Hosting | Vercel (recommended). Any Node.js ≥ 20.9 host running `next start` also works. |
| Tests | Vitest (unit), Playwright + axe (end-to-end, accessibility) |

## Getting started

```bash
nvm use            # Node 22 (see .nvmrc); Node ≥ 22.12 is needed for the tests
npm ci
cp .env.example .env.local   # fill in what you have; everything is optional for local work
npm run dev        # http://localhost:3000
```

Without Brevo variables the site works, and the form answers with a clear “Sign-ups are temporarily unavailable” message. It never shows a fake success.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm test` | Unit tests (validation, language detection, Brevo payloads, API route, translations) |
| `npm run test:e2e` | Builds the site into `.next-e2e` and runs Playwright against a local **mock** of Brevo |
| `npm run check:i18n` | Checks that all six translations have the same keys and placeholders |
| `npm run brevo:setup` | Creates the Brevo lists and contact attributes and prints the list IDs |

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**. See `.env.example`. Never commit real values.

| Name | Required | Purpose |
|---|---|---|
| `BREVO_API_KEY` | yes, for sign-ups | Brevo API key with *Contacts* permission (server only) |
| `BREVO_LIST_ID_CUSTOMERS` / `BREVO_LIST_ID_PROVIDERS` | yes, for sign-ups | List IDs printed by `npm run brevo:setup` |
| `BREVO_DOI_TEMPLATE_ID` / `BREVO_DOI_REDIRECT_URL` | optional | Turns on double opt-in (confirmation email) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | recommended | Cloudflare Turnstile spam protection |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | for analytics | GA4 measurement ID (`G-…`); the consent banner appears only when set |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical URL, default `https://loqelo.com` |
| `NEXT_PUBLIC_CONTACT_EMAIL` / `NEXT_PUBLIC_CONTROLLER_DETAILS` | before go-live | Shown in the privacy policy (company name/address, contact) |
| `WAITLIST_RATE_LIMIT` | optional | Max sign-up attempts per IP per 10 min (default 6) |

`NEXT_PUBLIC_*` values are compiled into the page, so redeploy after changing them.

## Project structure

```
src/
  app/[locale]/page.tsx          Landing page (all sections)
  app/[locale]/privacy/page.tsx  Privacy policy (draft, needs client approval)
  app/api/waitlist/route.ts      Validates, protects and forwards sign-ups to Brevo
  app/api/geo/route.ts           Visitor country, used only to suggest a country in the form
  proxy.ts                       Language detection & redirect for URLs without a language
  content/{en,pl,de,nl,fr,es}.json   All text: edit here
  components/                    Header, footer, hero demo, form, sections…
  lib/i18n/                      Locales, country→language map, detection
  lib/waitlist/                  Validation, Brevo client, Turnstile, rate limit
  lib/analytics.ts               Consent-aware GA4 helper with a parameter allow-list
public/
  brand/ media/ photos/ screens/ og/   Optimised client assets
scripts/
  brevo-setup.mjs                One-time Brevo setup
  optimize-assets.mjs            How the images in /public were produced
tests/unit, tests/e2e            Automated tests (e2e uses tests/e2e/mock-brevo.mjs)
licenses/                        Font and photo licences
```

## Deploying on Vercel

1. Import the GitHub repository in Vercel (framework preset: **Next.js**, no extra settings needed).
2. Add the environment variables above (Production + Preview).
3. Deploy. Every push to the production branch redeploys automatically; other branches get preview URLs.
4. Add `loqelo.com` under **Project → Settings → Domains** and set the DNS records Vercel shows.

No `vercel.json` is needed. Language detection uses Vercel's `x-vercel-ip-country` header (Cloudflare's `cf-ipcountry` is also understood).

## Licences

Fonts: SIL Open Font License (`licenses/`). Photos: client-supplied, plus Pixabay Content License (`licenses/Pixabay-photos.txt`). Logo, video and platform designs © Loqelo. See [licenses/CREDITS.md](licenses/CREDITS.md).
