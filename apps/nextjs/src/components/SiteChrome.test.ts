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
