# 01 — Client brief analysis: Loqelo pre-launch website

## 1. Project snapshot

| | |
|---|---|
| Client | Loqelo: platform connecting customers with service providers for home, garden and office |
| Project | Pre-launch website (contest brief) with waitlist, analytics, multilingual delivery |
| Phase | Built, tested, pushed and previewed; production go-live waits on client accounts (Brevo, GA4, domain) |
| Goal | Present the concept, generate interest, collect waitlist sign-ups from customers and providers in many countries before the **February 2027** launch |

## 2. Verified sources (inspected 24 Oct 2026)

| Source | Inspected | Notes |
|---|---|---|
| `Brief.pdf` (4 pages) | Full text | Sections 1–8: goals, materials, required content, forms, analytics, technology, deliverables, judging criteria |
| `Downloads.rar` → `logo (1).zip` | PNG/PDF/AI/EPS logo + icon | Used the UI-kit SVGs (identical artwork) |
| `Downloads.rar` → `video.zip` | `Loqelo final video compressed.mp4` (81.6 s, 1080p60, AAC) | Re-encoded; ends on the logo + “Everything your place needs.” + HOME · GARDEN · OFFICE |
| `uiux2.rar` | `01 Screens` (desktop @1x/@2x, mobile @1x/@3x), `02 UI Kit` (tokens.css/json, icons, logo SVGs, kit sheet), `03 Figma` | Screens/tokens/icons used. The `.fig` file was not opened (binary; the PNG/SVG exports cover the need) |
| `uiux1.rar` | `04 Vector` (AI/PDF), `05 Fonts` (Outfit, DM Sans + OFL), `06 Photos` (Pixabay + “Your photos”) | Fonts and photos used; the vector PDFs duplicate the screens |
| `zmiany.rar` | `zmiany.docx` (platform revision notes, with third-party DesignCrowd examples), 2 reference JPGs | Context only. Its own instruction says not to copy the examples, so nothing was copied. Relevant signals: make the logo stand out, a short visual slogan, a more visual “How Loqelo works”, imagery showing real work |

## 3. What the client actually wants

- **Tone:** modern, minimalist, professional, “global tech startup”.
- **Audiences:** (a) customers needing services for home/garden/office; (b) contractors wanting more work.
- **Primary action:** join the waitlist, as one of two clearly separate paths.
- **Judging order (brief §8):** attractive modern design → clear concept → good UX and inviting sign-up → mobile → simple, reliable tech → easy contact management and statistics.

## 4. Scope boundary

- **Build:** one landing page (in 6 languages) + privacy page, waitlist forms, server integration with a contact tool, analytics with consent, SEO basics, deployment setup, documentation.
- **Not built (out of scope):** the marketplace itself: dashboards, job posting, matching, bidding, messaging, payments, maps. Platform screens are shown only as labelled design previews with sample data.

## 5. Requirements matrix

