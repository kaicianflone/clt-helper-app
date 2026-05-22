import type { Metadata } from "next";

import { createServerCaller } from "~/trpc/server";
import { ParkingWrapper } from "./_components/parking-wrapper";

export const revalidate = 60;

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type HoursValue = { open: string; close: string } | "closed" | "24h";
type PaymentMethod = "cash" | "card" | "app" | "meter";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "new") {
    return {
      title: "Add a parking lot",
      description: "Submit a new parking lot to Charlotte's open guide.",
    };
  }
  return {
    title: `Suggest an edit — ${slug}`,
    description: `Help keep this parking lot accurate by suggesting corrections.`,
  };
}

export default async function ContributeParkingPage({ params }: Props) {
  const { slug } = await params;
  const isNew = slug === "new";

  let initialData:
    | {
        name: string;
        address: string;
        hourlyRate: string;
        dailyMax: string;
        hours: Record<DayKey, HoursValue>;
        paymentMethods: PaymentMethod[];
        covered: boolean;
        operator: string;
      }
    | undefined;

  if (!isNew) {
    try {
      const caller = await createServerCaller();
      const lot = await caller.parking.get({ slug });
      initialData = {
        name: lot.name,
        address: lot.address,
        hourlyRate: lot.hourlyRate != null ? String(lot.hourlyRate) : "",
        dailyMax: lot.dailyMax != null ? String(lot.dailyMax) : "",
        hours: lot.hours as Record<DayKey, HoursValue>,
        paymentMethods: lot.paymentMethods as PaymentMethod[],
        covered: lot.covered,
        operator: lot.operator ?? "",
      };
    } catch {
      // Lot not found — render empty form
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-8">
      <h1 className="font-display text-4xl font-bold tracking-tight text-[color:var(--fg-ink)]">
        {isNew ? "Add a parking lot" : "Suggest an edit"}
      </h1>
      <p className="mt-2 text-base text-[color:var(--fg-ink-soft)]">
        {isNew
          ? "Your addition will become a pull request. Be specific."
          : "Your edit will become a pull request. Be specific."}
      </p>
      {!isNew && (
        <p className="mt-1 text-sm text-[color:var(--fg-ink-muted)]">
          Editing:{" "}
          <a
            href={`/parking/${slug}`}
            className="text-[color:var(--brick)] underline underline-offset-2 hover:text-[color:var(--brick-deep)]"
          >
            {initialData?.name ?? slug}
          </a>
        </p>
      )}

      <div className="mt-8">
        <ParkingWrapper
          slug={slug}
          isNew={isNew}
          initialName={initialData?.name}
          initialAddress={initialData?.address}
          initialHourlyRate={initialData?.hourlyRate}
          initialDailyMax={initialData?.dailyMax}
          initialHours={initialData?.hours}
          initialPaymentMethods={initialData?.paymentMethods}
          initialCovered={initialData?.covered}
          initialOperator={initialData?.operator}
        />
      </div>
    </main>
  );
}
