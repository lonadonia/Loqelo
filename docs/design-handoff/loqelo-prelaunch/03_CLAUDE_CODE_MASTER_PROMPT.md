# 03 — Master prompt for continuing work on the Loqelo pre-launch website

Paste the block below into a fresh Claude Code session opened on this repository.

---

You are maintaining the **Loqelo pre-launch website**, a Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 site in this repository. Loqelo is a platform that will connect customers with service providers for the home, garden and office. It launches in **February 2027**. The site's job is to present the concept and collect waitlist sign-ups from customers and service providers. Your deliverable is always **working, tested code pushed to GitHub and deployable on Vercel**, not just documentation.

## Read first
1. `README.md`: stack, scripts, environment variables, structure.
2. `docs/USER_MANUAL.md`: how the client uses Brevo, GA4, content files and Vercel.
3. `docs/design-handoff/loqelo-prelaunch/01_CLIENT_BRIEF_ANALYSIS.md` (requirements REQ-001…027) and `02_CREATIVE_DESIGN_BLUEPRINT.md` (design system and sections).
4. `src/content/en.json`: all English copy. The other five languages mirror its structure exactly.

Then run `git status`, `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`.

## Immovable requirements
- Hero shows the official Loqelo logo and the exact tagline **“Everything your place needs.”** (kept in English in every language; the `taglineTranslation` line is optional).
- Required content: what Loqelo is and who it serves; promo video; platform screenshots labelled as **design previews with sample data**; 4-step journey (describe → matched → offers → choose); the **February 2027** launch (month and year only, never invent a day); two waitlist paths; clear CTAs.
- Never invent testimonials, user counts, ratings, partner logos or launch-day dates. Never imply the marketplace is live.
- Forms: customers give email + country of residence (+ optional individual/business); providers give email + country where they provide services (+ optional business/individual). There is an explicit, unticked consent checkbox with a privacy link. A success message appears only after the server accepted the sign-up.
- Sign-ups go through `src/app/api/waitlist/route.ts` to **Brevo** (separate lists per audience; consent timestamp and version stored). Secrets stay server-side; never prefix them with `NEXT_PUBLIC_`.
- Analytics: GA4 loads **only after consent**. Events go through `src/lib/analytics.ts` with its parameter allow-list. Never send emails, form answers or query strings. Sign-up events (`waitlist_signup_customer` / `_provider`) fire only after a successful API response.
- Languages: en (default), pl, de, nl, fr, es. Detection in `src/proxy.ts` + `src/lib/i18n/detect.ts` (manual cookie → country, with browser language as tiebreaker → browser → English). Every text change goes into all six JSON files; `npm run check:i18n` must pass.
- Brand tokens come from the client UI kit (`src/app/globals.css`); do not redesign the logo or platform UI. For small text, use `text-subtle`, `text-teal-d` and `text-mint-ink` (WCAG AA), not `mute`, `teal` or `mint-d`.
- Out of scope: the marketplace itself (dashboards, job posting, matching, bidding, messaging, payments).

## Working rules
- Inspect before editing. Keep changes minimal and consistent with the surrounding code.
- After changes: `npm run lint && npm run typecheck && npm test && npm run build`. Run `npm run test:e2e` for anything touching the UI, forms, analytics or routing. It builds into `.next-e2e` and uses `tests/e2e/mock-brevo.mjs`, never real Brevo. Check layouts at 1440, 1024, 768, 390 and 360 px.
- Commit with a descriptive message and push to the working branch. Never force-push, never commit `.env*`, and never deploy to the client's production domain or change DNS without explicit permission.
- Vercel: the GitHub-linked project builds every push; check the deployment state and the live routes (`/`, `/en`, `/en/privacy`, `/api/geo`).

## Definition of done
All touched REQs still pass. Lint, types, unit and e2e tests are green (or each failure is explained). No new accessibility violations. Pushed commit SHA reported. The Vercel deployment URL is reported only if it was actually built and checked. Remaining client dependencies are listed: Brevo keys, GA4 ID, Turnstile keys, controller details, legal and translation review, photo licences, domain.
