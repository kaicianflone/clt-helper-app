import type { Metadata } from "next";

import { EmptyState } from "~/components/EmptyState";
import { createServerCaller } from "~/trpc/server";
import { GreenwayList } from "./_components/greenway-list";

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
        <GreenwayList greenways={greenways} />
      )}
    </main>
  );
}
