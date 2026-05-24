import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LastVerifiedBadge } from "~/components/LastVerifiedBadge";
import { env } from "~/env";
import { createServerCaller } from "~/trpc/server";
import { DealLocationMapLoader } from "./_components/deal-location-map-loader";

export const revalidate = 60;

interface Props {
  params: Promise<{ locationSlug: string }>;
}

const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locationSlug } = await params;

  let name = locationSlug;
  try {
    const caller = await createServerCaller();
    const deals = await caller.deal.listByLocation({ locationSlug });
    name = deals[0]?.restaurantName ?? locationSlug;
  } catch {
    // notFound() in page body
  }

  return {
    title: `${name} — All Deals`,
    description: `All deals at ${name} in Charlotte, NC.`,
  };
}

export default async function DealLocationPage({ params }: Props) {
  const { locationSlug } = await params;

  const caller = await createServerCaller();
  let deals;
  try {
    deals = await caller.deal.listByLocation({ locationSlug });
  } catch {
    notFound();
  }

  const DAY_ORDER: Record<string, number> = {
    mon: 0,
    tue: 1,
    wed: 2,
    thu: 3,
    fri: 4,
    sat: 5,
    sun: 6,
  };
  deals.sort(
    (a, b) =>
      (DAY_ORDER[a.daysOfWeek[0] ?? ""] ?? 7) -
      (DAY_ORDER[b.daysOfWeek[0] ?? ""] ?? 7),
  );

  const first = deals[0];
  if (!first) notFound();
  const [lat, lng] = first.restaurantLatLng;
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();

  return (
    <main>
      {/* Hero */}
      <div className="relative flex min-h-[28vh] items-end overflow-hidden bg-[color:var(--brick)] px-4 pb-8 sm:min-h-[40vh] sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
          aria-hidden="true"
        />
        <Link
          href="/deals"
          className="absolute top-4 left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30"
          aria-label="Back to deals"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="font-display text-5xl leading-none font-bold tracking-tight text-white">
            {first.restaurantName}
          </h1>
          <div className="mt-3 h-0.5 w-12 bg-[color:var(--gold)]" />
          <p className="mt-3 text-sm text-white/80">
            {deals.length} deal{deals.length !== 1 ? "s" : ""} &middot;{" "}
            {first.restaurantAddress}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        {/* Map */}
        <DealLocationMapLoader
          latLng={first.restaurantLatLng}
          mapTilerKey={env.NEXT_PUBLIC_MAPTILER_KEY}
        />

        {/* Deal list */}
        <ul className="mt-8 divide-y divide-[color:var(--border-soft)]">
          {deals.map((d) => {
            const timeLabel =
              typeof d.timeWindow === "string"
                ? "All day"
                : `${d.timeWindow.start}–${d.timeWindow.end}`;
            const daysLabel = d.daysOfWeek
              .map((day: string) => DAY_LABELS[day] ?? day)
              .join(", ");

            return (
              <li key={d.slug} className="py-5">
                <Link href={`/deals/${d.slug}`} className="group block">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-[color:var(--fg-ink)] group-hover:text-[color:var(--brick)]">
                        {d.dealDescription}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--fg-ink-muted)]">
                        {daysLabel} &middot; {timeLabel}
                      </p>
                    </div>
                    <LastVerifiedBadge date={d.lastVerified} now={nowMs} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 border-t border-[color:var(--border-soft)] pt-6 sm:flex-row sm:flex-wrap sm:items-center">
          <a
            href={`https://maps.google.com/?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-[color:var(--brick)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[color:var(--brick-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)] sm:w-auto"
          >
            Navigate here
          </a>
          <a
            href={`/contribute/deal/new`}
            className="flex min-h-[44px] items-center justify-center rounded-md border border-[color:var(--border-soft)] px-4 py-2.5 text-center text-sm font-medium text-[color:var(--fg-ink-soft)] hover:bg-[color:var(--bg-cream-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
          >
            Add a deal here
          </a>
        </div>
      </div>
    </main>
  );
}
