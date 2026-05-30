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
  it("fills the full dynamic viewport height on desktop", () => {
    expect(src).toMatch(/md:h-\[100dvh\]/);
  });

  it("reserves room for the mobile tab bar so map controls aren't hidden", () => {
    // The BottomTabBar (fixed, md:hidden, 4rem tall) overlays the map on
    // mobile; offsetting the map keeps MapLibre's bottom attribution visible.
    expect(src).toMatch(/h-\[calc\(100dvh\s*-\s*4rem\)\]/);
  });

  it("does not use the legacy md:h-screen height", () => {
    expect(src).not.toContain("md:h-screen");
  });
});
