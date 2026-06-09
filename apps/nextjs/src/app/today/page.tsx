import type { Metadata } from "next";
import Link from "next/link";

import { CrownIcon } from "~/components/CrownIcon";
import { createServerCaller } from "~/trpc/server";
import { OnboardingRedirect } from "../_components/onboarding-redirect";
import { Reveal } from "~/components/marketing/Reveal";

import "~/styles/marketing.css";

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

// Color-coded to match the marketing landing's DomainColumns: each destination
// carries its domain's map-marker hue (greenway green, deal gold, brick brand).
const NAV_TILES: { label: string; href: string; colorVar: string }[] = [
  { label: "Greenways", href: "/greenways", colorVar: "--map-trail" },
  { label: "Deals", href: "/deals", colorVar: "--gold" },
  { label: "Map", href: "/map", colorVar: "--brick" },
];

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
      <p
        aria-hidden="true"
        className="mkt-rise mkt-rise-d1 font-display tracking-[0.5em] text-[color:var(--gold)]"
      >
        ✦&#8194;&#8194;✦&#8194;&#8194;✦
      </p>
      <h1 className="mkt-rise mkt-rise-d2 font-display mt-3 flex items-center gap-2.5 text-5xl leading-none font-bold tracking-tight text-[color:var(--fg-ink)] uppercase">
        Today in Charlotte
        <CrownIcon
          size={34}
          color="var(--brick)"
          className="inline-block shrink-0"
        />
      </h1>
      <p className="mkt-rise mkt-rise-d3 mt-2 text-sm text-[color:var(--fg-ink-muted)]">
        {dayShort}
      </p>

      <section className="mkt-rise mkt-rise-d4 mt-12">
        <p className="font-display text-sm font-semibold tracking-widest text-[color:var(--fg-ink-muted)] uppercase">
          Live from the city
        </p>
        <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-[color:var(--fg-ink)] uppercase">
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

      <Reveal>
        <nav className="mt-12 grid grid-cols-3 gap-3">
          {NAV_TILES.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="rounded-md border border-[color:var(--border-soft)] p-4 text-center hover:bg-[color:var(--bg-cream-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
            >
              <span
                className="font-display text-lg font-bold tracking-tight uppercase"
                style={{ color: `var(${tile.colorVar})` }}
              >
                {tile.label}
              </span>
            </Link>
          ))}
        </nav>
      </Reveal>
    </main>
  );
}
