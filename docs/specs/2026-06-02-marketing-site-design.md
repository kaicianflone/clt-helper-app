# Marketing site — design spec

**Date:** 2026-06-02
**Status:** Approved for planning
**Owner:** Kai Cianflone

## Summary

Build a single-page marketing landing for clt-app — the front door for people who
haven't used the app yet. It explains the three domains (greenways, daily deals,
parking) and the community-maintained-data story, and converts visitors to either the
web app (works today) or a mobile download (coming soon).

The visual direction combines the existing **Queen City craft** design system
(`DESIGN.md`) with the calm, generous-whitespace, scannable feel of
[gbrain.io](https://gbrain.io). It does **not** introduce a new design language — it
applies the established cream/brick palette, Barlow Condensed display, and Source Serif
4 body to a marketing context.

## Goals

- Give clt-app a real front door that sells the product in one scroll.
- Equal-weight dual CTA: **open the web app** (live) and **download mobile** (coming soon).
- Feel distinctly "Charlotte craft," not generic SaaS, and free of AI-slop tells in copy.
- Preserve the existing app — the migration moves the current home, it does not rewrite it.

## Non-goals (v1)

- Email / "notify me" capture for the mobile launch list (badges are a static "Soon" state).
- Multiple marketing pages — this is one scrolling page. `/privacy` stays as-is.
- Mobile-app store deep links (app is unpublished; badges are non-functional placeholders).
- Dark mode (deferred per `DESIGN.md` — daylight-first).
- New illustrations/mascot (`DESIGN.md` forbids in v1; whimsy comes from glyphs, not art).

## Routing & placement

The current `/` (`apps/nextjs/src/app/page.tsx`) is the working **"Today in Charlotte"**
app home. Decision: **`/` becomes the marketing landing; the app home moves to `/today`.**

Migration touchpoints (the plan must handle each):

| Touchpoint | Change |
| --- | --- |
| `app/page.tsx` | Becomes the new marketing landing. |
| New `app/today/page.tsx` | Receives the current "Today in Charlotte" content verbatim (activity feed + nav grid + `OnboardingRedirect`). |
| `OnboardingRedirect` | Moves with the app home to `/today` (it is the post-onboarding destination, not the marketing page). |
| `app/onboarding/*` | Its "done/continue" target changes from `/` to `/today`. |
| `components/SiteHeader` / `BottomTabBar` | Any "home" link pointing at `/` repoints to `/today`. |
| `components/SiteChrome` | The marketing `/` is exempted from the app chrome (like `/map` already is) — it renders its own marketing header + footer. |
| `app/sitemap.ts` | Add `/today`; keep `/` at priority 1 (now the marketing page). |
| Metadata | `/` gets marketing metadata + OG image; `/today` inherits the old "Today in Charlotte" metadata. |

Internal links elsewhere that assume `/` is the app home must be swept and repointed to `/today`.

## Page structure (single scroll)

1. **Marketing header** — `clt-app` wordmark (Barlow Condensed) · section anchor links
   (Greenways / Deals / Parking / Map) · a brick "Open app ▸" link. Minimal, gbrain-style.
2. **Hero** (centered, big type) — gold `✦ ✦ ✦` glyph divider; oversized stacked headline
   **"YOUR CITY, WORTH WALKING ♛"** (brick crown accent); Source Serif subhead; brick
   "Open the web app" CTA; `⟡ Coming soon on iOS and Android` label. A greenway-green SVG
   line draws itself beneath the hero.
3. **Three domains** — label "What's inside" + heading "EVERYTHING LOCAL, ON ONE MAP", then
   three columns. Each = domain name in its map-marker color, a one-line blurb, and a
   3-item scannable list (gbrain capability-list pattern):
   - **Greenways** (green `#2f6e3a`): "63 trails, mapped and verified." → Length, surface, and trailheads · Points of interest along the way · Directions to the nearest entrance
   - **Deals** (gold `#b8902d`): "Restaurant specials, by the day." → Browse whatever's on today · Times, addresses, the fine print · Checked often so it isn't stale
   - **Parking** (brick `#b23a1f`): "Where to park, and what it runs." → Hourly rates and daily max · Hours, covered or not, how to pay · Lots across the city
4. **Community story** — label "Why it stays accurate" + heading "CHARLOTTE KEEPS IT HONEST",
   body explaining suggest-an-edit → open data. This is the differentiator.
5. **Coming-soon footer** — heading "TAKE CHARLOTTE WITH YOU", official store badges (see
   below) with "Soon" tags, secondary "Or open the web app ▸", sign-off
   "clt-app · open source · made in the Queen City ♛".

Sections are separated by centered gold glyph dividers (`⟡ ⟡ ⟡` / `✦ ✦ ✦`) — the gbrain
whimsy, rendered in the Queen City palette.

## Copy

Approved draft below. Copy is deliberately loose and human — varied sentence lengths, no
staccato triads, sparing em-dashes, no "the part that makes it work"-style filler.

- **Hero subhead:** "Find a greenway, grab today's restaurant deals, or track down parking.
  It's free, there's no sign-up, and the people who use it keep the details honest."
- **Community body:** "Notice a rate that's gone up or a trail that's closed? Suggest a fix
  right from the app. Your edit goes into our open data, so the next person sees the
  correction too."

Final copy gets one more human read-through before ship; the structure and voice are locked.

## Store badges

Use the **official badge assets** from Apple and Google — not redrawn approximations:

- Apple: the official "Download on the App Store" badge, per
  [Apple marketing guidelines](https://developer.apple.com/app-store/marketing/guidelines/).
- Google: the official "Get it on Google Play" badge, per
  [Google Play badge guidelines](https://play.google.com/intl/en_us/badges/).

Store the official SVG/PNG assets in `apps/nextjs/public/` (e.g. `public/badges/`). Until
the app is published, render each badge in a **disabled "Soon" state**: the real badge
artwork at slightly reduced opacity, a small gold "Soon" pill in the corner, `aria-disabled`,
and no link target. When the app ships, the plan to make them live is: drop opacity/Soon
tag and add the store URLs — no redesign.

## Visual system (reuse, do not reinvent)

All tokens come from `DESIGN.md`:

- **Palette:** `--bg-cream` page, `--bg-cream-soft` footer, `--brick` primary CTA/accent,
  `--gold` glyph dividers + accents, domain colors from the map markers (green/gold/brick).
- **Type:** Barlow Condensed (`fontDisplay`) for headings/wordmark/labels; Source Serif 4
  (`fontSans` in this repo's font module) for body. Already self-hosted via `next/font`
  (`~/styles/fonts`) — no new font loading.
- **Spacing/radius/elevation:** existing 8px grid + radius tokens. Cards stay borderless or
  border-based per `DESIGN.md` (no AI-slop shadow grids).

## Motion

A restrained pass, consistent with `DESIGN.md` motion rules (`--ease-default`, durations
120–400ms, reduced-motion disables everything; no parallax, confetti, or particles).

- Hero content rises + fades in on load with a small stagger.
- The `✦` glyph row drifts gently (slow infinite float).
- A greenway-green SVG line draws itself under the hero once (stroke-dashoffset).
- Section blocks reveal (fade + 20px rise) when scrolled into view.
- Brick CTA lifts 2px on hover.

**Tech:** plain CSS keyframes/transitions + a small **IntersectionObserver** for scroll
reveals. No animation dependency. (Framer Motion is a possible future upgrade for richer
staggering but is out of scope.) `html-in-canvas` / WebGL is explicitly rejected — perf cost
and accessibility/slop risk outweigh the benefit for a content page. A
`prefers-reduced-motion: reduce` media query forces all reveals visible and disables every
animation/transition.

## Component breakdown (Next.js)

New components under `apps/nextjs/src/app/_components/marketing/` (or `~/components/marketing/`):

- `MarketingHeader` — minimal nav, anchor links, "Open app" link.
- `Hero` — headline, subhead, CTA, coming-soon label, animated trail SVG.
- `DomainColumns` — the three-domain scannable section (data-driven by a local array).
- `CommunityStory` — the "Charlotte keeps it honest" block.
- `DownloadFooter` — store badges (with Soon state) + secondary web CTA + sign-off.
- `Reveal` — small client component wrapping children with the IntersectionObserver
  fade-up behavior (reduced-motion aware). Used to keep the page a server component where
  possible, with reveal as an island.

The landing page itself stays a Server Component; only `Reveal` (and any interactive nav)
are client islands.

## States & responsiveness

- **Responsive:** three-domain columns stack to a single column < 768px; hero type scales
  down per the `DESIGN.md` ramp (`display-xl` 64→44px). Mobile-first.
- **No data dependency:** the landing is static marketing content — no tRPC calls, no
  loading/empty/error states to design. (Contrast with `/today`, which keeps its activity feed.)
- **Accessibility:** semantic landmarks (`<header>`, `<main>`, `<footer>`, `<nav aria-label>`),
  visible focus rings (2px brick), badges `aria-disabled` in Soon state, all motion gated.

## Testing

- Unit/render test that the landing renders all five sections and the dual CTA.
- Test that `/today` renders the migrated activity feed and `OnboardingRedirect` fires there.
- Test (or lint check) that no internal link still points to `/` as the app home.
- Reduced-motion: assert reveal elements are visible without JS / under reduced-motion.
- Existing `SiteChrome.test.ts` updated so `/` is treated as a chrome-exempt marketing route.

## Open risks

- **Link sweep completeness** — missing an internal `/`→app link would send users to the
  marketing page instead of the app. The plan should grep exhaustively.
- **Onboarding flow** — verify the onboarding redirect chain still terminates at a working
  app screen (`/today`), not a loop back to marketing.
- **SEO** — `/` changing meaning is fine (still priority 1), but the old "Today in Charlotte"
  content now lives at `/today`; ensure metadata moves with it.
