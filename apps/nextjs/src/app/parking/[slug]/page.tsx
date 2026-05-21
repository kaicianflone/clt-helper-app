import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerCaller } from "~/trpc/server";
import { LastVerifiedBadge } from "~/components/LastVerifiedBadge";
import { StaleDataPrompt } from "~/components/StaleDataPrompt";
import { ShareButton } from "~/components/ShareButton";

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

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-bold leading-none tracking-tight text-[color:var(--fg-ink)]">
            {lot.name}
          </h1>
          <p className="mt-1 text-[color:var(--fg-ink-muted)]">{lot.address}</p>
        </div>
        <LastVerifiedBadge date={lot.lastVerified} now={now} />
      </div>

      <section className="mt-6 rounded-lg border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] p-5">
        <div className="font-display text-4xl font-bold text-[color:var(--fg-ink)]">
          {lot.hourlyRate != null ? `$${lot.hourlyRate}/hr` : "Rate not posted"}
        </div>
        <div className="mt-1 text-sm text-[color:var(--fg-ink-soft)]">
          {lot.dailyMax != null && <span>${lot.dailyMax}/day max · </span>}
          {lot.covered ? "Covered" : "Uncovered"}
          {lot.operator && <span> · {lot.operator}</span>}
        </div>
        <div className="mt-1 text-sm text-[color:var(--fg-ink-soft)]">
          Pays: {lot.paymentMethods.join(", ")}
        </div>
      </section>

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
                  {typeof v === "string"
                    ? v
                    : `${v.open}–${v.close}`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8">
        <StaleDataPrompt
          date={lot.lastVerified}
          slug={lot.slug}
          kind="parking"
          now={now}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={`/contribute/parking/${lot.slug}`}
          className="rounded-md bg-[color:var(--brick)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--brick-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
        >
          Suggest an edit
        </a>
        <ShareButton
          url={`https://clt-app.com/parking/${lot.slug}`}
          title={lot.name}
        />
      </div>
    </main>
  );
}
