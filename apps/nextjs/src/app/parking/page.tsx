import type { Metadata } from "next";
import Link from "next/link";
import { createServerCaller } from "~/trpc/server";
import { EmptyState } from "~/components/EmptyState";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Parking · Charlotte",
  description: "Community-maintained parking directory for Charlotte, NC.",
};

export default async function ParkingPage() {
  const caller = await createServerCaller();
  const lots = await caller.parking.list();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="font-display text-4xl font-bold tracking-tight text-[color:var(--fg-ink)]">
        Parking
      </h1>
      <p className="mt-1 text-sm text-[color:var(--fg-ink-muted)]">
        {lots.length} lot{lots.length !== 1 ? "s" : ""}.
      </p>

      {lots.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No parking lots listed yet"
            body="Help build the directory."
            action={{ label: "Add a lot", href: "/contribute/parking/new" }}
          />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-[color:var(--border-soft)]">
          {lots.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/parking/${p.slug}`}
                className="block py-4 hover:bg-[color:var(--bg-cream-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
              >
                <div className="font-medium text-[color:var(--fg-ink)]">
                  {p.name}
                </div>
                <div className="mt-1 text-sm text-[color:var(--fg-ink-muted)]">
                  {p.hourlyRate != null
                    ? `$${p.hourlyRate}/hr`
                    : "rate not posted"}
                  {p.dailyMax != null && ` · $${p.dailyMax}/day max`}
                  {p.covered && " · covered"}
                </div>
                <div className="mt-1 text-xs text-[color:var(--fg-ink-muted)]">
                  {p.address}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
