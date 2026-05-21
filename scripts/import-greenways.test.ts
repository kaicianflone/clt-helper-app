import { describe, expect, it } from "vitest";
import { transformOsmWay } from "./import-greenways";

const osmFeature = {
  type: "Feature" as const,
  properties: {
    "@id": "way/12345",
    name: "Little Sugar Creek Greenway",
    highway: "cycleway",
    surface: "paved",
  },
  geometry: {
    type: "LineString" as const,
    coordinates: [[-80.83, 35.19], [-80.84, 35.20]] as [number, number][],
  },
};

describe("transformOsmWay", () => {
  it("produces a slug from the way name", () => {
    const out = transformOsmWay(osmFeature, "2026-05-20");
    expect(out.slug).toBe("little-sugar-creek-greenway");
  });
  it("normalizes surface to paved/natural/mixed", () => {
    const out = transformOsmWay(osmFeature, "2026-05-20");
    expect(out.surface).toBe("paved");
  });
  it("estimates lengthMiles from LineString geometry", () => {
    const out = transformOsmWay(osmFeature, "2026-05-20");
    expect(out.lengthMiles).toBeGreaterThan(0);
  });
  it("derives at least one trailhead from the geometry start", () => {
    const out = transformOsmWay(osmFeature, "2026-05-20");
    expect(out.trailheads.length).toBeGreaterThanOrEqual(1);
    expect(out.trailheads[0].lat).toBe(35.19);
    expect(out.trailheads[0].lng).toBe(-80.83);
  });
});
