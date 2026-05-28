import { describe, expect, it } from "vitest";
import { AmenitySchema, AmenityPatchSchema, AmenityCategorySchema } from "./amenity";

const validAmenity = {
  slug: "veterans-park-tennis",
  name: "Veterans Park Tennis Courts",
  description: "Public tennis courts at Veterans Park.",
  center: { lat: 35.2431, lng: -80.8012 },
  category: "tennis" as const,
  photos: [],
  lastVerified: "2026-05-15",
};

describe("AmenityCategorySchema", () => {
  const validCategories = [
    "tennis",
    "pickleball",
    "disc-golf",
    "skatepark",
    "dog-park",
    "basketball",
    "farmers-market",
  ] as const;

  for (const cat of validCategories) {
    it(`accepts category '${cat}'`, () => {
      expect(AmenityCategorySchema.safeParse(cat).success).toBe(true);
    });
  }

  it("rejects unknown category", () => {
    expect(AmenityCategorySchema.safeParse("swimming-pool").success).toBe(false);
  });
});

describe("AmenitySchema", () => {
  it("accepts a valid amenity (no optional address)", () => {
    const result = AmenitySchema.safeParse(validAmenity);
    expect(result.success).toBe(true);
  });

  it("accepts amenity with optional address", () => {
    const result = AmenitySchema.safeParse({
      ...validAmenity,
      address: "1230 Cambridge Ave, Charlotte, NC 28203",
    });
    expect(result.success).toBe(true);
  });

  it("accepts amenity with photos", () => {
    const result = AmenitySchema.safeParse({
      ...validAmenity,
      photos: [
        { url: "https://example.com/court.jpg", caption: "Tennis court", attribution: "CLT Parks" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts farmers-market category", () => {
    const result = AmenitySchema.safeParse({ ...validAmenity, category: "farmers-market" });
    expect(result.success).toBe(true);
  });

  it("rejects unknown category", () => {
    const result = AmenitySchema.safeParse({ ...validAmenity, category: "gym" });
    expect(result.success).toBe(false);
  });

  it("rejects missing category", () => {
    const { category: _c, ...withoutCategory } = validAmenity;
    const result = AmenitySchema.safeParse(withoutCategory);
    expect(result.success).toBe(false);
  });

  it("rejects missing center", () => {
    const { center: _c, ...withoutCenter } = validAmenity;
    const result = AmenitySchema.safeParse(withoutCenter);
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    const result = AmenitySchema.safeParse({ ...validAmenity, slug: "Veterans Park" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed lastVerified", () => {
    const result = AmenitySchema.safeParse({ ...validAmenity, lastVerified: "tomorrow" });
    expect(result.success).toBe(false);
  });
});

describe("AmenityPatchSchema", () => {
  it("accepts partial patch with slug and category", () => {
    const result = AmenityPatchSchema.safeParse({
      slug: "veterans-park-tennis",
      category: "pickleball",
    });
    expect(result.success).toBe(true);
  });

  it("requires slug", () => {
    const result = AmenityPatchSchema.safeParse({ category: "basketball" });
    expect(result.success).toBe(false);
  });
});
