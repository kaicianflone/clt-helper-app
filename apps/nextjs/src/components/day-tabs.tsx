"use client";
import Link from "next/link";

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];
const LABEL: Record<Day, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export function DayTabs({ active }: { active: Day }) {
  return (
    <nav className="flex gap-2 overflow-x-auto" aria-label="Day filter">
      {DAYS.map((d) => (
        <Link
          key={d}
          href={`/deals?day=${d}`}
          aria-current={d === active ? "page" : undefined}
          className={`rounded-full px-3 py-1 text-sm transition ${
            d === active
              ? "bg-[color:var(--fg-ink)] text-[color:var(--bg-cream)]"
              : "bg-[color:var(--bg-cream-deep)] text-[color:var(--fg-ink-soft)] hover:bg-[color:var(--bg-cream-soft)]"
          }`}
        >
          {LABEL[d]}
        </Link>
      ))}
    </nav>
  );
}

export const dayFromDate = (): Day => {
  const idx = (new Date().getDay() + 6) % 7;
  // DAYS has exactly 7 elements; idx is always 0-6
  return DAYS[idx] ?? "mon";
};
