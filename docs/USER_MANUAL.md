# Loqelo pre-launch website: user manual

This manual is for the Loqelo team. It covers the everyday tasks: changing text, managing waitlist contacts, exporting them to CSV, reading the statistics and publishing changes. No programming knowledge is needed for the common tasks.

---

## 1. How the pieces fit together

| What | Where | Who can access it |
|---|---|---|
| Website code and texts | GitHub repository | Anyone you invite on GitHub |
| Hosting, domain, deployments | Vercel project | Team members you invite in Vercel |
| Waitlist contacts (customers and providers) | **Brevo** | Users you invite in Brevo |
| Visitor statistics | **Google Analytics 4** | Users you add in GA |
| Spam protection | Cloudflare Turnstile (free) | Your Cloudflare account |

When someone joins the waitlist: the form checks the input → the website's server checks spam protection → the contact is saved in Brevo in the **Customers** or **Service providers** list → only then is a “successful sign-up” counted in Google Analytics. Email addresses never go to Google Analytics.

---

## 2. Editing text

All text lives in one file per language:

```
src/content/en.json   English (default)
src/content/pl.json   Polish
src/content/de.json   German
src/content/nl.json   Dutch
src/content/fr.json   French
src/content/es.json   Spanish
```

**Editing on GitHub (no tools needed):**

1. Open the repository on github.com → `src/content/` → choose the language file.
2. Click the ✏️ pencil icon (“Edit this file”).
3. Change only the text **inside the quotes**, e.g. `"title": "Join before launch."`. Keep the quotes, commas and `{curly placeholders}` such as `{privacy}`, `{count}` or `{n}`.
4. Click **Commit changes**. Vercel publishes the change automatically within a few minutes.
5. Make the same change in the other five language files.

Tips:
- If a deployment fails after an edit, the JSON is usually broken: a missing comma or quote. Vercel shows the error; undo the last commit on GitHub to restore the site.
- To use a quotation mark inside a text, use typographic quotes (“ ” or ‘ ’) instead of `"`.
- The tagline `"Everything your place needs."` is kept in English in all languages as the brand line. The line below it (`taglineTranslation`) gives the meaning in the visitor's language. Leave it empty (`""`) to hide it.
- **Changing the consent wording?** Also raise `consentVersion` in `src/lib/site.ts` (e.g. `2026-10-v1` → `2027-01-v2`). Every contact stores the version they agreed to.

**Images and video** are in `public/` (`photos/`, `screens/`, `media/`). Replace a file with one of the same name and size ratio. For the video, use a **new file name** (e.g. `loqelo-promo-v2-1080p.mp4`) and update it in `src/components/video-player.tsx`, because browsers cache video files for a long time. Re-encoding command (needs ffmpeg):

```bash
ffmpeg -i source.mp4 -vf "scale=1920:-2,fps=30" -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart public/media/loqelo-promo-1080p.mp4
ffmpeg -i source.mp4 -vf "scale=1280:-2,fps=30" -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart public/media/loqelo-promo-720p.mp4
ffmpeg -i source.mp4 -vf "scale=1280:-2,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -c:a libopus -b:a 80k public/media/loqelo-promo-720p.webm
```

---

## 3. Languages

- Visitors who open `loqelo.com` are sent to a language based on their **country**. In countries with several languages (e.g. Belgium, Switzerland, Canada), the **browser language** decides. Otherwise the browser language is used, and **English** is the fallback.
- If the browser prefers another supported language, a small bar offers to switch.
- The **language menu** (globe icon, top right, and the language links in the footer) is always available. The choice is remembered for a year.
- Direct links such as `loqelo.com/pl` always show that language. Use them in campaigns.

The translations were drafted carefully but **should be reviewed by native speakers** before launch, especially the consent text and the privacy policy.

Country → language rules are in `src/lib/i18n/detect.ts`. Adding a language means adding a JSON file and the language code in `src/lib/i18n/config.ts`. A developer task of under an hour, plus translation.

---

## 4. Waitlist contacts in Brevo

### One-time setup (about 10 minutes)

