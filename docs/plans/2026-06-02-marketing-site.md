# Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page marketing landing at `/` for clt-app, and move the current "Today in Charlotte" app home to `/today`.

**Architecture:** The landing is a Next.js Server Component composed of focused section components, styled entirely from the existing Queen City craft tokens (`~/styles/tokens.css`) with a small `marketing.css` for motion. A `Reveal` client island handles scroll-in animations via IntersectionObserver, gated behind `prefers-reduced-motion`. The existing app home and its internal links are migrated to `/today`; `SiteChrome` exempts `/` so the marketing page renders its own header/footer.

**Tech Stack:** Next.js 15 App Router, React Server Components, Tailwind (via CSS vars), Vitest (node environment — tests are source-content assertions and pure-module imports, **not** React renders).

---

## Spec

Source spec: `docs/specs/2026-06-02-marketing-site-design.md`. Read it before starting.

## Conventions for this codebase

- **Tests run in `environment: "node"`** (see `vitest.config.ts`) — there is **no jsdom/RTL**. Do not write React render tests. Test components by reading their source with `readFileSync` and asserting substrings (see `apps/nextjs/src/components/SiteChrome.test.ts` for the established pattern), and test pure data modules by importing them.
- Headings use the `font-display` Tailwind class (Barlow Condensed); body is default `font-sans` (Source Serif 4). Colors come from CSS vars like `text-[color:var(--brick)]`.
- Commit after every task with the message shown in the task's final step.

## File Structure

**Migration (move app home → `/today`):**
- Create: `apps/nextjs/src/app/today/page.tsx` — the current app home content.
- Create: `apps/nextjs/src/app/today/page.test.ts` — source assertion.
- Modify: `apps/nextjs/src/components/SiteHeader.tsx:23` — wordmark home link `/` → `/today`.
- Modify: `apps/nextjs/src/components/BottomTabBar.tsx:87` — Home link `/` → `/today`.
- Modify: `apps/nextjs/src/components/BottomTabBar.test.ts:26` — assertion `href="/"` → `href="/today"`.
- Modify: `apps/nextjs/src/app/map/page.tsx:116` — home crown link `/` → `/today`.
- Modify: `apps/nextjs/src/app/onboarding/page.tsx:33,52` — `router.replace("/")` → `router.replace("/today")`.
- Modify: `apps/nextjs/src/components/SiteChrome.tsx` — exempt `/` from app chrome.
- Modify: `apps/nextjs/src/components/SiteChrome.test.ts` — assert the `/` branch.
- Modify: `apps/nextjs/src/app/sitemap.ts` — add `/today`.

**Marketing landing (new, under `apps/nextjs/src/components/marketing/`):**
- `marketing-content.ts` — pure data: nav, domains, copy. + `marketing-content.test.ts`.
- `MarketingHeader.tsx`, `Hero.tsx`, `DomainColumns.tsx`, `CommunityStory.tsx`, `DownloadFooter.tsx`, `StoreBadge.tsx`, `GlyphDivider.tsx` — section components (Server Components, except none need "use client").
- `Reveal.tsx` — client island for scroll reveals.
- Create: `apps/nextjs/src/styles/marketing.css` — keyframes + reveal classes + reduced-motion.
- Create: `apps/nextjs/public/badges/app-store.svg`, `apps/nextjs/public/badges/google-play.png` — official store badges.
- Replace: `apps/nextjs/src/app/page.tsx` — the marketing landing.
- Modify: `apps/nextjs/src/app/page.test.ts` (new) — source assertions for the landing.

---

## Task 1: Move the app home to `/today`

**Files:**
- Create: `apps/nextjs/src/app/today/page.tsx`
- Test: `apps/nextjs/src/app/today/page.test.ts`

- [ ] **Step 1: Create `/today` with the current home content**

Copy the **entire current contents** of `apps/nextjs/src/app/page.tsx` into the new file, changing only the `OnboardingRedirect` import path (it is now one directory deeper) and the metadata title. Full file:

