import { describe, expect, it } from "vitest";
import { ParkSchema, ParkPatchSchema } from "./park";

const validPark = {
  slug: "freedom-park",
  name: "Freedom Park",
  description: "A popular Charlotte park along the Little Sugar Creek Greenway.",
  center: { lat: 35.2058, lng: -80.8434 },
  photos: [],
  lastVerified: "2026-05-15",
};

describe("ParkSchema", () => {
  it("accepts a minimal valid park (no optional fields)", () => {
    const result = ParkSchema.safeParse(validPark);
    expect(result.success).toBe(true);
  });

  it("accepts a park with Polygon boundary", () => {
    const result = ParkSchema.safeParse({
      ...validPark,
      boundary: {
        type: "Polygon",
        coordinates: [
          [
            [-80.845, 35.205],
            [-80.842, 35.205],
            [-80.842, 35.208],
            [-80.845, 35.208],
            [-80.845, 35.205],
          ],
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a park with MultiPolygon boundary", () => {
    const ring = [
      [-80.845, 35.205],
      [-80.842, 35.205],
      [-80.842, 35.208],
      [-80.845, 35.208],
      [-80.845, 35.205],
    ];
    const result = ParkSchema.safeParse({
      ...validPark,
      boundary: {
        type: "MultiPolygon",
        coordinates: [[ring]],
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a park with numParking, parkUrl, and amenities", () => {
    const result = ParkSchema.safeParse({
      ...validPark,
      numParking: 150,
      parkUrl: "https://cltparks.gov/freedom-park",
      amenities: {
        tennis: true,
        pickleball: false,
        discGolf: false,
        skatepark: false,
        dogPark: true,
        basketball: true,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a park with photos", () => {
    const result = ParkSchema.safeParse({
      ...validPark,
      photos: [
        { url: "https://example.com/park.jpg", caption: "Entrance", attribution: "City of CLT" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing center", () => {
    const { center: _c, ...withoutCenter } = validPark;
    const result = ParkSchema.safeParse(withoutCenter);
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug (uppercase)", () => {
    const result = ParkSchema.safeParse({ ...validPark, slug: "Freedom-Park" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed lastVerified", () => {
    const result = ParkSchema.safeParse({ ...validPark, lastVerified: "05/15/2026" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid parkUrl", () => {
    const result = ParkSchema.safeParse({ ...validPark, parkUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

describe("ParkPatchSchema", () => {
  it("accepts partial patch with only slug and numParking", () => {
    const result = ParkPatchSchema.safeParse({ slug: "freedom-park", numParking: 200 });
    expect(result.success).toBe(true);
  });

  it("requires slug", () => {
    const result = ParkPatchSchema.safeParse({ numParking: 200 });
    expect(result.success).toBe(false);
  });
});
