import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchMeckOpenData,
  fetchMeckRest,
  groupByTrailName,
  isMeckFeature,
  normalizeName,
  transformMeckFeature,
  transformOsmWay,
} from "./import-greenways";

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
    coordinates: [
      [-80.83, 35.19],
      [-80.84, 35.2],
    ] as [number, number][],
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
    expect(out.trailheads[0]!.lat).toBe(35.19);
    expect(out.trailheads[0]!.lng).toBe(-80.83);
  });
});

/* ----- Uppercase fixtures (legacy schema, kept for back-compat) ---------- */

const meckFeatureUpper = {
  type: "Feature" as const,
  properties: {
    OBJECTID: 1,
    TRAIL_NAME: "McMullen Creek Greenway",
    LENGTH_MI: "3.2",
    SURFACE: "paved asphalt",
  },
  geometry: {
    type: "LineString" as const,
    coordinates: [
      [-80.9, 35.1],
      [-80.91, 35.11],
    ] as [number, number][],
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
    coordinates: [
      [-80.9, 35.1],
      [-80.91, 35.11],
    ] as [number, number][],
  },
};

/* ----- Lowercase fixtures (live endpoint as of 2026-05-21) --------------- */

const meckFeatureLower = {
  type: "Feature" as const,
  properties: {
    objectid: 1,
    trail_name: "Little Sugar Creek Greenway",
    miles: 0.5,
    trail_surf: "Asphalt",
    surfgen: "Paved",
    trl_status: "Active",
  },
  geometry: {
    type: "LineString" as const,
    coordinates: [
      [-80.84, 35.22],
      [-80.85, 35.23],
    ] as [number, number][],
  },
};

describe("normalizeName", () => {
  it("collapses internal whitespace", () => {
    expect(normalizeName("Foo  Trail")).toBe("Foo Trail");
  });
  it("trims leading and trailing whitespace", () => {
    expect(normalizeName("  Bar Greenway  ")).toBe("Bar Greenway");
  });
});

describe("isMeckFeature", () => {
  it("detects uppercase OBJECTID", () => {
    expect(isMeckFeature(meckFeatureUpper)).toBe(true);
  });
  it("detects uppercase TRAIL_NAME", () => {
    expect(
      isMeckFeature({ ...osmFeature, properties: { TRAIL_NAME: "x" } }),
    ).toBe(true);
  });
  it("detects lowercase trail_name", () => {
    expect(isMeckFeature(meckFeatureLower)).toBe(true);
  });
  it("detects lowercase miles field", () => {
    expect(
      isMeckFeature({ ...osmFeature, properties: { miles: 1.2 } }),
    ).toBe(true);
  });
  it("returns false for an OSM feature", () => {
    expect(isMeckFeature(osmFeature)).toBe(false);
  });
});

describe("transformMeckFeature — uppercase (legacy)", () => {
  it("reads TRAIL_NAME for name and slug", () => {
    const out = transformMeckFeature(meckFeatureUpper, "2026-05-20");
    expect(out.name).toBe("McMullen Creek Greenway");
    expect(out.slug).toBe("mcmullen-creek-greenway");
  });

  it("reads LENGTH_MI for length", () => {
    const out = transformMeckFeature(meckFeatureUpper, "2026-05-20");
    expect(out.lengthMiles).toBe(3.2);
  });

  it("falls back to geometry length when LENGTH_MI is absent", () => {
    const out = transformMeckFeature(meckFeatureNoLength, "2026-05-20");
    expect(out.lengthMiles).toBeGreaterThan(0);
  });

  it("normalizes SURFACE field", () => {
    const out = transformMeckFeature(meckFeatureUpper, "2026-05-20");
    expect(out.surface).toBe("paved");
  });

  it("defaults surface to mixed when SURFACE is absent", () => {
    const feature = {
      ...meckFeatureUpper,
      properties: { OBJECTID: 3, TRAIL_NAME: "Mystery Trail" },
    };
    const out = transformMeckFeature(feature, "2026-05-20");
    expect(out.surface).toBe("mixed");
  });

  it("sets lastVerified", () => {
    const out = transformMeckFeature(meckFeatureUpper, "2026-01-15");
    expect(out.lastVerified).toBe("2026-01-15");
  });
});

describe("transformMeckFeature — lowercase (live endpoint)", () => {
  it("reads lowercase trail_name", () => {
    const out = transformMeckFeature(meckFeatureLower, "2026-05-21");
    expect(out.name).toBe("Little Sugar Creek Greenway");
    expect(out.slug).toBe("little-sugar-creek-greenway");
  });

  it("reads lowercase miles for length", () => {
    const out = transformMeckFeature(meckFeatureLower, "2026-05-21");
    expect(out.lengthMiles).toBe(0.5);
  });

  it("maps surfgen=Paved to paved", () => {
    const out = transformMeckFeature(meckFeatureLower, "2026-05-21");
    expect(out.surface).toBe("paved");
  });

  it("maps surfgen=Natural to natural", () => {
    const feature = {
      ...meckFeatureLower,
      properties: { ...meckFeatureLower.properties, surfgen: "Natural" },
    };
    const out = transformMeckFeature(feature, "2026-05-21");
    expect(out.surface).toBe("natural");
  });

  it("normalizes whitespace in trail_name", () => {
    const feature = {
      ...meckFeatureLower,
      properties: {
        ...meckFeatureLower.properties,
        trail_name: "  Little  Sugar  Creek  Greenway  ",
      },
    };
    const out = transformMeckFeature(feature, "2026-05-21");
    expect(out.name).toBe("Little Sugar Creek Greenway");
    expect(out.slug).toBe("little-sugar-creek-greenway");
  });
});