```tsx
import type { Metadata } from "next";
import Link from "next/link";

import { createServerCaller } from "~/trpc/server";
import { OnboardingRedirect } from "../_components/onboarding-redirect";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Today in Charlotte",
  description:
    "Charlotte's greenways, local deals, and parking — community-maintained.",
};

const KIND_LABEL: Record<string, string> = {
  greenway: "Greenway",
  deal: "Deal",
  parking: "Parking",
};

const kindHref = (kind: string, slug: string): string => {
  if (kind === "greenway") return `/greenways/${slug}`;
  if (kind === "deal") return `/deals/${slug}`;
  return `/parking/${slug}`;
};

function timeAgo(dateStr: string, now: number): string {
  const days = Math.floor((now - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

export default async function TodayPage() {
  const date = new Date();
  const dayShort = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const caller = await createServerCaller();
  const recent = await caller.activity.recent();
  // eslint-disable-next-line react-hooks/purity -- server component; Date.now() is stable during RSC render
  const now = Date.now();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <OnboardingRedirect />
      <h1 className="font-display text-5xl leading-none font-bold tracking-tight text-[color:var(--fg-ink)]">
        Today in Charlotte
      </h1>
      <p className="mt-1 text-sm text-[color:var(--fg-ink-muted)]">
        {dayShort}
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-[color:var(--fg-ink)]">
          Recently updated
        </h2>

        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-[color:var(--fg-ink-muted)]">
            Nothing listed yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[color:var(--border-soft)]">
            {recent.map((item) => (
              <li key={`${item.kind}-${item.slug}`} className="py-3">
                <Link
                  href={kindHref(item.kind, item.slug)}
                  className="group flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-[color:var(--fg-ink)] group-hover:text-[color:var(--brick)]">
                      {item.label}
                    </span>
                    <span className="ml-2 inline-block rounded-full bg-[color:var(--bg-cream-soft)] px-2 py-0.5 text-xs font-medium text-[color:var(--fg-ink-muted)]">
                      {KIND_LABEL[item.kind] ?? item.kind}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-[color:var(--fg-ink-soft)]">
                    {timeAgo(item.lastVerified, now)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="mt-12 grid grid-cols-3 gap-3">
        <Link
          href="/greenways"
          className="rounded-md border border-[color:var(--border-soft)] p-4 text-center text-sm font-medium text-[color:var(--fg-ink)] hover:bg-[color:var(--bg-cream-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
        >
          Greenways
        </Link>
        <Link
          href="/deals"
          className="rounded-md border border-[color:var(--border-soft)] p-4 text-center text-sm font-medium text-[color:var(--fg-ink)] hover:bg-[color:var(--bg-cream-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
        >
          Deals
        </Link>
        <Link
          href="/map"
          className="rounded-md border border-[color:var(--border-soft)] p-4 text-center text-sm font-medium text-[color:var(--fg-ink)] hover:bg-[color:var(--bg-cream-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
        >
          Map
        </Link>
      </nav>
    </main>
  );
}
```

- [ ] **Step 2: Write the test**

```ts
// apps/nextjs/src/app/today/page.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "page.tsx"), "utf-8");

describe("/today (app home)", () => {
  it("renders the recently-updated activity feed", () => {
    expect(src).toContain("Recently updated");
    expect(src).toContain("activity.recent()");
  });

  it("fires the first-visit onboarding redirect", () => {
    expect(src).toContain("OnboardingRedirect");
  });
});
```

- [ ] **Step 3: Run the test**

Run: `pnpm vitest run apps/nextjs/src/app/today/page.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 4: Commit**

```bash
git add apps/nextjs/src/app/today/page.tsx apps/nextjs/src/app/today/page.test.ts
git commit -m "feat(web): add /today app home (migration step 1)"
```

---

## Task 2: Repoint internal home links to `/today`

**Files:**
- Modify: `apps/nextjs/src/components/SiteHeader.tsx`
- Modify: `apps/nextjs/src/components/BottomTabBar.tsx`
- Modify: `apps/nextjs/src/components/BottomTabBar.test.ts`
- Modify: `apps/nextjs/src/app/map/page.tsx`

- [ ] **Step 1: SiteHeader wordmark → `/today`**

In `SiteHeader.tsx`, change the wordmark link target:

```tsx
// before:  <Link href="/" ... aria-label="clt — home">
// after:
      <Link
        href="/today"
        className="font-display flex items-center gap-1.5 text-2xl font-bold tracking-wider text-[color:var(--brick)] uppercase hover:opacity-80"
        aria-label="clt — home"
      >
```

- [ ] **Step 2: BottomTabBar Home → `/today`**

In `BottomTabBar.tsx`, change the Home link:

```tsx
// before:  <Link href="/" aria-label="Home" ...>
// after:
      <Link
        href="/today"
        aria-label="Home"
        className="flex w-12 items-center justify-center text-[color:var(--fg-ink-muted)]"
      >
```

- [ ] **Step 3: Update BottomTabBar test assertion**

In `BottomTabBar.test.ts` (around line 26), change the home-link assertion:

```ts
// before: expect(src).toContain('href="/"');
// after:
    expect(src).toContain('href="/today"');
```

- [ ] **Step 4: Map home crown link → `/today`**

In `apps/nextjs/src/app/map/page.tsx` (~line 116), change the fixed home link:

```tsx
// before:  <Link href="/" aria-label="CLT — home" ...>
// after:
      <Link
        href="/today"
        aria-label="CLT — home"
        className="font-display fixed top-4 left-4 z-50 flex items-center gap-1.5 rounded-full bg-[color:var(--bg-cream)] px-3 py-1.5 text-sm font-bold tracking-wider text-[color:var(--brick)] uppercase shadow-md hover:bg-[color:var(--bg-cream-deep)]"
      >
