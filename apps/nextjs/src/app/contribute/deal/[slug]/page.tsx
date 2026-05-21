import type { Metadata } from "next";
import { createServerCaller } from "~/trpc/server";
import { DealWrapper } from "./_components/deal-wrapper";
import type { Day } from "~/components/day-tabs";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "new") {
    return {
      title: "Add a deal",
      description: "Submit a new restaurant deal to Charlotte's open guide.",
    };
  }
  return {
    title: `Suggest an edit — ${slug}`,
    description: `Help keep this deal accurate by suggesting corrections.`,
  };
}

export default async function ContributeDealPage({ params }: Props) {
  const { slug } = await params;
  const isNew = slug === "new";

  let initialData:
    | {
        restaurantName: string;
        restaurantAddress: string;
        dealDescription: string;
        daysOfWeek: Day[];
        allDay: boolean;
        timeStart: string;
        timeEnd: string;
        link?: string;
      }
    | undefined;

  if (!isNew) {
    try {
      const caller = await createServerCaller();
      const deal = await caller.deal.get({ slug });
      initialData = {
        restaurantName: deal.restaurantName,
        restaurantAddress: deal.restaurantAddress,
        dealDescription: deal.dealDescription,
        daysOfWeek: deal.daysOfWeek,
        allDay: typeof deal.timeWindow === "string",
        timeStart:
          typeof deal.timeWindow === "object" ? deal.timeWindow.start : "11:00",
        timeEnd:
          typeof deal.timeWindow === "object" ? deal.timeWindow.end : "15:00",
        link: deal.link,
      };
    } catch {
      // Deal not found — still render empty form with the slug pre-filled
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-8">
      <h1 className="font-display text-4xl font-bold tracking-tight text-[color:var(--fg-ink)]">
        {isNew ? "Add a deal" : "Suggest an edit"}
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
            href={`/deals`}
            className="text-[color:var(--brick)] underline underline-offset-2 hover:text-[color:var(--brick-deep)]"
          >
            {initialData?.restaurantName ?? slug}
          </a>
        </p>
      )}

      <div className="mt-8">
        <DealWrapper
          slug={slug}
          isNew={isNew}
          initialRestaurantName={initialData?.restaurantName}
          initialRestaurantAddress={initialData?.restaurantAddress}
          initialDealDescription={initialData?.dealDescription}
          initialDaysOfWeek={initialData?.daysOfWeek}
          initialAllDay={initialData?.allDay}
          initialTimeStart={initialData?.timeStart}
          initialTimeEnd={initialData?.timeEnd}
          initialLink={initialData?.link}
        />
      </div>
    </main>
  );
}
