import { describe, expect, it } from "vitest";
import { RecyclingSchema, RecyclingPatchSchema } from "./recycling";

const validRecycling = {
  slug: "plaza-midwood-dropoff",
  name: "Plaza Midwood Recycling Drop-Off",
  description: "Community recycling drop-off point near Plaza Midwood.",
  center: { lat: 35.2195, lng: -80.8132 },
  address: "2101 Central Ave, Charlotte, NC 28205",
  acceptedMaterials: ["cardboard", "plastic", "glass", "metal"],
  photos: [],
  lastVerified: "2026-05-15",
};

describe("RecyclingSchema", () => {
  it("accepts a valid recycling location", () => {
    const result = RecyclingSchema.safeParse(validRecycling);
    expect(result.success).toBe(true);
  });

  it("accepts optional hoursNotes", () => {
    const result = RecyclingSchema.safeParse({
      ...validRecycling,
      hoursNotes: "Mon–Sat 7am–7pm",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a recycling location with photos", () => {
    const result = RecyclingSchema.safeParse({
      ...validRecycling,
      photos: [
        { url: "https://example.com/recycling.jpg", caption: "Bins", attribution: "CLT" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty acceptedMaterials", () => {
    const result = RecyclingSchema.safeParse({ ...validRecycling, acceptedMaterials: [] });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    const result = RecyclingSchema.safeParse({ ...validRecycling, slug: "Plaza Midwood" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed lastVerified", () => {
    const result = RecyclingSchema.safeParse({ ...validRecycling, lastVerified: "2026/05/15" });
    expect(result.success).toBe(false);
  });
});

describe("RecyclingPatchSchema", () => {
  it("accepts partial patch with only slug and hoursNotes", () => {
    const result = RecyclingPatchSchema.safeParse({
      slug: "plaza-midwood-dropoff",
      hoursNotes: "Updated hours",
    });
    expect(result.success).toBe(true);
  });

  it("requires slug", () => {
    const result = RecyclingPatchSchema.safeParse({ hoursNotes: "Updated hours" });
    expect(result.success).toBe(false);
  });
});