```

- [ ] **Step 5: Run the affected tests**

Run: `pnpm vitest run apps/nextjs/src/components/BottomTabBar.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/nextjs/src/components/SiteHeader.tsx apps/nextjs/src/components/BottomTabBar.tsx apps/nextjs/src/components/BottomTabBar.test.ts apps/nextjs/src/app/map/page.tsx
git commit -m "refactor(web): repoint app home links to /today"
```

---

## Task 3: Update onboarding redirects to `/today`

**Files:**
- Modify: `apps/nextjs/src/app/onboarding/page.tsx`

- [ ] **Step 1: Change both redirect targets**

There are two `router.replace("/")` calls (in `finish()` ~line 33 and the already-seen `useEffect` ~line 52). Change **both** to `/today`:

```tsx
// in finish():
    router.replace("/today");
// in the useEffect that redirects already-onboarded users:
      router.replace("/today");
```

- [ ] **Step 2: Add a guard test**

```ts
// apps/nextjs/src/app/onboarding/page.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "page.tsx"), "utf-8");

describe("onboarding redirects", () => {
  it("sends finished/returning users to the app home at /today", () => {
    expect(src).toContain('router.replace("/today")');
    expect(src).not.toContain('router.replace("/")');
  });
});
```

- [ ] **Step 3: Run the test**

Run: `pnpm vitest run apps/nextjs/src/app/onboarding/page.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/nextjs/src/app/onboarding/page.tsx apps/nextjs/src/app/onboarding/page.test.ts
git commit -m "fix(web): onboarding redirects to /today after move"
```

---

## Task 4: Exempt `/` from app chrome in SiteChrome

**Files:**
- Modify: `apps/nextjs/src/components/SiteChrome.tsx`
- Modify: `apps/nextjs/src/components/SiteChrome.test.ts`

- [ ] **Step 1: Add the `/` branch**

In `SiteChrome.tsx`, add a branch directly **after** the existing `if (pathname === "/map")` block and before the default `return`:

```tsx
  // The marketing landing at "/" renders its own header, <main>, and footer.
  // It opts out of the app chrome entirely (no SiteHeader, no BottomTabBar).
  if (pathname === "/") {
    return <>{props.children}</>;
  }
```

- [ ] **Step 2: Extend the test**

Append to `SiteChrome.test.ts`:

```ts
describe("SiteChrome / marketing route", () => {
  const homeStart = src.indexOf('pathname === "/"');
  const homeBranch = src.slice(homeStart, src.indexOf("}", homeStart));

  it("special-cases the marketing landing at /", () => {
    expect(homeStart).toBeGreaterThan(-1);
  });

  it("renders no app chrome on / (marketing provides its own)", () => {
    expect(homeBranch).not.toContain("SiteHeader");
    expect(homeBranch).not.toContain("BottomTabBar");
  });
});
```

- [ ] **Step 3: Run the test**

Run: `pnpm vitest run apps/nextjs/src/components/SiteChrome.test.ts`
Expected: PASS (all describe blocks).

- [ ] **Step 4: Commit**

```bash
git add apps/nextjs/src/components/SiteChrome.tsx apps/nextjs/src/components/SiteChrome.test.ts
git commit -m "feat(web): exempt marketing / from app chrome"
```

---

## Task 5: Add `/today` to the sitemap

**Files:**
- Modify: `apps/nextjs/src/app/sitemap.ts`

- [ ] **Step 1: Add the route**

Add a `/today` entry to the returned array (keep `/` at priority 1 — it is now the marketing page):

```ts
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/today`, priority: 0.9 },
    { url: `${base}/greenways`, priority: 0.9 },
    { url: `${base}/deals`, priority: 0.9 },
    { url: `${base}/parking`, priority: 0.9 },
    { url: `${base}/map`, priority: 0.8 },
    ...greenways.map((g) => ({
      url: `${base}/greenways/${g.slug}`,
      priority: 0.7,
    })),
    ...parking.map((p) => ({
      url: `${base}/parking/${p.slug}`,
      priority: 0.6,
    })),
  ];
```

- [ ] **Step 2: Commit**

```bash
git add apps/nextjs/src/app/sitemap.ts
git commit -m "chore(web): add /today to sitemap"
```

---

## Task 6: Marketing content data module

**Files:**
- Create: `apps/nextjs/src/components/marketing/marketing-content.ts`
- Test: `apps/nextjs/src/components/marketing/marketing-content.test.ts`

- [ ] **Step 1: Write the data module**

