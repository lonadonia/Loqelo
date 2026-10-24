# 05 — GitHub and Vercel handoff

```
Project:            Loqelo pre-launch website (loqelo-prelaunch)
Implementation:     BUILT. All brief sections, two waitlist paths, Brevo integration (code), GA4 with consent, 6 languages
Stack:              Next.js 16.4.3 · React 19.3.1 · TypeScript 5.9.3 · Tailwind CSS 4.3.3 · npm (package-lock.json) · Node ≥ 22.12
Local build:        PASS. `npm run build` (12 prerendered locale pages, /api/waitlist, /api/geo, proxy)
Tests:              PASS. Lint, typecheck, 69 unit tests, 64 Playwright e2e tests (mock Brevo), axe on 3 pages × 2 viewports
GitHub status:      PUSHED
GitHub repo URL:    https://github.com/lonadonia/Loqelo
Visibility:         not verified from this session (check repository Settings → General)
Branch:             claude/determined-noether-sjmh61 (currently the repository's only and default branch)
Commit SHA:         e63fbc41e68192e795295bfd5c6f9fa186386de0 (first full build). Later commits on the same branch add these docs and an indexing header.
Vercel readiness:   VERIFIED_READY (framework auto-detected, no vercel.json needed)
Vercel deployment:  DEPLOYED_VERIFIED (state READY, pages fetched and checked)
Vercel project:     loqelo-prelaunch (team "hakim's projects"), linked to lonadonia/Loqelo
Vercel URLs:        https://loqelo-prelaunch-ten.vercel.app
                    https://loqelo-prelaunch-exfd6txwg-hakims-projects-8cc34b62.vercel.app (deployment for e63fbc4)
Client domain:      loqelo.com NOT connected. DNS untouched.
Environment keys:   BREVO_API_KEY, BREVO_LIST_ID_CUSTOMERS, BREVO_LIST_ID_PROVIDERS, BREVO_DOI_TEMPLATE_ID, BREVO_DOI_REDIRECT_URL,
                    NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, NEXT_PUBLIC_GA_MEASUREMENT_ID,
                    NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_CONTACT_EMAIL, NEXT_PUBLIC_CONTROLLER_DETAILS, WAITLIST_RATE_LIMIT
                    (none set in Vercel yet)
```

## What was verified on the Vercel deployment

| URL | Result |
|---|---|
| `/en` | 200, title “Loqelo — Everything your place needs. Launching February 2027”, hero, both waitlist paths, JSON-LD and video poster present |
| `/privacy` | Redirected by the language proxy to `/en/privacy` (US request), 200, canonical + hreflang to loqelo.com, draft notice shown |
| `/api/geo` | 200 `{"country":"US"}`, so Vercel's country header reaches the app (language detection works) |
| `/robots.txt` | 200, sitemap on loqelo.com |
| Headers | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy present |

Not verifiable yet: a real sign-up on Vercel. Without `BREVO_*` variables the API correctly answers **503 “Sign-ups are temporarily unavailable”** instead of faking success.

## Important notes

- **Production vs preview:** the repository had no other branch, so Vercel made `claude/determined-noether-sjmh61` the project's *production branch*. Deployments of that branch are therefore Vercel “production” deployments on the `*.vercel.app` addresses above. They are **not** connected to loqelo.com. Those addresses send `X-Robots-Tag: noindex` so they stay out of search results. To use a conventional `main` branch: create `main` from this branch on GitHub, then set **Vercel → Settings → Git → Production Branch** to `main`.
- **Plan:** the Vercel team appears to be on the free Hobby plan, which is for non-commercial use. Before the public launch, move the project to the client's own Vercel team on **Pro**: **Settings → General → Transfer Project**. Or host it on a Node.js server.
- **Deployment protection:** depending on the team's settings, preview URLs may ask for a Vercel login.

## Next actions, in order

1. **Client accounts:** create Brevo (run `npm run brevo:setup`), GA4 and Cloudflare Turnstile; add the variables in Vercel; redeploy. Test one customer and one provider sign-up, and check them in Brevo and in GA4 → Realtime. (Manual §4–§6)
2. **Content approvals:** privacy policy and consent text (legal), translations (native speakers), photo licences, screenshot approval. Set `NEXT_PUBLIC_CONTROLLER_DETAILS` and `NEXT_PUBLIC_CONTACT_EMAIL`.
3. **Ownership:** transfer the Vercel project and the GitHub repository (or add the client as owner/admin) so the client has administrative access.
4. **Domain:** Vercel → Settings → Domains → add `loqelo.com` and `www.loqelo.com`, then create the DNS records at the registrar. Keep the MX records for email.
5. Set `NEXT_PUBLIC_SITE_URL=https://loqelo.com` and redeploy.
