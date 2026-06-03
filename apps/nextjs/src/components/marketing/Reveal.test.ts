import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "Reveal.tsx"), "utf-8");

describe("Reveal", () => {
  it("uses IntersectionObserver for scroll reveals", () => {
    expect(src).toContain("IntersectionObserver");
  });

  it("respects prefers-reduced-motion", () => {
    expect(src).toContain("prefers-reduced-motion: reduce");
  });

  it("is visible by default (progressive enhancement): only animates when IO is supported", () => {
    expect(src).toContain('typeof IntersectionObserver === "undefined"');
    expect(src).toContain("setAnimate(true)");
  });
});