```ts
// apps/nextjs/src/components/marketing/marketing-content.ts

export interface MarketingNavLink {
  label: string;
  href: string;
}

export const MARKETING_NAV: MarketingNavLink[] = [
  { label: "Greenways", href: "/greenways" },
  { label: "Deals", href: "/deals" },
  { label: "Parking", href: "/parking" },
  { label: "Map", href: "/map" },
];

export interface MarketingDomain {
  name: string;
  /** CSS custom property tying the domain to its map-marker color. */
  colorVar: string;
  blurb: string;
  items: [string, string, string];
}

export const MARKETING_DOMAINS: MarketingDomain[] = [
  {
    name: "Greenways",
    colorVar: "--map-trail",
    blurb: "63 trails, mapped and verified.",
    items: [
      "Length, surface, and trailheads",
      "Points of interest along the way",
      "Directions to the nearest entrance",
    ],
  },
  {
    name: "Deals",
    colorVar: "--gold",
    blurb: "Restaurant specials, by the day.",
    items: [
      "Browse whatever's on today",
      "Times, addresses, the fine print",
      "Checked often so it isn't stale",
    ],
  },
  {
    name: "Parking",
    colorVar: "--brick",
    blurb: "Where to park, and what it runs.",
    items: [
      "Hourly rates and daily max",
      "Hours, covered or not, how to pay",
      "Lots across the city",
    ],
  },
];

export const MARKETING_COPY = {
  heroTitle: ["Your city,", "worth", "walking."],
  heroSubhead:
    "Find a greenway, grab today's restaurant deals, or track down parking. It's free, there's no sign-up, and the people who use it keep the details honest.",
  comingSoon: "Coming soon on iOS and Android",
  domainsLabel: "What's inside",
  domainsHeading: ["Everything local,", "on one map"],
  communityLabel: "Why it stays accurate",
  communityHeading: ["Charlotte keeps", "it honest"],
  communityBody:
    "Notice a rate that's gone up or a trail that's closed? Suggest a fix right from the app. Your edit goes into our open data, so the next person sees the correction too.",
  footerHeading: ["Take Charlotte", "with you"],
  signoff: "clt-app · open source · made in the Queen City",
} as const;
```

- [ ] **Step 2: Write the test**

```ts
// apps/nextjs/src/components/marketing/marketing-content.test.ts
import { describe, expect, it } from "vitest";

import {
  MARKETING_COPY,
  MARKETING_DOMAINS,
  MARKETING_NAV,
} from "./marketing-content";

describe("marketing content", () => {
  it("defines exactly three domains, each with three items", () => {
    expect(MARKETING_DOMAINS).toHaveLength(3);
    for (const d of MARKETING_DOMAINS) {
      expect(d.items).toHaveLength(3);
      expect(d.name.length).toBeGreaterThan(0);
    }
  });

  it("ties each domain to a distinct map color var", () => {
    const colors = MARKETING_DOMAINS.map((d) => d.colorVar);
    expect(new Set(colors).size).toBe(colors.length);
    for (const c of colors) expect(c.startsWith("--")).toBe(true);
  });

  it("points nav at the real app routes", () => {
    expect(MARKETING_NAV.map((n) => n.href)).toEqual([
      "/greenways",
      "/deals",
      "/parking",
      "/map",
    ]);
  });

  it("keeps hero copy free of staccato 'No X. No Y.' triads", () => {
    expect(MARKETING_COPY.heroSubhead).not.toMatch(/No\s+\w+\.\s+No\s+\w+\./i);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `pnpm vitest run apps/nextjs/src/components/marketing/marketing-content.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 4: Commit**

```bash
git add apps/nextjs/src/components/marketing/marketing-content.ts apps/nextjs/src/components/marketing/marketing-content.test.ts
git commit -m "feat(web): marketing content data module"
```

---

## Task 7: Marketing motion CSS

**Files:**
- Create: `apps/nextjs/src/styles/marketing.css`

- [ ] **Step 1: Write the stylesheet**

```css
/* apps/nextjs/src/styles/marketing.css
   Motion for the marketing landing. Durations/easing match DESIGN.md.
   All animation is disabled under prefers-reduced-motion. */

@keyframes mkt-rise {
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes mkt-draw {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes mkt-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.mkt-rise {
  opacity: 0;
  transform: translateY(18px);
  animation: mkt-rise 0.7s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}
.mkt-rise-d1 {
  animation-delay: 0.05s;
}
.mkt-rise-d2 {
  animation-delay: 0.15s;
}
.mkt-rise-d3 {
  animation-delay: 0.28s;
}
.mkt-rise-d4 {
  animation-delay: 0.4s;
}
.mkt-float {
  animation: mkt-float 5s ease-in-out infinite;
}

.mkt-trail path {
  stroke-dasharray: 1200;
  stroke-dashoffset: 1200;
  animation: mkt-draw 2.4s cubic-bezier(0.32, 0.72, 0, 1) 0.3s forwards;
}

.mkt-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.6s cubic-bezier(0.32, 0.72, 0, 1),
    transform 0.6s cubic-bezier(0.32, 0.72, 0, 1);
}
.mkt-reveal-in {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .mkt-rise,
  .mkt-reveal {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
    transition: none !important;
  }
  .mkt-float {
    animation: none !important;
  }
  .mkt-trail path {
    stroke-dashoffset: 0 !important;
    animation: none !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/nextjs/src/styles/marketing.css
git commit -m "feat(web): marketing motion stylesheet"
```

