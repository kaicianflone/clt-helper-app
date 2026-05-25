"use client";

import Link from "next/link";

import type { Day } from "./days";
import { DAYS } from "./days";

export { DAYS, dayFromDate, type Day } from "./days";

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
    <nav className="flex gap-1.5 overflow-x-auto" aria-label="Day filter">
      {DAYS.map((d) => (
        <Link
          key={d}
          href={`/deals?day=${d}`}
          aria-current={d === active ? "page" : undefined}
          className={`flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm transition ${
            d === active
              ? "bg-[color:var(--brick)] text-white"
              : "bg-[color:var(--bg-cream-deep)] text-[color:var(--fg-ink-soft)] hover:bg-[color:var(--bg-cream-soft)]"
          }`}
        >
          {LABEL[d]}
        </Link>
      ))}
    </nav>
  );
}
