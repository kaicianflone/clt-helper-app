# clt-app Design System

**Direction:** Queen City craft — Charlotte-specific aesthetic anchored in brick warehouses, the city's "Queen" / crown motif, and the warm urban materials of NoDa / Plaza Midwood / South End.

**Status:** v1 (locked during 2026-05-20 plan-design-review)

This document is the source of truth for visual decisions. When in doubt, follow these tokens. When something isn't covered here, prefer the option closest to "warm, intentional, urban-tactile" over the option closest to "generic, AI-defaults, SaaS."

---

## Voice & feel

- **Intentional but not precious.** This is a utility app first; the design serves the data, not the other way around.
- **Warm not cold.** Cream and brick, not white-and-gray. Charlotte feels lived-in, not corporate.
- **Confident type.** Display weights are loud; body weights are quiet. The hierarchy does the work.
- **Subtraction default.** If a decorative element doesn't earn its pixels, cut it. No floating blobs, no gradient backgrounds, no decorative icons.

---

## Typography

### Stacks

```css
--font-display:
  "Barlow Condensed", "Bebas Neue", sans-serif;
--font-body: "Source Serif 4", Georgia, serif;
--font-mono: "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace;
```

**Chosen for v1:**

- Display: **Barlow Condensed** (free, Google Fonts) — low-contrast grotesque inspired by public infrastructure signage. Matches the warehouse-district character of NoDa / South End / Camp North End. Slightly rounded terminals give warmth without softness.
  Premium upgrade path: Compressa Pro or Druk Wide.
- Body: **Source Serif 4** (free, Google Fonts) — Adobe's open-source serif, optimized for screen reading. Serif body text reads as "editorial field guide," not "SaaS product." Warm, readable, pairs with condensed grotesque display faces. Falls back to Georgia.
- Mono: **JetBrains Mono** (free) — used only for hex codes, slugs, and any data UI element.

**Implementation:**

- Web: Self-host Barlow Condensed + Source Serif 4 via `next/font` (no external CDN — works offline, no CLS).
- Mobile: Use `expo-font` to bundle Barlow Condensed and Source Serif 4. Apply via `useFonts()` in `_layout.tsx`.

### Type ramp

| Token        | Size (web) | Size (mobile) | Line height | Weight | Tracking         | Use                     |
| ------------ | ---------- | ------------- | ----------- | ------ | ---------------- | ----------------------- |
| `display-xl` | 64px       | 44px          | 1.0         | 700    | -0.02em          | Hero / homepage         |
| `display-lg` | 48px       | 32px          | 1.05        | 700    | -0.02em          | Detail page name        |
| `display-md` | 36px       | 26px          | 1.1         | 700    | -0.01em          | Section heading         |
| `heading-lg` | 22px       | 20px          | 1.2         | 600    | -0.005em         | Subsection              |
| `heading-md` | 18px       | 17px          | 1.3         | 600    | 0                | Card title              |
| `body-lg`    | 18px       | 17px          | 1.55        | 400    | 0                | Detail body copy        |
| `body-md`    | 16px       | 16px          | 1.55        | 400    | 0                | Default body            |
| `body-sm`    | 14px       | 14px          | 1.5         | 400    | 0                | Meta / supporting       |
| `body-xs`    | 12px       | 12px          | 1.4         | 500    | 0.02em uppercase | Labels / badges         |
| `mono-md`    | 14px       | 14px          | 1.5         | 400    | 0                | Data (rates, distances) |

Display tokens (`display-*`) use Barlow Condensed. Everything else uses Source Serif 4.

---

## Color tokens