/* ----- groupByTrailName ---------------------------------------------------- */

const seg = (
  trailName: string,
  coords: [number, number][],
  extra: Record<string, unknown> = {},
) => ({
  type: "Feature" as const,
  properties: {
    objectid: 0,
    trail_name: trailName,
    trl_status: "Active",
    surfgen: "Paved",
    miles: 0.1,
    ...extra,
  },
  geometry: {
    type: "LineString" as const,
    coordinates: coords,
  },
});

describe("groupByTrailName", () => {
  it("emits MultiLineString with one element per source segment (no concat)", () => {
    const features = [
      seg("Foo Greenway", [
        [-80.84, 35.22],
        [-80.85, 35.23],
      ]),
      seg("Foo Greenway", [
        [-80.86, 35.24],
        [-80.87, 35.25],
      ]),
      seg("Foo Greenway", [
        [-80.88, 35.26],
        [-80.89, 35.27],
      ]),
    ];
    const out = groupByTrailName(features, "2026-05-21");
    expect(out).toHaveLength(1);
    expect(out[0]!.geometry.type).toBe("MultiLineString");
    if (out[0]!.geometry.type !== "MultiLineString") throw new Error("unreachable");
    expect(out[0]!.geometry.coordinates).toHaveLength(3);
    expect(out[0]!.geometry.coordinates[0]).toHaveLength(2);
  });

  it("sums per-segment miles", () => {
    const features = [
      seg("Foo Greenway", [
        [-80.84, 35.22],
        [-80.85, 35.23],
      ], { miles: 1.5 }),
      seg("Foo Greenway", [
        [-80.86, 35.24],
        [-80.87, 35.25],
      ], { miles: 2.5 }),
    ];
    const out = groupByTrailName(features, "2026-05-21");
    expect(out[0]!.lengthMiles).toBeCloseTo(4.0, 1);
  });

  it("falls back to haversine when miles is null/undefined/NaN", () => {
    const features = [
      seg("Bar Greenway", [
        [-80.84, 35.22],
        [-80.85, 35.23],
      ], { miles: null }),
    ];
    const out = groupByTrailName(features, "2026-05-21");
    expect(out[0]!.lengthMiles).toBeGreaterThan(0);
  });

  it("collapses trail_name whitespace variants into one group", () => {
    const features = [
      seg("Foo Greenway", [
        [-80.84, 35.22],
        [-80.85, 35.23],
      ]),
      seg("Foo Greenway ", [
        [-80.86, 35.24],
        [-80.87, 35.25],
      ]),
      seg("  Foo  Greenway  ", [
        [-80.88, 35.26],
        [-80.89, 35.27],
      ]),
    ];
    const out = groupByTrailName(features, "2026-05-21");
    expect(out).toHaveLength(1);
    expect(out[0]!.name).toBe("Foo Greenway");
  });

  it("drops segment-boundary duplicate vertex when source segment has >2 coords", () => {
    // The earlier segment must have >2 coords so dedup leaves a valid LineString
    // (min 2 coords). For 2-coord segments we skip dedup — schema would reject
    // a 1-coord LineString.
    const features = [
      seg("Boundary Trail", [
        [-80.84, 35.22],
        [-80.845, 35.225],
        [-80.85, 35.23],
      ]),
      seg("Boundary Trail", [
        [-80.85, 35.23], // duplicate of previous end
        [-80.86, 35.24],
      ]),
    ];
    const out = groupByTrailName(features, "2026-05-21");
    expect(out).toHaveLength(1);
    if (out[0]!.geometry.type !== "MultiLineString") throw new Error("unreachable");
    const totalCoords = out[0]!.geometry.coordinates.reduce(
      (sum, line) => sum + line.length,
      0,
    );
    // Originally 3+2=5; after dedup of seg1's last vertex: 2+2=4.
    expect(totalCoords).toBe(4);
  });

  it("skips dedup when earlier segment would drop below 2 coords", () => {
    const features = [
      seg("Edge Trail", [
        [-80.84, 35.22],
        [-80.85, 35.23],
      ]),
      seg("Edge Trail", [
        [-80.85, 35.23],
        [-80.86, 35.24],
      ]),
    ];
    const out = groupByTrailName(features, "2026-05-21");
    expect(out).toHaveLength(1);
    if (out[0]!.geometry.type !== "MultiLineString") throw new Error("unreachable");
    expect(out[0]!.geometry.coordinates).toHaveLength(2);
    // Each segment kept as-is (2 coords each), no dedup.
    expect(out[0]!.geometry.coordinates[0]).toHaveLength(2);
    expect(out[0]!.geometry.coordinates[1]).toHaveLength(2);
  });

  it("rejects segments with coords outside Mecklenburg bbox", () => {
    const features = [
      seg("Foo Greenway", [
        [-80.84, 35.22],
        [-80.85, 35.23],
      ]),
      seg("Foo Greenway", [
        [-95.0, 30.0], // way outside Mecklenburg
        [-95.1, 30.1],
      ]),
    ];
    const out = groupByTrailName(features, "2026-05-21");
    expect(out).toHaveLength(1);
    if (out[0]!.geometry.type !== "MultiLineString") throw new Error("unreachable");
    expect(out[0]!.geometry.coordinates).toHaveLength(1);
  });

  it("rejects segments exceeding the vertex cap", () => {
    const longCoords: [number, number][] = [];
    for (let i = 0; i < 10_001; i++) {
      longCoords.push([-80.85 + i * 1e-6, 35.22 + i * 1e-6]);
    }
    const features = [
      seg("Foo Greenway", [
        [-80.84, 35.22],
        [-80.85, 35.23],
      ]),
      seg("Foo Greenway", longCoords),
    ];
    const out = groupByTrailName(features, "2026-05-21");
    if (out[0]!.geometry.type !== "MultiLineString") throw new Error("unreachable");
    expect(out[0]!.geometry.coordinates).toHaveLength(1);
  });

  it("filters out segments shorter than 2 coords", () => {
    const features = [
      seg("Tiny Trail", [
        [-80.84, 35.22],
      ]),
    ];
    const out = groupByTrailName(features, "2026-05-21");
    expect(out).toHaveLength(0);
  });
});

