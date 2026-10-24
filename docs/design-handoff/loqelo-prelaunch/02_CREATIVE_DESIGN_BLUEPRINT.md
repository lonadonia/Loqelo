# 02 — Creative design blueprint: Loqelo pre-launch website

## 1. Experience thesis

> For homeowners, gardeners, office managers and the tradespeople who serve them, the page should feel **clear, warm and quietly technical**. It does this by letting the product's signature interaction, *describing a need in one sentence that Loqelo turns into recognised services*, carry the story. The result is that visitors understand the concept within one screen and join the right waitlist without friction.

The brand and UI kit were supplied and are locked (colours, type, icons, logo). Creative freedom applied to composition, motion and storytelling, not to brand redesign.

## 2. Three territories considered

| | A. “The Sentence” *(chosen)* | B. “Deep Field” | C. “Place Map” |
|---|---|---|---|
| Idea | The hero types real requests (“trim the hedge and mow the lawn”) and highlights recognised services, exactly as the platform will | Dark, immersive hero with the promo video as background and floating 3D screens | Map-led story using the Q-pin from the UI kit; journey drawn as a route |
| Layout DNA | Editorial split hero, light surfaces, mint “recognised” highlights | Full-bleed dark video stage | Illustrated map canvas |
| Strength | Explains the product instantly; reuses the platform's own pattern; fast | Dramatic | Very domain-specific |
| Risk | Needs careful motion/a11y | Heavy video on first load, weaker mobile performance, less “home” warmth | Implies live coverage/activity that does not exist yet (misleading pre-launch) |
| Score (fidelity 30 / clarity 25 / craft 20 / a11y 15 / feasibility 10) | **4.6** | 3.6 | 3.4 (fails the “no implied activity” gate) |