```css
/* Surfaces */
--bg-cream: #f5efe6; /* default page background */
--bg-cream-soft: #faf6ef; /* card / elevated surface */
--bg-cream-deep: #ece4d5; /* hover / pressed states */

/* Foreground */
--fg-ink: #1b1614; /* primary text */
--fg-ink-soft: #4a413b; /* secondary text */
--fg-ink-muted: #6b6259; /* meta / placeholder */

/* Accents */
--brick: #b23a1f; /* primary CTA + brand */
--brick-deep: #8a2c16; /* hover / pressed brick */
--brick-soft: #e8d2c9; /* tinted background for brick context */

--gold: #b8902d; /* secondary accent (badges, highlights) */
--gold-soft: #f2e5c2; /* tinted background for gold context */

/* Functional */
--green-ok: #2f6e3a; /* lastVerified fresh */
--amber-warn: #b07810; /* lastVerified moderate */
--rose-stale: #a8332e; /* lastVerified stale */

/* Borders */
--border-soft: #d9cfc0; /* default border */
--border-strong: #1b1614; /* high-emphasis border */

/* Map */
--map-water: #c8d8dc;
--map-park: #c3d4b5;
--map-road: #e2d6c2;
--map-trail: #2f6e3a; /* greenway line color */
--map-parking: #b23a1f; /* parking marker */
--map-deal: #b8902d; /* deal-offering restaurant marker */
/* Map markers — new GIS entity kinds (added 2026-05-28, map-expansion).
   Distinct hues from each other and from --map-park (basemap fill).
   Markers pair with white glyphs at >=18px; all meet >=3:1 large-graphic contrast. */
--map-park-marker: #3a7a4f;     /* park pin — deeper than --map-park fill */
--map-recycling: #2e7d80;       /* teal — recycling / solid-waste facility */
--map-ev-charging: #2f5fa0;     /* electric blue — EV charging (NREL) */
--map-transit-parking: #5b4b9c; /* transit violet — light-rail park & ride */
--map-amenity: #9c6b3f;         /* clay-brown — generic POI (courts, disc golf, markets) */
```

**Contrast verification:**

- `--fg-ink` on `--bg-cream` = 14.2:1 ✓ (AAA for body)
- `--fg-ink-soft` on `--bg-cream` = 7.8:1 ✓ (AAA for body)
- `--fg-ink-muted` on `--bg-cream` = 5.3:1 ✓ (AA for body, fail AAA)
- White text on `--brick` = 5.4:1 ✓ (AA for body)
- White text on `--gold` = 3.3:1 ✗ (use `--fg-ink` instead for gold backgrounds)

---

## Spacing scale

8px grid. Use these tokens, not arbitrary px values.

```
--space-1: 4px    (hairline gap)
--space-2: 8px    (default inline gap)
--space-3: 12px   (small block gap)
--space-4: 16px   (default block gap)
--space-6: 24px   (between sections within a card)
--space-8: 32px   (between cards / list items)
--space-12: 48px  (between major page sections)
--space-16: 64px  (between page header and body)
```

Page horizontal padding: `--space-4` on mobile, `--space-8` on tablet, `--space-12` on desktop (with max-width 1024px on detail pages, 1280px on map pages).

---

## Border radius

Queen City craft prefers subtle radii — softer than brutalist, sharper than bubbly.

```
--radius-sm: 4px    (input fields, small buttons)
--radius-md: 8px    (cards, buttons, badges)
--radius-lg: 12px   (large cards, sheets, modals)
--radius-full: 9999px  (pills, day-tab indicators, avatars)
```

Avoid: any element with `border-radius` ≥ 16px except pills. The "bubbly" look is AI-slop.

---

## Elevation

Shadows are subtle, warm-toned, never decorative.

```css
--shadow-sm: 0 1px 2px rgba(27, 22, 20, 0.08);
--shadow-md: 0 2px 8px rgba(27, 22, 20, 0.06);
--shadow-lg: 0 8px 24px rgba(27, 22, 20, 0.08);
```

Use shadows only for: dropdown menus, bottom sheets, modals. Cards in a list DO NOT have shadows — they have borders. Shadows on every card is AI-slop.

---

## Motion

```css
--ease-default: cubic-bezier(0.32, 0.72, 0, 1); /* iOS-style ease-out */
--duration-fast: 120ms;
--duration-default: 200ms;
--duration-slow: 400ms;
```

Rules:

- Default for state changes (hover, focus, tap-feedback): 120-200ms.
- Page transitions: 200-300ms.
- Bottom sheet / modal open: 300-400ms ease-out.
- `prefers-reduced-motion: reduce` MUST disable all transitions (not shorten — disable).

Approved motion (from CEO addendum + design review):

- Skeleton loading shimmer (subtle, slow — 1.5s loop)
- Bottom sheet slide-up on map tap
- Day-tab indicator slide (180ms)
- Submit success: scale-up + fade checkmark (400ms total)

Forbidden:

- Hover-only interactions on touch targets (no `hover:bg-...` without focus equivalents)
- Parallax scrolling
- Confetti or particle effects (even for the contribution success — use a single scale-up checkmark instead)

---

## Iconography

- **Source:** Phosphor Icons (regular weight, free, large set) — preferred for the field-guide character.
- Default size: 20px on web, 22px on mobile.
- Default color: `--fg-ink-soft`.
- Touch target: minimum 44pt iOS / 48dp Android — wrap icons in larger padded containers when used as buttons.

Avoid: lucide-react (too thin/clinical for Queen City), Material Icons (too generic).