| ID | Class | Source | Requirement | Pri | Implementation | Acceptance evidence | Status |
|---|---|---|---|---|---|---|---|
| REQ-001 | EXPLICIT | Brief §3 | Main section with logo and exact tagline “Everything your place needs.” | MUST | `sections/hero.tsx`: large official logo + H1 tagline (kept in English in every locale, translation line beneath) | e2e `main content…`, unit `keeps the exact tagline` | Verified |
| REQ-002 | EXPLICIT | Brief §1/§3 | Explain what Loqelo offers and whom it serves | MUST | Hero lead, `intro.tsx` (Home/Garden/Office + categories), `audiences.tsx` (customers/providers) | Screenshots 1440/390 | Verified |
| REQ-003 | EXPLICIT | Brief §3 | Promotional video | MUST | `video-player.tsx`, click-to-load MP4 1080p/720p + WebM | e2e `promo video loads only on demand and plays` | Verified |
| REQ-004 | EXPLICIT | Brief §3 | Attractive presentation of selected screenshots | MUST | `how-it-works.tsx` (cropped step screens), `preview-gallery.tsx` (tabs + lightbox, desktop and mobile frames) | e2e `platform preview tabs and lightbox…` | Verified |
| REQ-005 | EXPLICIT | Brief §3 | How it works: describe → matched → offers → select | MUST | 4-step scroll-linked section | e2e checks all 4 step headings | Verified |
| REQ-006 | EXPLICIT | Brief §1/§3 | Planned launch February 2027, no invented launch day | MUST | Hero badge, launch section (month/year calendar tile, timeline), FAQ, final CTA | unit `mentions the February 2027 launch` | Verified |
| REQ-007 | EXPLICIT | Brief §3/§4 | Two waitlist paths: customers and providers | MUST | `waitlist-form.tsx` with radio-card paths, distinct labels/colours/submit text, separate Brevo lists | e2e customer + provider tests | Verified |
| REQ-008 | EXPLICIT | Brief §4 | Customer fields: email, country of residence, optional individual/business | MUST | Form fields + `validate.ts` | e2e + unit | Verified |
| REQ-009 | EXPLICIT | Brief §4 | Provider fields: email, country of service, optional business/individual | MUST | Same, provider labels and order | e2e provider test | Verified |
| REQ-010 | EXPLICIT | Brief §4 | Consent for launch/updates emails, with privacy link; recorded | MUST | Unticked required checkbox + privacy link; `CONSENT_TIMESTAMP` + `CONSENT_VERSION` stored in Brevo; optional double opt-in | e2e asserts payload attributes | Verified (wording needs client/legal approval) |
| REQ-011 | EXPLICIT | Brief §4 | Brief confirmation after successful sign-up | MUST | Success panel (focus moved, `role=status`), DOI variant | e2e | Verified |
| REQ-012 | EXPLICIT | Brief §4 | Ready-made contact tool, customer/contractor distinction, CSV export, client access | MUST | Brevo (free plan) lists + attributes; `scripts/brevo-setup.mjs`; manual §4 | Code + mock tests; **live Brevo not testable here (no account, API host blocked)** | Blocked (external) |
| REQ-013 | EXPLICIT | Brief §5 | Analytics: visitors, countries, sign-ups per type, form effectiveness/conversion | MUST | GA4 (`consent-manager.tsx`, `analytics.ts`), events listed in manual §5 | e2e checks events and config | Implemented; **needs the client's GA4 ID** |
| REQ-014 | EXPLICIT | Brief §5 | Comply with consent; no emails/form content in analytics | MUST | GA loads only after consent; parameter allow-list; URL without query | e2e `nothing is loaded…`, `expectNoPersonalData` | Verified |
| REQ-015 | EXPLICIT | Brief §6 | Works on desktop and mobile | MUST | Responsive layout, mobile carousel/tabs | e2e no-overflow 1440/1024/768/390/360; screenshots | Verified |
| REQ-016 | EXPLICIT | Brief §6 | Loads quickly | MUST | Static pages, self-hosted subset fonts, optimised WebP/AVIF images, video loads on click | Build output (static SSG); no Lighthouse score claimed | Implemented |
| REQ-017 | EXPLICIT | Brief §6 | Language from detected location; easy manual switch; remembered | MUST | `proxy.ts` + `detect.ts`, switcher + footer links, cookie, suggestion bar | unit detection tests; e2e redirects + switcher | Verified (6 languages proposed, need client confirmation) |
| REQ-018 | EXPLICIT | Brief §6 | Basic SEO | MUST | Metadata per locale, canonical + hreflang, OG image, JSON-LD, sitemap, robots | e2e `SEO basics` | Verified |
| REQ-019 | EXPLICIT | Brief §6 | Secure forms, spam protection | MUST | Server validation, same-origin, size limit, honeypot, timing, rate limit, Turnstile option, CSP | unit route tests; e2e API test | Verified (Turnstile live keys pending) |
| REQ-020 | EXPLICIT | Brief §6 | Easy content editing | MUST | One JSON file per language; manual §2 | Manual | Implemented |
| REQ-021 | EXPLICIT | Brief §7 | Deployed and tested website | MUST | Vercel project linked to GitHub | See 05 handoff | See 05 |
| REQ-022 | EXPLICIT | Brief §7 | Admin access and own deployment management | MUST | GitHub repo + Vercel project; ownership transfer steps in 05 | — | Needs client accounts |
| REQ-023 | EXPLICIT | Brief §7 | Brief user manual | MUST | `docs/USER_MANUAL.md` | File | Done |
| REQ-024 | EXPLICIT | Brief §7 | Disclose paid licences/subscriptions | MUST | Manual §8, README | File | Done |
| REQ-025 | CONSTRAINT | Brief §2 | Use existing logo/identity/screens; don't redesign brand or platform | MUST | Tokens 1:1 from UI kit; official logo/icons; screens unaltered except resize/crop | Visual review | Verified |
| REQ-026 | CONSTRAINT | Task brief | No invented testimonials, user counts, launch-day dates | MUST | None used; screens labelled “sample data”; month/year only | Content review | Verified |
| REQ-027 | INFERRED | Accessibility | WCAG 2.1 AA basics | SHOULD | Semantic landmarks, focus states, labelled fields, reduced motion, contrast tokens | axe e2e on /en, /pl, /en/privacy | Verified (automated) |

## 6. Assumptions (A-xxx)

| ID | Assumption | Confidence | Risk if wrong | Validation |
|---|---|---|---|---|
| A-001 | Initial languages: EN (default), PL, DE, NL, FR, ES | Medium | Missing market language | Client confirms; adding one is quick |
| A-002 | The tagline stays in English everywhere (brand line), with a translated sub-line | Medium | Client may want a fully local H1 | Toggle per JSON file |
| A-003 | Brevo is an acceptable contact tool (free, EU-based, CSV export) | High | Client prefers Mailchimp/MailerLite | Only `lib/waitlist/brevo.ts` would change |
| A-004 | Vercel hosting (client "hosting" may be shared hosting that cannot run Node) | Medium | Need a Node host or Vercel Pro | Manual §7 lists both options |
| A-005 | Supplied screenshots are approved for public promotion | Medium | Some screens change after the `zmiany` revisions | Swap files in `public/screens` |
| A-006 | “Your photos” are client-licensed | Medium | Licence issue | Client confirms (CREDITS.md) |

## 7. Dependencies and risks

- Brevo account + API key; GA4 property; Turnstile keys; domain DNS access; company/controller details and contact email for the privacy policy; legal review of consent/privacy text; native-speaker review of translations.
- Vercel Hobby plan is non-commercial; a business launch should use Pro or a Node.js host.

## 8. Recommendation

Proceed with the built Next.js site on Vercel + Brevo + GA4. Next: connect the client's accounts (≈30 minutes, manual §4–§6), approve texts, point the domain.
