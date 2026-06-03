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
