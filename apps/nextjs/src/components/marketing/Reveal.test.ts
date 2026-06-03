// apps/nextjs/src/components/marketing/Reveal.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "Reveal.tsx"), "utf-8");

describe("Reveal", () => {
  it("uses IntersectionObserver for scroll reveals", () => {
    expect(src).toContain("IntersectionObserver");
  });

  it("respects prefers-reduced-motion by showing immediately", () => {
    expect(src).toContain("prefers-reduced-motion: reduce");
    expect(src).toContain("setShown(true)");
  });
});
