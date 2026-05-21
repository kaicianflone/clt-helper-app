import type { Metadata } from "next";
import Link from "next/link";

import { createServerCaller } from "~/trpc/server";
import { EmptyState } from "~/components/EmptyState";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Greenways",
  description: "Charlotte's community-maintained greenway trails.",
};

export default async function GreenwaysPage() {
  const caller = await createServerCaller();
  const greenways = await caller.greenway.list();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      {/* Page header */}
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[color:var(--fg-ink)]">
            Greenways
          </h1>
          <p className="mt-1 text-sm text-[color:var(--fg-ink-muted)]">
            {greenways.length} trail{greenways.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Trail list */}
      {greenways.length === 0 ? (
        <EmptyState
          title="No greenways yet"
          body="Greenways will appear here once data is imported."
        />
      ) : (
        <ul className="divide-y divide-[color:var(--border-soft)]">
          {greenways.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/greenways/${g.slug}`}
                className="flex items-start justify-between gap-4 py-4 hover:bg-[color:var(--bg-cream-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold leading-snug text-[color:var(--fg-ink)]">
                    {g.name}
                  </p>
                  <p className="mt-0.5 text-sm text-[color:var(--fg-ink-muted)]">
                    {g.lengthMiles} mi &middot; {g.surface}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
