import { describe, expect, it } from "vitest";
import { transformOsmWay, transformMeckFeature, isMeckFeature } from "./import-greenways";

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

// P2-7: Mecklenburg GIS field name transformer
const meckFeature = {
  type: "Feature" as const,
  properties: {
    OBJECTID: 1,
    TRAIL_NAME: "McMullen Creek Greenway",
    LENGTH_MI: "3.2",
    SURFACE: "paved asphalt",
  },
  geometry: {
    type: "LineString" as const,
    coordinates: [[-80.9, 35.1], [-80.91, 35.11]] as [number, number][],
  },
};

const meckFeatureNoLength = {
  type: "Feature" as const,
  properties: {
    OBJECTID: 2,
    TRAIL_NAME: "Unknown Length Trail",
    SURFACE: "gravel",
  },
  geometry: {
    type: "LineString" as const,
    coordinates: [[-80.9, 35.1], [-80.91, 35.11]] as [number, number][],
  },
};

describe("isMeckFeature", () => {
  it("detects a Meck GIS feature by OBJECTID", () => {
    expect(isMeckFeature(meckFeature)).toBe(true);
  });
  it("detects a Meck GIS feature by TRAIL_NAME", () => {
    expect(isMeckFeature({ ...osmFeature, properties: { TRAIL_NAME: "x" } })).toBe(true);
  });
  it("returns false for an OSM feature", () => {
    expect(isMeckFeature(osmFeature)).toBe(false);
  });
});

describe("transformMeckFeature", () => {
  it("reads TRAIL_NAME for the trail name and slug", () => {
    const out = transformMeckFeature(meckFeature, "2026-05-20");
    expect(out.name).toBe("McMullen Creek Greenway");
    expect(out.slug).toBe("mcmullen-creek-greenway");
  });

  it("reads LENGTH_MI for the length", () => {
    const out = transformMeckFeature(meckFeature, "2026-05-20");
    expect(out.lengthMiles).toBe(3.2);
  });

  it("derives length from geometry when LENGTH_MI is absent", () => {
    const out = transformMeckFeature(meckFeatureNoLength, "2026-05-20");
    expect(out.lengthMiles).toBeGreaterThan(0);
  });

  it("normalizes SURFACE field", () => {
    const out = transformMeckFeature(meckFeature, "2026-05-20");
    expect(out.surface).toBe("paved");
  });

  it("defaults surface to mixed when SURFACE is absent", () => {
    const feature = {
      ...meckFeature,
      properties: { OBJECTID: 3, TRAIL_NAME: "Mystery Trail" },
    };
    const out = transformMeckFeature(feature, "2026-05-20");
    expect(out.surface).toBe("mixed");
  });

  it("sets the correct lastVerified", () => {
    const out = transformMeckFeature(meckFeature, "2026-01-15");
    expect(out.lastVerified).toBe("2026-01-15");
  });
});
