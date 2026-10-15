// apps/nextjs/src/components/marketing/marketing-content.test.ts
import { describe, expect, it } from "vitest";

import { MARKETING_COPY, MARKETING_DOMAINS } from "./marketing-content";

describe("marketing content", () => {
  it("defines greenways and deals, each with three items", () => {
    expect(MARKETING_DOMAINS.map((d) => d.name)).toEqual([
      "Greenways",
      "Deals",
    ]);
    for (const d of MARKETING_DOMAINS) expect(d.items).toHaveLength(3);
  });

  it("ties each domain to a distinct color var", () => {
    const colors = MARKETING_DOMAINS.map((d) => d.colorVar);
    expect(new Set(colors).size).toBe(colors.length);
    for (const c of colors) expect(c.startsWith("--")).toBe(true);
  });

  it("does not claim official endorsement", () => {
    expect(MARKETING_COPY.communityBody).toMatch(/not affiliated with/i);
  });

  it("mentions no Android or Play Store", () => {
    expect(JSON.stringify(MARKETING_COPY)).not.toMatch(/android|google play/i);
  });
});