---

## Task 8: Reveal client island

**Files:**
- Create: `apps/nextjs/src/components/marketing/Reveal.tsx`
- Test: `apps/nextjs/src/components/marketing/Reveal.test.ts`

- [ ] **Step 1: Write the component**

```tsx
// apps/nextjs/src/components/marketing/Reveal.tsx
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wraps content in a scroll-triggered fade-up. Under prefers-reduced-motion
 * the content is shown immediately and never animates.
 */
export function Reveal(props: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={["mkt-reveal", shown ? "mkt-reveal-in" : "", props.className ?? ""]
        .join(" ")
        .trim()}
    >
      {props.children}
    </div>
  );
}
```

- [ ] **Step 2: Write the test**

```ts
// apps/nextjs/src/components/marketing/Reveal.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "Reveal.tsx"), "utf-8");

describe("Reveal", () => {
  it("uses IntersectionObserver for scroll reveals", () => {
    expect(src).toContain("IntersectionObserver");
  });

  it("respects prefers-reduced-motion by showing immediately", () => {
    expect(src).toContain("prefers-reduced-motion: reduce");
    expect(src).toContain("setShown(true)");
  });
});
```

- [ ] **Step 3: Run the test**

Run: `pnpm vitest run apps/nextjs/src/components/marketing/Reveal.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 4: Commit**

```bash
git add apps/nextjs/src/components/marketing/Reveal.tsx apps/nextjs/src/components/marketing/Reveal.test.ts
git commit -m "feat(web): Reveal scroll-in island"
```

---

## Task 9: Official store badges + StoreBadge component

**Files:**
- Create: `apps/nextjs/public/badges/app-store.svg`
- Create: `apps/nextjs/public/badges/google-play.png`
- Create: `apps/nextjs/src/components/marketing/StoreBadge.tsx`
- Test: `apps/nextjs/src/components/marketing/StoreBadge.test.ts`

- [ ] **Step 1: Download the official badge assets**

```bash
mkdir -p apps/nextjs/public/badges
curl -fSL "https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" -o apps/nextjs/public/badges/app-store.svg
curl -fSL "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" -o apps/nextjs/public/badges/google-play.png
```

If either URL fails (Apple/Google occasionally move these), download manually from the official brand pages and save to the same paths:
- Apple: https://developer.apple.com/app-store/marketing/guidelines/ → "Download on the App Store" (black) lockup.
- Google: https://play.google.com/intl/en_us/badges/ → "Get it on Google Play" badge.

Verify both files are non-empty:

```bash
ls -l apps/nextjs/public/badges/
```

- [ ] **Step 2: Write the StoreBadge component**

```tsx
// apps/nextjs/src/components/marketing/StoreBadge.tsx
import { CrownIcon } from "~/components/CrownIcon";

interface StoreBadgeProps {
  store: "app-store" | "google-play";
}

const BADGES = {
  "app-store": {
    src: "/badges/app-store.svg",
    alt: "Download on the App Store",
    width: 140,
    height: 47,
  },
  "google-play": {
    src: "/badges/google-play.png",
    alt: "Get it on Google Play",
    width: 156,
    height: 47,
  },
} as const;

/**
 * Renders an official store badge in a disabled "Soon" state — the app is not
 * published yet, so the badge is dimmed, tagged, aria-disabled, and unlinked.
 * To go live: remove the opacity + Soon tag and wrap the <img> in a store link.
 */
export function StoreBadge(props: StoreBadgeProps) {
  const b = BADGES[props.store];
  return (
    <span
      className="relative inline-block align-middle"
      aria-disabled="true"
      title="Coming soon"
    >
      <span className="absolute -top-2 -right-2 z-10 flex items-center gap-0.5 rounded-full bg-[color:var(--gold)] px-1.5 py-0.5 font-display text-[10px] font-bold tracking-wide text-[color:var(--fg-ink)] uppercase">
        <CrownIcon size={9} color="var(--fg-ink)" />
        Soon
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- official brand badge served from /public; must not be re-optimized */}
      <img
        src={b.src}
        alt={b.alt}
        width={b.width}
        height={b.height}
        className="opacity-60"
      />
    </span>
  );
}
```

- [ ] **Step 3: Write the test**

```ts
// apps/nextjs/src/components/marketing/StoreBadge.test.ts
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../../public/badges");

