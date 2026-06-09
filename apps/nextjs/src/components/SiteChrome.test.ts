import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "SiteChrome.tsx"), "utf-8");

// The /map branch is everything from the pathname check up to the default
// chrome (uniquely marked by <SkipToContent>). We assert on this slice so the
// test reflects what the /map route actually renders, not merely what is
// imported into the file.
const mapBranchStart = src.indexOf('pathname === "/map"');
const mapBranch = src.slice(
  mapBranchStart,
  src.indexOf("SkipToContent", mapBranchStart),
);

describe("SiteChrome /map route", () => {
  it("special-cases the /map route", () => {
    expect(mapBranchStart).toBeGreaterThan(-1);
  });

  it("keeps the mobile tab bar on /map so mobile users can still navigate", () => {
    expect(mapBranch).toContain("BottomTabBar");
  });

  it("suppresses the desktop header and footer on /map (avoids page overflow)", () => {
    expect(mapBranch).not.toContain("SiteHeader");
    expect(mapBranch).not.toContain("footer");
  });
});

describe("SiteChrome default app chrome", () => {
  // The fixed BottomTabBar is `min-h-16` + `pb-[env(safe-area-inset-bottom)]`,
  // so its real height on notched devices is 4rem + the safe-area inset. The
  // main content's bottom padding must match, or the last content (e.g. the
  // /today nav tiles) sits under the bar on iOS. A flat `pb-16` is the bug.
  it("clears the tab bar including the safe-area inset on mobile", () => {
    expect(src).toContain("pb-[calc(4rem_+_env(safe-area-inset-bottom))]");
    expect(src).not.toMatch(/id="main-content"[^>]*pb-16(?!\d)/);
  });
});

describe("SiteChrome / marketing route", () => {
  const homeStart = src.indexOf('pathname === "/"');
  const homeBranch = src.slice(homeStart, src.indexOf("}", homeStart));

  it("special-cases the marketing landing at /", () => {
    expect(homeStart).toBeGreaterThan(-1);
  });

  it("renders no app chrome on / (marketing provides its own)", () => {
    expect(homeBranch).not.toContain("SiteHeader");
    expect(homeBranch).not.toContain("BottomTabBar");
  });
});