Elements borrowed from B and C: deep (#031C26) bands for the video and gallery, and the Q-mark as a timeline pin.

## 3. Distinctive system

- **Recognised-service highlight:** mint / blue / amber text marks and chips, taken from the platform's composer, used in the hero demo.
- **Teal full stop:** the tagline's last word “needs.” in teal, echoing the video's end card.
- **Light → deep rhythm:** light hero → deep video → light content → white steps → light audiences → deep gallery → light waitlist → teal final CTA → deep footer.
- **Month/year calendar tile** for the launch: shows February 2027 without inventing a day.

## 4. Tokens (from `02 UI Kit/tokens.css`, unchanged)

| Role | Token | Hex |
|---|---|---|
| Text primary | ink | #0C2229 |
| Text secondary | ink-2 | #3D5259 |
| Text subtle (added for AA contrast) | subtle | #5A6C71 |
| Page background | bg | #F4F7F6 |
| Card | card | #FFFFFF |
| Action | teal / teal-d | #077E88 / #05626A |
| Recognised / success | mint / mint-50 / mint-ink (added) | #65C8A6 / #E9F7F1 / #1F7D5E |
| Deep surfaces | deep | #031C26 |
| Error | red / red-50 | #D2544B / #FBEAE8 |
| Radii | r-s/m/l/xl | 10 / 14 / 20 / 28 px |
| Shadows | sh-1/2/3 | as in kit |

**Type:** Outfit 600 for display (hero clamp 48→102 px, −3.5 % tracking; H2 clamp 35→60 px); DM Sans for UI/body (16–19 px, line-height 1.5). Fonts are subset to Latin + Latin Ext-A for all six languages.

**Spacing/grid:** 1240 px container, 20 px (mobile) / 40 px (≥768) gutters, 12-column grid on desktop, section padding 80–112 px.

## 5. Page and section specification (`/[locale]`)

| # | Section | Objective | Desktop | Mobile | REQ |
|---|---|---|---|---|---|
| 1 | Header | Navigate, language, join | White pill bar at the top of the page as in the Home design (scrolls away with the page): logo, 4 anchors, language menu, “Join the waitlist” with circled arrow | Logo, language, menu card | 001, 017 |
| 2 | Hero | Brand + concept + two paths | Modelled on Figma *01 Home*: launch badge with the Loqelo mark, tagline H1 with mint underline (+ local translation), lead, the “What do you need?” box (typed request, Speak/city pills, “Join the waitlist” = customer path, recognised-service chips), provider link “Join as a provider”, trust row; right: tall photo with Home/Garden/Office switch, request-detail card and “Offers from local pros” card | Same order as the Figma mobile home (M1); photo hidden | 001, 002, 006, 007 |
| 3 | Video | Concept in 82 s | Plays automatically when half visible: with sound if the browser allows (any earlier click/tap), otherwise muted until the first click or “Turn sound on”; pauses when scrolled away and resumes from the same point; 1080p/720p MP4 or WebM | Same, 720p | 003 |
| 4 | What is Loqelo | Offer and scope | Statement + 3 place cards + 8 planned categories | Swipe carousel | 002 |
| 5 | How it works | 4-step journey | Sticky stage with cropped screens following scroll; progress rail | Each step followed by its screen | 004, 005 |
| 6 | Audiences | Whom it serves | Customer (mint) and provider (deep) cards with benefits and CTAs | Stacked | 002, 007 |
| 7 | Platform preview | Screenshots | Tabs (customers / providers / mobile), browser and phone frames, lightbox | Same, full-width tabs | 004, 026 |
| 8 | Launch + waitlist | Convert | Left: title, calendar tile, timeline. Right: sticky form card | Launch info then form | 006–011 |
| 9 | FAQ | Answer objections | Native `<details>` | Same | 006 |
| 10 | Final CTA | Second conversion point | Teal band, two buttons | Stacked buttons | 007 |
| 11 | Footer | Legal, languages | Logo, privacy, cookie settings, contact (when configured), language links | Same | 017 |

`/[locale]/privacy`: the draft privacy policy, with a notice shown until the controller details and contact email are configured.

## 6. Responsive behaviour

1440 / 1024: two-column hero and waitlist. 768: hero stacks, gallery two columns, places in a 3-column grid. 390 / 360: single column, place carousel, full-width CTAs and tabs, phone frames at 72–80 % width. Verified with no horizontal overflow at all five widths in `/en`, `/de`, `/fr/privacy`.

## 7. Motion storyboard

| Element | Trigger → effect | Timing | Reduced motion |
|---|---|---|---|
| Hero entry | load → rise (opacity + 14 px) | 0.7 s, staggered 80–320 ms | none |
| Composer demo | auto → typing 38 ms/char, highlight on completion, chips pop, crossfade photo + detail card | ≈5.5 s per scenario; holds while hovered/focused; stops after two rounds or after a manual place choice (no pause button, by client request) | Static full sentence + chips, no autoplay |
| Promo video | ≥50 % visible → play (sound when allowed); <50 % → pause, resume on return | — | No autoplay; click-to-play poster |
| Section reveals | IntersectionObserver → fade/translate 18 px | 0.8 s | Content always visible |
| How-it-works | active step → stage crossfade, rail fill | 0.5–0.7 s | Instant |
| Buttons/cards | hover/press → colour, 1 px press, lift | 0.2–0.5 s | Minimal |

No scroll-jacking. Motion never blocks forms or navigation.

## 8. Accessibility and performance rules

Skip link, landmarks, one H1, labelled fields with associated errors (`aria-invalid`, `aria-describedby`), focus moved to the first error and to the confirmation, keyboard support for tabs, menus and the lightbox (native `<dialog>`), visible focus ring (teal / mint on dark), and AA contrast tokens. Static prerendered pages, fonts self-hosted, images via `next/image` (AVIF/WebP), video loaded only on click.

## 9. Asset inventory

Available and used: logo/icon SVG, 9 platform screens (+3 crops), 11 photos, video, fonts, icons. Created: OG image (1200×630), favicons, white-text logo variant (recolour only), WebM video. Pending client: confirmation of the “Your photos” licence; approval that the screens are public-ready.
