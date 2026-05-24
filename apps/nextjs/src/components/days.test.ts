import { describe, expect, it, vi } from "vitest";

import { dayFromDate, DAYS } from "./days";

describe("DAYS", () => {
  it("contains all 7 days in mon-sun order", () => {
    expect(DAYS).toEqual(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
  });
});

describe("dayFromDate", () => {
  it("returns a valid day abbreviation", () => {
    const result = dayFromDate();
    expect(DAYS).toContain(result);
  });

  it("returns the correct day for a known timestamp", () => {
    vi.useFakeTimers();
    // Wednesday, 2026-05-20 at 14:00 UTC = 10:00 AM EDT (still Wednesday)
    vi.setSystemTime(new Date("2026-05-20T14:00:00Z"));
    expect(dayFromDate()).toBe("wed");
    vi.useRealTimers();
  });

  it("handles late-night UTC that is still the same day in ET", () => {
    vi.useFakeTimers();
    // 2026-05-21 03:00 UTC = 2026-05-20 23:00 EDT (still Wednesday)
    vi.setSystemTime(new Date("2026-05-21T03:00:00Z"));
    expect(dayFromDate()).toBe("wed");
    vi.useRealTimers();
  });

  it("handles early-morning UTC that has crossed midnight in ET", () => {
    vi.useFakeTimers();
    // 2026-05-21 05:00 UTC = 2026-05-21 01:00 EDT (Thursday)
    vi.setSystemTime(new Date("2026-05-21T05:00:00Z"));
    expect(dayFromDate()).toBe("thu");
    vi.useRealTimers();
  });
});