---

## Imagery

- **Photos:** Lean editorial. Black-and-white or warm-toned monochrome treatment is preferred over color photos for greenway hero images. (Color photos for individual POIs and deals are fine.)
- Aspect ratios: 3:2 for hero images, 1:1 for inline gallery thumbs, 16:9 only when matching original source (e.g. shared deal images).
- **No stock photos.** If we don't have a real photo of a place, don't show one. Empty state with a typographic treatment beats stock photo.
- **Illustrations:** None for v1. Adding mascot-style or vector illustrations later requires a separate consultation.

---

## Components

### Buttons

```
PRIMARY    background: --brick     | text: white         | hover: --brick-deep   | radius: md
SECONDARY  background: --bg-cream-deep | text: --fg-ink  | border: --border-soft | radius: md
GHOST      background: transparent | text: --fg-ink      | border: none          | radius: md
DESTRUCTIVE background: --rose-stale | text: white       | hover: darken 8%      | radius: md

Sizing:
  sm  (small filter button):     32px tall, 14px text, 12px padding-x
  md  (default):                 40px tall, 16px text, 16px padding-x
  lg  (primary CTA):             48px tall, 17px text, 24px padding-x

Touch targets: All buttons regardless of visual size must have a 44pt iOS / 48dp Android tappable area.
```

### Cards (list rows)

Default list row in lists is **borderless** — relies on horizontal rule dividers instead of card borders. This avoids the "AI-generated card grid" pattern.

```
LIST ROW:
  padding: --space-4 0
  border-bottom: 1px solid --border-soft
  no border-radius
  hover/press: background --bg-cream-soft

DETAIL CARD (when card IS the unit, e.g. trailheads on a detail page):
  padding: --space-4
  background: --bg-cream-soft
  border: 1px solid --border-soft
  border-radius: --radius-md
  no shadow
```

### Form inputs

```
INPUT:
  background: --bg-cream-soft
  border: 1px solid --border-soft (focused: 2px solid --brick)
  border-radius: --radius-sm
  padding: 12px 14px
  font: body-md
  label: visible above input (NOT placeholder-as-label)

DAY TAB / FILTER PILL:
  shape: radius-full
  inactive: bg --bg-cream-deep, text --fg-ink-soft
  active: bg --fg-ink, text --bg-cream
  size: sm
```

### Badges

```
LAST-VERIFIED-FRESH:  bg --green-ok at 12% opacity, text --green-ok, radius-full, body-xs
LAST-VERIFIED-MODERATE: bg --amber-warn at 12%, text --amber-warn, radius-full, body-xs
LAST-VERIFIED-STALE:    bg --rose-stale at 12%, text --rose-stale, radius-full, body-xs
GENERIC:                bg --bg-cream-deep, text --fg-ink-soft, radius-full, body-xs
```

### Bottom sheet (mobile)

- Slides up from bottom on map marker tap.
- Drag handle (4px × 36px pill) at top.
- Initial snap point: 40% of screen height.
- Drag to expand to 90% or dismiss.
- Background `--bg-cream-soft`, top corners `--radius-lg`.

---

## Per-screen information architecture

### Greenway list

```
HEADER: "Greenways" (display-md) + "{N} trails" (body-sm muted)
SUB:    "Near me ⇆ A-Z" toggle (right-aligned)

LIST: borderless rows separated by --border-soft dividers
  ROW:
    - heading-md trail name (left)
    - body-sm "{length} mi · {surface}" + distance if Near Me
    - body-xs lastVerified badge (right)
```

### Greenway detail

```
ABOVE FOLD (40-50vh):
  HERO: full-width photo (if exists) OR full-width vector preview of trail line on cream

  display-lg trail name (overlaid on photo with backdrop-blur, OR below it on cream)
  body-sm "{length} mi · {surface}" + lastVerified badge inline

BODY:
  body-lg description (~2 paragraphs max)

SECTIONS (each --space-12 apart, heading-lg labels):
  Trailheads → tappable cards, each opens native maps
  Points of Interest → collapsed list, expand on tap
  Photos → horizontal scroll on mobile, 3-up grid on desktop

STALE PROMPT (if lastVerified > 60d): full-width card with amber tint

CTAs (sticky bottom mobile, sidebar desktop):
  primary: "Get directions to nearest trailhead"
  secondary: "Share" (icon button)
  tertiary: "Suggest an edit" (ghost button)
```

### Deals