describe("StoreBadge assets", () => {
  it("ships the official App Store badge", () => {
    expect(existsSync(resolve(root, "app-store.svg"))).toBe(true);
  });

  it("ships the official Google Play badge", () => {
    expect(existsSync(resolve(root, "google-play.png"))).toBe(true);
  });
});
```

- [ ] **Step 4: Run the test**

Run: `pnpm vitest run apps/nextjs/src/components/marketing/StoreBadge.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/nextjs/public/badges apps/nextjs/src/components/marketing/StoreBadge.tsx apps/nextjs/src/components/marketing/StoreBadge.test.ts
git commit -m "feat(web): official store badges in coming-soon state"
```

---

## Task 10: Section components (header, hero, domains, community, footer, divider)

**Files:**
- Create: `apps/nextjs/src/components/marketing/GlyphDivider.tsx`
- Create: `apps/nextjs/src/components/marketing/MarketingHeader.tsx`
- Create: `apps/nextjs/src/components/marketing/Hero.tsx`
- Create: `apps/nextjs/src/components/marketing/DomainColumns.tsx`
- Create: `apps/nextjs/src/components/marketing/CommunityStory.tsx`
- Create: `apps/nextjs/src/components/marketing/DownloadFooter.tsx`

- [ ] **Step 1: GlyphDivider**

```tsx
// apps/nextjs/src/components/marketing/GlyphDivider.tsx
export function GlyphDivider(props: { glyph?: string }) {
  const g = props.glyph ?? "⟡";
  return (
    <p
      aria-hidden="true"
      className="py-9 text-center text-[color:var(--gold)] tracking-[0.5em]"
    >
      {`${g}  ${g}  ${g}`}
    </p>
  );
}
```

- [ ] **Step 2: MarketingHeader**

```tsx
// apps/nextjs/src/components/marketing/MarketingHeader.tsx
import Link from "next/link";

import { CrownIcon } from "~/components/CrownIcon";

import { MARKETING_NAV } from "./marketing-content";

export function MarketingHeader() {
  return (
    <header
      className="flex items-center justify-between border-b border-[color:var(--border-soft)] px-6 py-4"
      role="banner"
    >
      <Link
        href="/"
        className="font-display flex items-center gap-1.5 text-2xl font-bold tracking-wider text-[color:var(--brick)] uppercase hover:opacity-80"
        aria-label="clt-app — home"
      >
        <CrownIcon size={22} color="var(--brick)" />
        clt-app
      </Link>
      <nav
        className="hidden items-center gap-5 sm:flex"
        aria-label="Marketing navigation"
      >
        {MARKETING_NAV.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="text-sm text-[color:var(--fg-ink-muted)] hover:text-[color:var(--fg-ink)]"
          >
            {label}
          </Link>
        ))}
        <Link
          href="/today"
          className="text-sm font-medium text-[color:var(--brick)] hover:text-[color:var(--brick-deep)]"
        >
          Open app ▸
        </Link>
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Hero**

```tsx
// apps/nextjs/src/components/marketing/Hero.tsx
import Link from "next/link";

import { CrownIcon } from "~/components/CrownIcon";

import { MARKETING_COPY } from "./marketing-content";

export function Hero() {
  const [line1, line2, line3] = MARKETING_COPY.heroTitle;
  return (
    <section className="relative">
      <div className="px-6 pt-14 pb-2 text-center">
        <div className="mkt-rise mkt-rise-d1 mkt-float font-display tracking-[0.5em] text-[color:var(--gold)]">
          ✦&#8194;&#8194;✦&#8194;&#8194;✦
        </div>
        <h1 className="mkt-rise mkt-rise-d2 font-display mx-auto mt-4 max-w-3xl text-6xl leading-[0.92] font-bold tracking-tight text-[color:var(--fg-ink)] uppercase sm:text-7xl">
          {line1}
          <br />
          {line2}
          <br />
          {line3}{" "}
          <CrownIcon
            size={52}
            color="var(--brick)"
            className="inline-block align-baseline"
          />
        </h1>
        <p className="mkt-rise mkt-rise-d3 mx-auto mt-4 max-w-md text-lg leading-relaxed text-[color:var(--fg-ink-soft)]">
          {MARKETING_COPY.heroSubhead}
        </p>
        <div className="mkt-rise mkt-rise-d4 mt-6">
          <Link
            href="/today"
            className="font-display inline-block rounded-md bg-[color:var(--brick)] px-6 py-3 text-lg font-semibold tracking-wide text-white transition-transform duration-[var(--duration-default)] hover:-translate-y-0.5 hover:bg-[color:var(--brick-deep)]"
          >
            Open the web app
          </Link>
          <p className="mt-4 text-xs tracking-widest text-[color:var(--fg-ink-muted)] uppercase">
            ⟡&#8194; {MARKETING_COPY.comingSoon}
          </p>
        </div>
      </div>
      <svg
        className="mkt-trail mt-1 block h-14 w-full"
        viewBox="0 0 600 70"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,40 C80,10 140,60 220,38 C300,16 360,58 440,36 C520,16 560,46 600,30"
          stroke="var(--map-trail)"
          strokeWidth="2.5"
          opacity="0.5"
        />
      </svg>
    </section>
  );
}
```

