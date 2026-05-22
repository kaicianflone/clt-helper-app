import type { Metadata } from "next";
import Link from "next/link";

import { createServerCaller } from "~/trpc/server";
import { OnboardingRedirect } from "./_components/onboarding-redirect";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Today in Charlotte",
  description:
    "Charlotte's greenways, local deals, and parking — community-maintained.",
};

type ContextSlot = "trails" | "deals" | "parking";

const slotForHour = (h: number): ContextSlot => {
  if (h < 11) return "trails";
  if (h < 16) return "deals";
  return "parking";
};

export default async function HomePage() {
  const date = new Date();
  const slot = slotForHour(date.getUTCHours()); // close enough for v1; real timezone later
  const dayShort = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const caller = await createServerCaller();

  // Run fetches in parallel
  const [greenways, deals, parking] = await Promise.all([
    caller.greenway.list().catch(() => []),
    caller.deal.list().catch(() => []),
    caller.parking.list().catch(() => []),
  ]);

  interface AnyItem {
    slug: string;
    name?: string;
    restaurantName?: string;
  }

  const featuredItems: AnyItem[] = (
    slot === "trails"
      ? greenways.slice(0, 5)
      : slot === "deals"
        ? deals.slice(0, 5)
        : parking.slice(0, 5)
  ) as AnyItem[];

  const featuredHref = (item: AnyItem): string => {
    if (slot === "trails") return `/greenways/${item.slug}`;
    if (slot === "deals") return `/deals`;
    return `/parking/${item.slug}`;
  };

  const featuredLabel = (item: AnyItem): string =>
    item.name ?? item.restaurantName ?? item.slug;

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
          {slot === "trails"
            ? "Greenways"
            : slot === "deals"
              ? "Deals today"
              : "Parking"}
        </h2>

        {featuredItems.length === 0 ? (
          <p className="mt-3 text-sm text-[color:var(--fg-ink-muted)]">
            Nothing listed yet.{" "}
            <Link
              href={
                slot === "trails"
                  ? "/greenways"
                  : slot === "deals"
                    ? "/deals"
                    : "/parking"
              }
              className="text-[color:var(--brick)] underline hover:text-[color:var(--brick-deep)]"
            >
              Browse all
            </Link>
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[color:var(--border-soft)]">
            {featuredItems.map((item) => (
              <li key={item.slug} className="py-3">
                <Link
                  href={featuredHref(item)}
                  className="text-[color:var(--fg-ink)] hover:text-[color:var(--brick)]"
                >
                  {featuredLabel(item)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          href="/parking"
          className="rounded-md border border-[color:var(--border-soft)] p-4 text-center text-sm font-medium text-[color:var(--fg-ink)] hover:bg-[color:var(--bg-cream-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
        >
          Parking
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
