import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "day-tabs.tsx"), "utf-8");

describe("DayTabs", () => {
  it("sets min-h-[44px] on each pill for touch target compliance", () => {
    expect(src).toContain("min-h-[44px]");
  });

  it("uses brick color for active pill (not gold) for contrast", () => {
    expect(src).toContain("bg-[color:var(--brick)]");
    expect(src).not.toContain("bg-[color:var(--gold)]");
  });

  it("has aria-label on the nav for screen readers", () => {
    expect(src).toContain('aria-label="Day filter"');
  });

  it("marks the active day with aria-current", () => {
    expect(src).toContain('aria-current={d === active ? "page" : undefined}');
  });
});