/* ----- fetchers ----------------------------------------------------------- */

describe("fetchMeckRest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when response has fewer than MIN_EXPECTED_FEATURES", async () => {
    const fakeFetch = vi.fn(async () =>
      new Response(JSON.stringify({ type: "FeatureCollection", features: [] }), {
        status: 200,
      }),
    );
    await expect(fetchMeckRest(fakeFetch as unknown as typeof fetch)).rejects.toThrow(
      /MIN_EXPECTED_FEATURES|features returned/,
    );
  });

  it("throws when response is missing features array (HTTP 200 + error body)", async () => {
    const fakeFetch = vi.fn(async () =>
      new Response(JSON.stringify({ error: "rate limit" }), { status: 200 }),
    );
    await expect(fetchMeckRest(fakeFetch as unknown as typeof fetch)).rejects.toThrow(
      /expected features array/,
    );
  });

  it("paginates when a full page is returned", async () => {
    const fullPage = Array.from({ length: 2000 }, (_, i) => ({
      type: "Feature" as const,
      properties: { objectid: i + 1, trail_name: `Trail ${i}`, trl_status: "Active" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-80.84, 35.22],
          [-80.85, 35.23],
        ] as [number, number][],
      },
    }));
    let call = 0;
    const fakeFetch = vi.fn(async () => {
      call++;
      if (call === 1) {
        return new Response(
          JSON.stringify({ type: "FeatureCollection", features: fullPage }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({
          type: "FeatureCollection",
          features: fullPage.slice(0, 500),
        }),
        { status: 200 },
      );
    });
    const out = await fetchMeckRest(fakeFetch as unknown as typeof fetch);
    expect(out).toHaveLength(2500);
    expect(call).toBe(2);
  });
});

describe("fetchMeckOpenData", () => {
  it("filters to trl_status=Active", async () => {
    const features = [
      {
        type: "Feature" as const,
        properties: { trail_name: "Active Trail", trl_status: "Active" },
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [-80.84, 35.22],
            [-80.85, 35.23],
          ] as [number, number][],
        },
      },
      {
        type: "Feature" as const,
        properties: { trail_name: "Planned Trail", trl_status: "Planned" },
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [-80.84, 35.22],
            [-80.85, 35.23],
          ] as [number, number][],
        },
      },
    ];
    // Pad to meet MIN_EXPECTED_FEATURES
    while (features.length < 15) {
      features.push({
        type: "Feature" as const,
        properties: { trail_name: `Filler ${features.length}`, trl_status: "Active" },
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [-80.84, 35.22],
            [-80.85, 35.23],
          ] as [number, number][],
        },
      });
    }
    const fakeFetch = vi.fn(async () =>
      new Response(JSON.stringify({ type: "FeatureCollection", features }), {
        status: 200,
      }),
    );
    const out = await fetchMeckOpenData(fakeFetch as unknown as typeof fetch);
    expect(out.every((f) => f.properties["trl_status"] === "Active")).toBe(true);
    expect(out.find((f) => f.properties["trail_name"] === "Planned Trail")).toBeUndefined();
  });
});
