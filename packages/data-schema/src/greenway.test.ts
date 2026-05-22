import { describe, expect, it } from "vitest";
import { GreenwaySchema, GreenwayGeometry } from "./greenway";

const validLineStringGreenway = {
  slug: "little-sugar-creek",
  name: "Little Sugar Creek Greenway",
  description: "A scenic multi-use trail along Little Sugar Creek.",
  lengthMiles: 11.2,
  surface: "paved" as const,
  trailheads: [
    { lat: 35.2271, lng: -80.8431, name: "Midtown Park Trailhead", parkingNotes: "Free lot" },
  ],
  geometry: {
    type: "LineString" as const,
    coordinates: [
      [-80.8431, 35.2271],
      [-80.8415, 35.2301],
      [-80.8400, 35.2340],
    ],
  },
  pointsOfInterest: [
    { lat: 35.228, lng: -80.842, name: "Restroom near Midtown", kind: "restroom" as const },
  ],
  photos: [
    {
      url: "https://example.com/photo.jpg",
      caption: "Trail in spring",
      attribution: "Jane Doe",
    },
  ],
  lastVerified: "2026-05-15",
};

const validMultiLineStringGreenway = {
  ...validLineStringGreenway,
  slug: "briar-creek",
  name: "Briar Creek Greenway",
  geometry: {
    type: "MultiLineString" as const,
    coordinates: [
      [
        [-80.82, 35.21],
        [-80.819, 35.215],
      ],
      [
        [-80.818, 35.22],
        [-80.817, 35.225],
        [-80.816, 35.23],
      ],
    ],
  },
};

describe("GreenwaySchema", () => {
  it("accepts a valid full-shape entry with LineString geometry", () => {
    const result = GreenwaySchema.safeParse(validLineStringGreenway);
    expect(result.success).toBe(true);
  });

  it("accepts a valid full-shape entry with MultiLineString geometry", () => {
    const result = GreenwaySchema.safeParse(validMultiLineStringGreenway);
    expect(result.success).toBe(true);
  });

  it("rejects empty trailheads array", () => {
    const result = GreenwaySchema.safeParse({
      ...validLineStringGreenway,
      trailheads: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/at least one trailhead required/);
    }
  });

  it("rejects unknown surface value", () => {
    const result = GreenwaySchema.safeParse({
      ...validLineStringGreenway,
      surface: "gravel",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed lastVerified (e.g. 'yesterday')", () => {
    const result = GreenwaySchema.safeParse({
      ...validLineStringGreenway,
      lastVerified: "yesterday",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/YYYY-MM-DD/);
    }
  });

  it("rejects invalid geometry type (Point)", () => {
    const result = GreenwaySchema.safeParse({
      ...validLineStringGreenway,
      geometry: {
        type: "Point",
        coordinates: [-80.84, 35.22],
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("GreenwayGeometry", () => {
  it("accepts LineString with 2+ coordinates", () => {
    const result = GreenwayGeometry.safeParse({
      type: "LineString",
      coordinates: [
        [-80.84, 35.22],
        [-80.83, 35.23],
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects LineString with fewer than 2 coordinates", () => {
    const result = GreenwayGeometry.safeParse({
      type: "LineString",
      coordinates: [[-80.84, 35.22]],
    });
    expect(result.success).toBe(false);
  });

  it("accepts MultiLineString with 1+ segments each having 2+ coords", () => {
    const result = GreenwayGeometry.safeParse({
      type: "MultiLineString",
      coordinates: [
        [
          [-80.84, 35.22],
          [-80.83, 35.23],
        ],
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects MultiLineString with empty segments array", () => {
    const result = GreenwayGeometry.safeParse({
      type: "MultiLineString",
      coordinates: [],
    });
    expect(result.success).toBe(false);
  });
});
