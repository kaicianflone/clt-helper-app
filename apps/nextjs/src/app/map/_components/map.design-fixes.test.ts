import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "map.tsx"), "utf-8");

describe("map popup keyboard accessibility", () => {
  it("defines a focusPopup helper", () => {
    expect(src).toContain("const focusPopup");
  });

  it("focuses the first link inside the popup after adding to map", () => {
    expect(src).toMatch(/querySelector.*\ba\b.*\bbutton\b/);
    expect(src).toContain(".focus()");
  });

  it("labels the popup close button for screen readers", () => {
    expect(src).toContain('aria-label", "Close popup"');
  });

  it("calls focusPopup after each popup.addTo(map)", () => {
    const addToCount = (src.match(/\.addTo\(map\)/g) ?? []).length;
    const focusCount = (src.match(/focusPopup\(popup\)/g) ?? []).length;
    expect(addToCount).toBeGreaterThanOrEqual(3);
    expect(focusCount).toBe(addToCount);
  });
});

describe("map container mobile height", () => {
  it("fills the full dynamic viewport height", () => {
    expect(src).toMatch(/h-\[100dvh\]/);
  });

  it("does not subtract a 4rem tab-bar offset (chrome-less /map route)", () => {
    expect(src).not.toMatch(/calc\(100dvh\s*-\s*4rem\)/);
    expect(src).not.toContain("md:h-screen");
  });
});
