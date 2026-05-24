import type { Day } from "~/components/days";
import { CrownIcon } from "~/components/CrownIcon";
import { DayTabs } from "~/components/day-tabs";
import { dayFromDate, DAYS } from "~/components/days";
import { EmptyState } from "~/components/EmptyState";
import { LastVerifiedBadge } from "~/components/LastVerifiedBadge";
import { createServerCaller } from "~/trpc/server";

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = (
    DAYS.includes(params.day as Day) ? params.day : dayFromDate()
  ) as Day;
  return {
    title: `Deals`,
    description: `Charlotte restaurant deals for ${day}.`,
  };
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = (
    DAYS.includes(params.day as Day) ? params.day : dayFromDate()
  ) as Day;

  const caller = await createServerCaller();
  const deals = await caller.deal.list({ day });
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="font-display text-4xl font-bold tracking-tight text-[color:var(--fg-ink)]">
        Deals &middot; {day.toUpperCase()}
      </h1>
      <p className="mt-1 text-sm text-[color:var(--fg-ink-muted)]">
        {deals.length} deal{deals.length !== 1 ? "s" : ""} today.
      </p>
      <div className="mt-4">
        <DayTabs active={day} />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[color:var(--border-soft)]" />
        <CrownIcon size={12} />
        <div className="h-px flex-1 bg-[color:var(--border-soft)]" />
      </div>

      {deals.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={`No deals listed for ${day.toUpperCase()} yet`}
            body="Know one? Be the first to add it."
            action={{ label: "Add a deal", href: "/contribute/deal/new" }}
          />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-[color:var(--border-soft)]">
          {deals.map((d) => (
            <li key={d.slug} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-[color:var(--fg-ink)]">
                    {d.restaurantName}
                  </div>
                  <div className="mt-1 text-sm text-[color:var(--fg-ink)]">
                    {d.dealDescription}
                  </div>
                  <div className="mt-1 text-sm text-[color:var(--fg-ink-muted)]">
                    {typeof d.timeWindow === "string"
                      ? "All day"
                      : `${d.timeWindow.start}–${d.timeWindow.end}`}
                    {" · "}
                    {d.restaurantAddress}
                  </div>
                </div>
                <LastVerifiedBadge date={d.lastVerified} now={now} />
              </div>
              <div className="mt-2 flex gap-3 text-sm">
                {d.link && (
                  <a
                    href={d.link}
                    className="text-[color:var(--fg-ink)] underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Website
                  </a>
                )}
                <a
                  href={`/contribute/deal/${d.slug}`}
                  className="text-[color:var(--fg-ink-soft)] underline"
                >
                  Suggest edit
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