- [ ] **Step 4: DomainColumns**

```tsx
// apps/nextjs/src/components/marketing/DomainColumns.tsx
import { MARKETING_COPY, MARKETING_DOMAINS } from "./marketing-content";

export function DomainColumns() {
  const [h1, h2] = MARKETING_COPY.domainsHeading;
  return (
    <section className="px-6 py-4">
      <div className="text-center">
        <p className="font-display text-sm font-semibold tracking-widest text-[color:var(--fg-ink-muted)] uppercase">
          {MARKETING_COPY.domainsLabel}
        </p>
        <h2 className="font-display mt-2 text-4xl font-bold tracking-tight text-[color:var(--fg-ink)] uppercase">
          {h1}
          <br />
          {h2}
        </h2>
      </div>
      <div className="mx-auto mt-8 grid max-w-4xl gap-8 sm:grid-cols-3">
        {MARKETING_DOMAINS.map((d) => (
          <div key={d.name} className="text-center">
            <h3
              className="font-display text-2xl font-bold uppercase"
              style={{ color: `var(${d.colorVar})` }}
            >
              {d.name}
            </h3>
            <p className="mt-1.5 text-sm text-[color:var(--fg-ink-soft)]">
              {d.blurb}
            </p>
            <ul className="mt-3 text-left">
              {d.items.map((item) => (
                <li
                  key={item}
                  className="border-t border-[color:var(--border-soft)] py-1.5 text-sm text-[color:var(--fg-ink-soft)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: CommunityStory**

```tsx
// apps/nextjs/src/components/marketing/CommunityStory.tsx
import { MARKETING_COPY } from "./marketing-content";

export function CommunityStory() {
  const [h1, h2] = MARKETING_COPY.communityHeading;
  return (
    <section className="mx-auto max-w-xl px-6 py-4 text-center">
      <p className="font-display text-sm font-semibold tracking-widest text-[color:var(--fg-ink-muted)] uppercase">
        {MARKETING_COPY.communityLabel}
      </p>
      <h2 className="font-display mt-2 text-4xl font-bold tracking-tight text-[color:var(--fg-ink)] uppercase">
        {h1}
        <br />
        {h2}
      </h2>
      <p className="mt-3.5 text-base leading-relaxed text-[color:var(--fg-ink-soft)]">
        {MARKETING_COPY.communityBody}
      </p>
    </section>
  );
}
```

- [ ] **Step 6: DownloadFooter**

```tsx
// apps/nextjs/src/components/marketing/DownloadFooter.tsx
import Link from "next/link";

import { CrownIcon } from "~/components/CrownIcon";

import { MARKETING_COPY } from "./marketing-content";
import { StoreBadge } from "./StoreBadge";

export function DownloadFooter() {
  const [h1, h2] = MARKETING_COPY.footerHeading;
  return (
    <footer className="border-t border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-6 py-11 text-center">
      <h2 className="font-display text-3xl font-bold tracking-tight text-[color:var(--fg-ink)] uppercase">
        {h1}
        <br />
        {h2}
      </h2>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
        <StoreBadge store="app-store" />
        <StoreBadge store="google-play" />
      </div>
      <div className="mt-4">
        <Link
          href="/today"
          className="font-display inline-block rounded-md bg-[color:var(--brick)] px-5 py-2.5 text-base font-semibold tracking-wide text-white hover:bg-[color:var(--brick-deep)]"
        >
          Or open the web app ▸
        </Link>
      </div>
      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs tracking-widest text-[color:var(--fg-ink-muted)] uppercase">
        {MARKETING_COPY.signoff}
        <CrownIcon size={14} color="var(--brick)" />
      </p>
    </footer>
  );
}
```

- [ ] **Step 7: Typecheck the new components**

Run: `pnpm --filter @clt/nextjs exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add apps/nextjs/src/components/marketing/GlyphDivider.tsx apps/nextjs/src/components/marketing/MarketingHeader.tsx apps/nextjs/src/components/marketing/Hero.tsx apps/nextjs/src/components/marketing/DomainColumns.tsx apps/nextjs/src/components/marketing/CommunityStory.tsx apps/nextjs/src/components/marketing/DownloadFooter.tsx
git commit -m "feat(web): marketing landing section components"
```

---

## Task 11: Assemble the marketing landing at `/`

**Files:**
- Replace: `apps/nextjs/src/app/page.tsx`
- Test: `apps/nextjs/src/app/page.test.ts`

- [ ] **Step 1: Replace `page.tsx` with the landing**

Overwrite the entire file (its old content now lives at `/today` from Task 1):

```tsx
// apps/nextjs/src/app/page.tsx
import type { Metadata } from "next";

