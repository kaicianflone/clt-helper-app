import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LastVerifiedBadge } from "~/components/LastVerifiedBadge";
import { ShareButton } from "~/components/ShareButton";
import { StaleDataPrompt } from "~/components/StaleDataPrompt";
import { env } from "~/env";
import { createServerCaller } from "~/trpc/server";
import { DealMapSnippetLoader } from "./_components/deal-map-snippet-loader";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  let title = slug;
  try {
    const caller = await createServerCaller();
    const d = await caller.deal.get({ slug });
    title = `${d.restaurantName} — ${d.dealDescription}`;
  } catch {
    // notFound() in the page body will handle it
  }

  return {
    title,
    description: `${title} — Charlotte restaurant deal.`,
  };
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

export default async function DealDetailPage({ params }: Props) {
  const { slug } = await params;

  const caller = await createServerCaller();
  let deal;
  try {
    deal = await caller.deal.get({ slug });
  } catch {
    notFound();
  }

  const baseUrl = env.VERCEL_URL
    ? `https://${env.VERCEL_URL}`
    : "http://localhost:3000";
  const pageUrl = `${baseUrl}/deals/${slug}`;
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();

  const timeLabel =
    typeof deal.timeWindow === "string"
      ? "All day"
      : `${deal.timeWindow.start}–${deal.timeWindow.end}`;

  const daysLabel = deal.daysOfWeek
    .map((d: string) => DAY_LABELS[d] ?? d)
    .join(", ");

  const [lat, lng] = deal.restaurantLatLng;
  const locationSlug = deal.restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

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
            {deal.restaurantName}
          </h1>
          <div className="mt-3 h-0.5 w-12 bg-[color:var(--gold)]" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-white/80">
              {daysLabel} &middot; {timeLabel}
            </p>
            <LastVerifiedBadge
              date={deal.lastVerified}
              now={nowMs}
              variant="hero"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        {/* Deal description */}
        <p className="text-lg leading-relaxed text-[color:var(--fg-ink)]">
          {deal.dealDescription}
        </p>

        <Link
          href={`/deals/location/${locationSlug}`}
          className="mt-3 inline-block text-sm font-medium text-[color:var(--brick)] underline underline-offset-2 hover:text-[color:var(--brick-deep)]"
        >
          All deals at {deal.restaurantName} →
        </Link>

        {/* Details */}
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex gap-2">
            <dt className="font-medium text-[color:var(--fg-ink-muted)]">
              When
            </dt>
            <dd className="text-[color:var(--fg-ink)]">
              {daysLabel}, {timeLabel}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-[color:var(--fg-ink-muted)]">
              Where
            </dt>
            <dd className="text-[color:var(--fg-ink)]">
              {deal.restaurantAddress}
            </dd>
          </div>
        </dl>

        {/* Map snippet */}
        <div className="mt-8">
          <DealMapSnippetLoader
            latLng={deal.restaurantLatLng}
            mapTilerKey={env.NEXT_PUBLIC_MAPTILER_KEY}
          />
        </div>

        {/* Stale data prompt */}
        <div className="mt-8">
          <StaleDataPrompt
            date={deal.lastVerified}
            slug={slug}
            kind="deal"
            now={nowMs}
          />
        </div>

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
          <ShareButton url={pageUrl} title={deal.restaurantName} />
          <a
            href={`/contribute/deal/${slug}`}
            className="flex min-h-[44px] items-center justify-center rounded-md border border-[color:var(--border-soft)] px-4 py-2.5 text-center text-sm font-medium text-[color:var(--fg-ink-soft)] hover:bg-[color:var(--bg-cream-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
          >
            Suggest an edit
          </a>
          <a
            href={`/contribute/deal/${slug}?unavailable=true`}
            className="flex min-h-[44px] items-center justify-center rounded-md border border-[color:var(--rose-stale)]/30 px-4 py-2.5 text-center text-sm font-medium text-[color:var(--rose-stale)] hover:bg-[color:var(--rose-stale)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--rose-stale)]"
          >
            Report unavailable
          </a>
        </div>
      </div>
    </main>
  );
}
