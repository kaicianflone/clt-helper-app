import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DealMapSnippetLoader } from "~/app/deals/[slug]/_components/deal-map-snippet-loader";
import { LastVerifiedBadge } from "~/components/LastVerifiedBadge";
import { ShareButton } from "~/components/ShareButton";
import { StaleDataPrompt } from "~/components/StaleDataPrompt";
import { env } from "~/env";
import { createServerCaller } from "~/trpc/server";

export const revalidate = 60;

const DAY_LABEL = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
} as const;

type DayKey = keyof typeof DAY_LABEL;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const caller = await createServerCaller();
    const lot = await caller.parking.get({ slug });
    return {
      title: lot.name,
      description: `${lot.address} · ${lot.hourlyRate != null ? `$${lot.hourlyRate}/hr` : "rate not posted"}`,
    };
  } catch {
    return { title: "Parking lot" };
  }
}

export default async function ParkingDetailPage({ params }: Props) {
  const { slug } = await params;

  const caller = await createServerCaller();
  let lot;
  try {
    lot = await caller.parking.get({ slug });
  } catch {
    notFound();
  }

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const [lat, lng] = lot.latLng;
  const baseUrl = env.VERCEL_URL
    ? `https://${env.VERCEL_URL}`
    : "http://localhost:3000";
  const pageUrl = `${baseUrl}/parking/${slug}`;

  const zoneNumbers = (lot as { zoneNumbers?: string[] }).zoneNumbers ?? [];
  const totalSpaces = (lot as { totalSpaces?: number }).totalSpaces;
  const firstZone = zoneNumbers[0];

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
          href="/parking"
          className="absolute top-4 left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30"
          aria-label="Back to parking"
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
            {lot.name}
          </h1>
          <div className="mt-3 h-0.5 w-12 bg-[color:var(--gold)]" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-white/80">{lot.address}</p>
            <LastVerifiedBadge
              date={lot.lastVerified}
              now={now}
              variant="hero"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        {/* Rate card */}
        <section className="rounded-lg border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] p-5">
          <div className="font-display text-4xl font-bold text-[color:var(--fg-ink)]">
            {lot.hourlyRate != null
              ? `$${lot.hourlyRate}/hr`
              : "Rate not posted"}
          </div>
          <div className="mt-1 text-sm text-[color:var(--fg-ink-soft)]">
            {lot.dailyMax != null && <span>${lot.dailyMax}/day max · </span>}
            {lot.covered ? "Covered" : "Uncovered"}
            {totalSpaces != null && <span> · {totalSpaces} spaces</span>}
            {lot.operator && <span> · {lot.operator}</span>}
          </div>
          <div className="mt-1 text-sm text-[color:var(--fg-ink-soft)]">
            Pays: {lot.paymentMethods.join(", ")}
          </div>
        </section>

        {/* ParkMobile zone info */}
        {zoneNumbers.length > 0 && (
          <section className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h2 className="font-medium text-blue-900">ParkMobile Zone</h2>
            <p className="mt-1 text-sm text-blue-800">
              Zone{zoneNumbers.length > 1 ? "s" : ""}{" "}
              <span className="font-mono font-bold">
                {zoneNumbers.slice(0, 5).join(", ")}
                {zoneNumbers.length > 5 && ` +${zoneNumbers.length - 5} more`}
              </span>
            </p>
            <p className="mt-2 text-xs text-blue-700">
              Look for the green ParkMobile signs near the meter or pay station.
              Confirm the zone number on the sign matches before paying — nearby
              blocks may have different zones.
            </p>
            {firstZone && (
              <a
                href={`https://app.parkmobile.io/zone/${firstZone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Pay with ParkMobile
              </a>
            )}
          </section>
        )}

        {/* Hours */}
        <section className="mt-6">
          <h2 className="font-display text-2xl font-bold text-[color:var(--fg-ink)]">
            Hours
          </h2>
          <ul className="mt-2 text-sm">
            {(Object.keys(DAY_LABEL) as DayKey[]).map((d) => {
              const v = lot.hours[d];
              return (
                <li key={d} className="flex justify-between py-1">
                  <span className="text-[color:var(--fg-ink-soft)]">
                    {DAY_LABEL[d]}
                  </span>
                  <span className="text-[color:var(--fg-ink)]">
                    {typeof v === "string" ? v : `${v.open}–${v.close}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Map */}
        <div className="mt-8">
          <DealMapSnippetLoader
            latLng={lot.latLng}
            mapTilerKey={env.NEXT_PUBLIC_MAPTILER_KEY}
          />
        </div>

        {/* Helper tips */}
        <section className="mt-6 rounded-lg border border-[color:var(--amber-warn)]/30 bg-[color:var(--amber-warn)]/5 p-4">
          <h3 className="text-sm font-medium text-[color:var(--fg-ink)]">
            Tips for street parking
          </h3>
          <ul className="mt-2 space-y-1 text-xs text-[color:var(--fg-ink-soft)]">
            <li>
              ✓ Check the ParkMobile sign or pay station near your space for the
              correct zone number
            </li>
            <li>
              ✓ Adjacent blocks may have different zone numbers — always verify
              the closest sign
            </li>
            <li>
              ✓ You can pay via the ParkMobile app, at a pay station, or at the
              meter
            </li>
            <li>✓ Enforcement is Mon–Fri, 8 AM – 6 PM in most areas</li>
          </ul>
        </section>

        {/* Stale data prompt */}
        <div className="mt-8">
          <StaleDataPrompt
            date={lot.lastVerified}
            slug={lot.slug}
            kind="parking"
            now={now}
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
          <ShareButton url={pageUrl} title={lot.name} />
          <a
            href={`/contribute/parking/${lot.slug}`}
            className="flex min-h-[44px] items-center justify-center rounded-md border border-[color:var(--border-soft)] px-4 py-2.5 text-center text-sm font-medium text-[color:var(--fg-ink-soft)] hover:bg-[color:var(--bg-cream-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
          >
            Suggest an edit
          </a>
        </div>
      </div>
    </main>
  );
}
