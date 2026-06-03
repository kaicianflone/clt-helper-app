// apps/nextjs/src/components/marketing/marketing-content.test.ts
import { describe, expect, it } from "vitest";

import {
  MARKETING_COPY,
  MARKETING_DOMAINS,
  MARKETING_NAV,
} from "./marketing-content";

describe("marketing content", () => {
  it("defines exactly three domains, each with three items", () => {
    expect(MARKETING_DOMAINS).toHaveLength(3);
    for (const d of MARKETING_DOMAINS) {
      expect(d.items).toHaveLength(3);
      expect(d.name.length).toBeGreaterThan(0);
    }
  });

  it("ties each domain to a distinct map color var", () => {
    const colors = MARKETING_DOMAINS.map((d) => d.colorVar);
    expect(new Set(colors).size).toBe(colors.length);
    for (const c of colors) expect(c.startsWith("--")).toBe(true);
  });

  it("points nav at the real app routes", () => {
    expect(MARKETING_NAV.map((n) => n.href)).toEqual([
      "/greenways",
      "/deals",
      "/parking",
      "/map",
    ]);
  });

  it("keeps hero copy free of staccato 'No X. No Y.' triads", () => {
    expect(MARKETING_COPY.heroSubhead).not.toMatch(/No\s+\w+\.\s+No\s+\w+\./i);
  });
});