```
HEADER: "Deals · {DAY}" (display-md)
SUB: "{N} deals today" (body-sm muted)

DAY TABS: horizontal scrollable pill row, active = ink black

LIST: borderless rows
  ROW:
    - heading-md restaurant name
    - body-md deal description
    - body-sm time window · address (muted)
    - lastVerified badge (right)
    - Suggest edit button (ghost, small)
```

### Parking detail

```
HEADER: display-lg lot name + body-sm address

RATES PANEL: large mono-md text for rate, body-sm context
  "$4/hr" (display-md, mono)
  "$18/day max · Covered · Card / App" (body-sm)

HOURS GRID: 7-row mini table, Mon-Sun, formatted as "06:00–22:00" or "Closed" / "24h"

CTAs: same pattern as greenway detail (directions / share / suggest-edit)
```

### Map screen

```
DESKTOP (1024+):
  | LEFT SIDEBAR (320px) | MAP (fluid) | RIGHT DETAIL (380px, conditional) |
  Left: filter chips (Greenways / Parking / Deals) + list of visible items
  Right: appears when an item is selected; shows detail content

TABLET (768-1024):
  | MAP (fluid) | RIGHT DETAIL (40%, conditional) |
  Filter chips overlay on top of map

MOBILE (< 768):
  Full-bleed map
  Bottom sheet for selected item details (40% snap)
  Filter chips as overlay on top
```

### Suggest-edit form

```
HEADER: display-md "Suggest an edit"
SUB: body-md "Your edit will become a pull request. Be specific."

FORM:
  body-xs uppercase LABEL above each input
  Input: see component spec above
  Helper text: body-sm muted below input where needed

FOOTER:
  primary button: "Submit suggestion"
  on success: full-screen overlay with checkmark + "Your suggestion is in" + link to PR + dismiss
```

---

## State coverage

Every screen must specify visual treatment for these states. Default treatments:

- **Loading:** Skeleton screens matching final layout shape. Subtle shimmer animation (1.5s loop) using `--bg-cream-deep` → `--bg-cream-soft`. NEVER a spinner unless < 200ms expected.
- **Empty:** Centered illustration-free typographic empty state with a primary CTA (e.g. "Be the first to add one"). Uses --fg-ink-soft for body text.
- **Error:** Single sentence reason + retry button. No alert-style red banners; use --rose-stale at 12% opacity background.
- **Partial:** Show what loaded; indicate what's still loading inline (e.g. "Loading tiles..." subtle overlay on map).

---

## Responsive breakpoints (web)

```
--breakpoint-sm:  640px    (large phone in landscape)
--breakpoint-md:  768px    (tablet portrait)
--breakpoint-lg:  1024px   (tablet landscape / small desktop)
--breakpoint-xl:  1280px   (desktop)
```

Layout rules:

- **<768px:** single column. Sticky bottom CTAs. Sheet-style modals.
- **768-1024px:** two-column on detail pages (content left, contextual right rail). Map: map + bottom-anchored detail.
- **1024-1280px:** three-column on map. Two-column on detail with sticky-side metadata.
- **>1280px:** content max-width caps at 1280px for detail pages, 1440px for map.

Mobile is the priority — desktop scales up, not the reverse.

---

## Accessibility baseline

- All touch targets ≥ 44pt (iOS) / 48dp (Android) / 44px (web).
- All text ≥ 14px on web; ≥ 14px on mobile (respect Dynamic Type — never set absolute pixel font sizes on mobile, use scaled units).
- Contrast: WCAG AA minimum (4.5:1 body, 3:1 large text), verified in this doc above.
- Focus rings: 2px solid `--brick` with 2px offset on all interactive elements.
- ARIA: every form input has visible label + `for`/`id` link. Icon-only buttons have `aria-label`. Navigation has `<nav aria-label>`. Main content wrapped in `<main>`.
- Keyboard navigation: every interactive element reachable via Tab. Map markers reachable via arrow keys after focusing the map.
- `prefers-reduced-motion: reduce` disables all transitions.
- Screen reader: list rows use semantic `<ul><li><a>` markup; cards in detail pages use proper heading hierarchy.

---

## What's NOT in this DESIGN.md (recommended for /design-consultation later)

- Detailed motion specifications (entrance animations, micro-interactions beyond the four called out)
- Illustration style (currently: no illustrations in v1)
- Photo treatment specifications (filters, lighting, composition rules)
- Voice & tone guide for body copy
- Email / push notification design (out of scope for v1)
- Logo / wordmark direction (current: text-only "clt-app" in Antonio Bold for v1)
- Dark mode (deferred — Queen City craft is daylight-first; dark mode in v2)

These can be added by running `/design-consultation` after v1 ships.