1. Create a free account at [brevo.com](https://www.brevo.com) with a Loqelo company email.
2. **Settings → SMTP & API → API keys → Generate a new API key**. Give it the *Contacts* permission and copy the key.
3. On a computer with the project and Node.js installed, run:
   ```bash
   BREVO_API_KEY=your-key npm run brevo:setup
   ```
   This creates the folder **Loqelo waitlist**, the lists **Loqelo waitlist – Customers** and **Loqelo waitlist – Service providers**, and the contact fields below. It prints two list IDs.
4. In **Vercel → Project → Settings → Environment Variables**, add `BREVO_API_KEY`, `BREVO_LIST_ID_CUSTOMERS` and `BREVO_LIST_ID_PROVIDERS`, then **Redeploy**.
5. Test: sign up once as a customer and once as a provider on the live site. Both should appear in the right Brevo lists.

*No terminal available?* In Brevo, create the two lists by hand (**Contacts → Lists → Create a list**). Then create the text fields from the table below (**Contacts → Settings → Contact attributes → Add a new attribute**, type *Text*). Use the list IDs shown in Brevo.

### What is stored per contact

| Brevo field | Example | Meaning |
|---|---|---|
| EMAIL | anna@example.com | Email address |
| List membership | Customers / Service providers | Which path they used. One person can be on both lists. |
| CUSTOMER_COUNTRY / PROVIDER_COUNTRY | Poland | Country of residence / country where they provide services |
| CUSTOMER_COUNTRY_CODE / PROVIDER_COUNTRY_CODE | PL | Same, as an ISO code (handy for segments) |
| CUSTOMER_TYPE / PROVIDER_TYPE | Individual / Business | Optional answer; empty if not given |
| SIGNUP_LANGUAGE | pl | Language of the page. Use it to send emails in the right language. |
| CONSENT_TIMESTAMP | 2026-10-24T10:00:00.000Z | When they ticked the consent box |
| CONSENT_VERSION | 2026-10-v1/pl | Which consent text (version/language) they accepted |

**Double opt-in (recommended in Germany/Austria):** in Brevo, create a *Double opt-in confirmation* email template. Then set `BREVO_DOI_TEMPLATE_ID` (its ID) and `BREVO_DOI_REDIRECT_URL` (e.g. `https://loqelo.com/en`) in Vercel and redeploy. New sign-ups then get a confirmation email, the website says “check your inbox”, and Brevo records the confirmation.

### Managing contacts

- **Contacts → Lists** shows each list with its number of contacts. Open a list to search, edit or delete contacts.
- **Segments** let you filter, e.g. providers in Germany: list *Service providers* + `PROVIDER_COUNTRY_CODE` equals `DE`.
- **Unsubscribes** are handled by Brevo automatically (link in every email). Do not re-import unsubscribed contacts.
- **Deletion requests (GDPR):** find the contact → **Delete**.
- **Team access:** Settings → *Users*. The free plan allows one user; paid plans allow more.

### Exporting to CSV

1. **Contacts → Lists** → tick *Loqelo waitlist – Customers* (and/or *Service providers*).
2. Click **Export** (or open the list → **⋯ → Export list**).
3. Choose the fields to include (EMAIL plus the fields in the table above) and the CSV format.
4. Brevo prepares the file and sends a download link by email or under **Contacts → Import & export history**.

### Sending the launch announcement

**Campaigns → Email → Create**, choose the list(s), and optionally a segment per `SIGNUP_LANGUAGE`, so each person gets the email in their language. The free plan sends **300 emails per day**. For a larger list, upgrade to a Starter plan for the launch month (see costs below).

---

## 5. Statistics (Google Analytics 4)

### Setup (about 15 minutes)

1. At [analytics.google.com](https://analytics.google.com) create a property **Loqelo** with a *Web* data stream for `https://loqelo.com`. Copy the **Measurement ID** (`G-XXXXXXXXXX`).
2. In the data stream: **Enhanced measurement → turn off “Form interactions”**. The site sends its own form events, and this avoids double counting.
3. **Admin → Data collection → Google signals: off. Admin → Data retention: 14 months.**
4. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel and **redeploy**. The consent banner then appears for visitors.
5. **Admin → Events**: once the events below have occurred at least once, mark `waitlist_signup_customer` and `waitlist_signup_provider` as **key events** (conversions).
6. **Admin → Custom definitions → Create custom dimensions** (event scope): `audience`, `error_type`, `cta_location`.

### What you can see

| Question | Where in GA4 |
|---|---|
| How many visitors? | Reports → *Acquisition overview* / *Traffic acquisition* (Users, Sessions) |
| From which countries? | Reports → *User attributes → Demographic details* → Country |
| How many customer / provider sign-ups? | Reports → *Engagement → Events* → `waitlist_signup_customer`, `waitlist_signup_provider` (or *Key events*) |
| Basic conversion rate | Key event rate = sign-ups ÷ users (shown next to key events) |
| Form effectiveness | Explore → *Funnel exploration*: `waitlist_form_view` → `waitlist_form_start` → `waitlist_signup_*`, broken down by `audience` |
| Where problems happen | `waitlist_form_error` by `error_type` (validation, server, network, spam, rate_limited, unavailable) |
| Video interest | `promo_video_play` (started, incl. muted autoplay), `promo_video_unmute` (sound turned on), `promo_video_progress` (25/50/75 %), `promo_video_complete` |

**Events sent by the site**

| Event | When | Parameters |
|---|---|---|
| `waitlist_signup_customer` | Customer registration **accepted by Brevo** | audience |
| `waitlist_signup_provider` | Provider registration **accepted by Brevo** | audience |
| `waitlist_form_view` | Form scrolled into view (per path) | audience |
| `waitlist_form_start` | First interaction with the form (per path) | audience |
| `waitlist_form_error` | Validation or submission problem | audience, error_type |
| `cta_click` | “I need / I offer services” and waitlist buttons | cta_location, audience |
| `promo_video_play` / `_unmute` / `_progress` / `_complete` | Video started (plays by itself when its section is on screen) / sound turned on with the button / watched | percent |
| `language_change` | Language switched manually | from_language, to_language |

Privacy rules built into the site: GA loads **only after consent**. Advertising features and Google signals are off. Page addresses are sent **without query strings**. Event parameters come from a fixed allow-list, so **no email addresses or form answers** can be sent. Countries in GA come from GA's own IP-based location, not from the form. Visitors can change their choice at any time under **Cookie settings** in the footer.

> Visitors who decline analytics are not counted in GA. Brevo's list counts remain the complete source for the number of sign-ups.

---

## 6. Spam protection

Always active: an invisible honeypot field, a minimum time to fill the form, a same-site check and a per-IP rate limit. For strong protection, enable **Cloudflare Turnstile** (free):

1. Cloudflare dashboard → **Turnstile → Add widget**, domain `loqelo.com` (add your `*.vercel.app` preview domain too if needed), mode *Managed*.
2. Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in Vercel and redeploy.

Most visitors never see a challenge. Suspicious traffic gets a quick check above the submit button.

---

## 7. Publishing and hosting

- **Vercel** builds and publishes the site on every push to the main branch. **Deployments** shows the history, and **Instant Rollback** restores a previous version in one click.
- **Domain:** Vercel → Project → *Settings → Domains* → add `loqelo.com` and `www.loqelo.com`, then create the DNS records Vercel shows at your domain registrar. Email (MX) records are not affected.
- **Self-hosting instead of Vercel:** any host with Node.js ≥ 20.9 can run `npm ci && npm run build && npm start` behind HTTPS. Pure static/shared hosting cannot run the sign-up API. The language detection then needs a `cf-ipcountry` header (Cloudflare) or falls back to browser language.
- **Before go-live checklist:** Brevo variables set and tested · GA ID set · Turnstile keys set · `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_CONTROLLER_DETAILS` set · privacy policy approved by you or your legal advisor (the “Draft” notice disappears once both values are set) · translations reviewed · rights to the client-supplied photos confirmed.

---

## 8. Costs

| Service | Plan | Cost |
|---|---|---|
| Vercel hosting | Hobby is free but **for non-commercial use only**; a business site should use **Pro** | Pro ≈ **$20 per developer seat / month** (viewers free) |
| Brevo contacts | Free: up to 100,000 contacts, 300 emails/day, 1 user | Free; Starter from ≈ **$9 / month** for bigger sends (e.g. launch month) |
| Google Analytics 4 | Standard | Free |
| Cloudflare Turnstile | Free plan | Free |
| Fonts, icons, photos | OFL / Pixabay / client-owned | Free |
| Domain & email | Already owned by Loqelo | — |

No paid templates or licences are used. Prices change; check [vercel.com/pricing](https://vercel.com/pricing) and [brevo.com/pricing](https://www.brevo.com/pricing/) before deciding.

**Recurring maintenance:** none required. Optionally, once or twice a year, have a developer update dependencies (`npm update`, run the tests, deploy).