import { CommunityStory } from "~/components/marketing/CommunityStory";
import { DomainColumns } from "~/components/marketing/DomainColumns";
import { DownloadFooter } from "~/components/marketing/DownloadFooter";
import { GlyphDivider } from "~/components/marketing/GlyphDivider";
import { Hero } from "~/components/marketing/Hero";
import { MarketingHeader } from "~/components/marketing/MarketingHeader";
import { Reveal } from "~/components/marketing/Reveal";

import "~/styles/marketing.css";

export const metadata: Metadata = {
  title: { absolute: "clt-app — Charlotte's open guide" },
  description:
    "Greenways, daily restaurant deals, and parking for Charlotte — free, community-maintained, no sign-up.",
};

export default function MarketingPage() {
  return (
    <>
      <MarketingHeader />
      <main id="main-content">
        <Hero />
        <Reveal>
          <GlyphDivider glyph="⟡" />
        </Reveal>
        <Reveal>
          <DomainColumns />
        </Reveal>
        <Reveal>
          <GlyphDivider glyph="✦" />
        </Reveal>
        <Reveal>
          <CommunityStory />
        </Reveal>
        <Reveal>
          <DownloadFooter />
        </Reveal>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Write the test**

```ts
// apps/nextjs/src/app/page.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "page.tsx"), "utf-8");

describe("marketing landing /", () => {
  it("composes all five landing sections", () => {
    for (const section of [
      "MarketingHeader",
      "Hero",
      "DomainColumns",
      "CommunityStory",
      "DownloadFooter",
    ]) {
      expect(src).toContain(section);
    }
  });

  it("wraps scrolled sections in Reveal", () => {
    expect(src).toContain("<Reveal>");
  });

  it("loads the marketing motion stylesheet", () => {
    expect(src).toContain('"~/styles/marketing.css"');
  });

  it("no longer renders the app activity feed at /", () => {
    expect(src).not.toContain("activity.recent()");
  });
});
```

- [ ] **Step 3: Run the test**

Run: `pnpm vitest run apps/nextjs/src/app/page.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 4: Commit**

```bash
git add apps/nextjs/src/app/page.tsx apps/nextjs/src/app/page.test.ts
git commit -m "feat(web): marketing landing at /"
```

---

## Task 12: Full verification & link sweep

**Files:** none (verification only).

- [ ] **Step 1: Confirm no stray app-home links remain**

Run: `grep -rn 'href="/"' apps/nextjs/src`
Expected: the **only** match is `MarketingHeader.tsx` (the marketing wordmark, which correctly points to the marketing home `/`). If any other file matches, repoint it to `/today`.

- [ ] **Step 2: Confirm onboarding has no `/` redirect**

Run: `grep -rn 'replace("/")' apps/nextjs/src`
Expected: no matches.

- [ ] **Step 3: Typecheck, lint, test the whole repo**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all pass. If lint flags the `<img>` in `StoreBadge.tsx`, confirm the `eslint-disable-next-line @next/next/no-img-element` comment is present on the line directly above the `<img>`.

- [ ] **Step 4: Manual smoke (optional but recommended)**

Run: `pnpm --filter @clt/nextjs dev`, then in a browser:
- `/` shows the marketing landing (hero rises, trail line draws, sections reveal on scroll); no app header/tab bar.
- `/today` shows "Today in Charlotte" with the app chrome.
- Toggle OS "reduce motion" → reload `/` → everything is static and fully visible.
- First-ever visit to `/today` (clear `localStorage`) redirects to `/onboarding`, which finishes back at `/today`.

- [ ] **Step 5: Final commit (if anything changed)**

```bash
git add -A
git commit -m "chore(web): marketing site verification fixes"
```

---

## Self-Review notes (verified during planning)

- **Spec coverage:** placement/migration (Tasks 1–5), hero/domains/community/footer (Tasks 6,10,11), glyph dividers (Tasks 10,11), copy (Task 6), official badges + Soon state (Task 9), motion + reduced-motion (Tasks 7,8,11), a11y landmarks (Task 10–11), testing (each task), risks/link-sweep (Task 12). No gaps.
- **Type consistency:** `MARKETING_DOMAINS`/`MARKETING_NAV`/`MARKETING_COPY`, `MarketingDomain.colorVar`, and `StoreBadge`'s `store` union are used identically across Tasks 6, 9, 10, 11.
- **No placeholders:** every code step contains full file or exact diff content.
- **Token check:** `--map-trail`, `--gold`, `--brick`, `--brick-deep`, `--bg-cream-soft`, `--border-soft`, `--fg-ink*` all exist in `~/styles/tokens.css` (verified).
