import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LastVerifiedBadge } from "~/components/LastVerifiedBadge";
import { ShareButton } from "~/components/ShareButton";
import { StaleDataPrompt } from "~/components/StaleDataPrompt";
import { env } from "~/env";
import { createServerCaller } from "~/trpc/server";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  let name = slug;
  try {
    const caller = await createServerCaller();
    const g = await caller.greenway.get({ slug });
    name = g.name;
  } catch {
    // swallow — notFound() in the page body will handle it
  }

  return {
    title: name,
    description: `${name} greenway trail in Charlotte, NC.`,
  };
}

export default async function GreenwayDetailPage({ params }: Props) {
  const { slug } = await params;

  const caller = await createServerCaller();
  let greenway;
  try {
    greenway = await caller.greenway.get({ slug });
  } catch {
    notFound();
  }

  const baseUrl = env.VERCEL_URL
    ? `https://${env.VERCEL_URL}`
    : "http://localhost:3000";
  const pageUrl = `${baseUrl}/greenways/${slug}`;
  // eslint-disable-next-line react-hooks/purity -- server component; Date.now() is stable during RSC render
  const nowMs = Date.now();

  return (
    <main>
      {/* Hero — solid brick header with display-lg name overlay */}
      <div className="relative flex min-h-[40vh] items-end bg-[color:var(--brick)] px-4 pb-8 sm:px-8">
        <div>
          <h1 className="font-display text-5xl leading-none font-bold tracking-tight text-white">
            {greenway.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-white/80">
              {greenway.lengthMiles} mi &middot; {greenway.surface}
            </p>
            <LastVerifiedBadge date={greenway.lastVerified} now={nowMs} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        {/* Description */}
        {greenway.description && (
          <p className="text-lg leading-relaxed text-[color:var(--fg-ink-soft)]">
            {greenway.description}
          </p>
        )}

        {/* Trailheads */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-[color:var(--fg-ink)]">
            Trailheads
          </h2>
          <ul className="mt-4 space-y-3">
            {greenway.trailheads.map(
              (
                t: {
                  name: string;
                  lat: number;
                  lng: number;
                  parkingNotes?: string;
                },
                i: number,
              ) => (
                <li
                  key={i}
                  className="rounded-lg border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] p-4"
                >
                  <p className="font-medium text-[color:var(--fg-ink)]">
                    {t.name}
                  </p>
                  {t.parkingNotes && (
                    <p className="mt-1 text-sm text-[color:var(--fg-ink-muted)]">
                      {t.parkingNotes}
                    </p>
                  )}
                  <a
                    href={`https://maps.google.com/?q=${t.lat},${t.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-[color:var(--brick)] underline underline-offset-2 hover:text-[color:var(--brick-deep)]"
                  >
                    Get directions
                  </a>
                </li>
              ),
            )}
          </ul>
        </section>

        {/* Points of Interest */}
        {greenway.pointsOfInterest.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-[color:var(--fg-ink)]">
              Points of Interest
            </h2>
            <ul className="mt-4 divide-y divide-[color:var(--border-soft)]">
              {greenway.pointsOfInterest.map(
                (
                  poi: {
                    name: string;
                    kind: string;
                    lat: number;
                    lng: number;
                  },
                  i: number,
                ) => (
                  <li key={i} className="py-3">
                    <p className="font-medium text-[color:var(--fg-ink)]">
                      {poi.name}
                    </p>
                    <p className="mt-0.5 text-sm text-[color:var(--fg-ink-muted)] capitalize">
                      {poi.kind}
                    </p>
                  </li>
                ),
              )}
            </ul>
          </section>
        )}

        {/* Stale data prompt */}
        <div className="mt-12">
          <StaleDataPrompt
            date={greenway.lastVerified}
            slug={slug}
            kind="greenway"
            now={nowMs}
          />
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[color:var(--border-soft)] pt-6">
          <a
            href={`https://maps.google.com/?q=${greenway.trailheads[0]?.lat ?? 0},${greenway.trailheads[0]?.lng ?? 0}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-[color:var(--brick)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[color:var(--brick-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
          >
            Get directions to nearest trailhead
          </a>
          <ShareButton url={pageUrl} title={greenway.name} />
          <a
            href={`/contribute/greenway/${slug}`}
            className="rounded-md px-4 py-2.5 text-sm font-medium text-[color:var(--fg-ink-soft)] hover:bg-[color:var(--bg-cream-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
          >
            Suggest an edit
          </a>
        </div>
      </div>
    </main>
  );
}
