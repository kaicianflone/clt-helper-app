import { describe, expect, it } from "vitest";
import { LandfillSchema, LandfillPatchSchema } from "./landfill";

const validLandfill = {
  slug: "foxhole-landfill",
  name: "Foxhole Landfill",
  description: "Mecklenburg County solid waste facility.",
  center: { lat: 35.1812, lng: -80.7834 },
  address: "6700 Foxhole Rd, Charlotte, NC 28212",
  status: "open" as const,
  photos: [],
  lastVerified: "2026-05-15",
};

describe("LandfillSchema", () => {
  it("accepts a valid open landfill", () => {
    const result = LandfillSchema.safeParse(validLandfill);
    expect(result.success).toBe(true);
  });

  it("accepts status 'closed'", () => {
    const result = LandfillSchema.safeParse({ ...validLandfill, status: "closed" });
    expect(result.success).toBe(true);
  });

  it("accepts optional acceptedMaterials and hoursNotes", () => {
    const result = LandfillSchema.safeParse({
      ...validLandfill,
      acceptedMaterials: ["household waste", "construction debris"],
      hoursNotes: "Mon–Sat 7am–5pm",
    });
    expect(result.success).toBe(true);
  });

  it("accepts with photos", () => {
    const result = LandfillSchema.safeParse({
      ...validLandfill,
      photos: [
        { url: "https://example.com/landfill.jpg", caption: "Entrance gate", attribution: "CLT" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status value", () => {
    const result = LandfillSchema.safeParse({ ...validLandfill, status: "inactive" });
    expect(result.success).toBe(false);
  });

  it("rejects missing status", () => {
    const { status: _s, ...withoutStatus } = validLandfill;
    const result = LandfillSchema.safeParse(withoutStatus);
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    const result = LandfillSchema.safeParse({ ...validLandfill, slug: "Foxhole Landfill" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed lastVerified", () => {
    const result = LandfillSchema.safeParse({ ...validLandfill, lastVerified: "not-a-date" });
    expect(result.success).toBe(false);
  });
});

describe("LandfillPatchSchema", () => {
  it("accepts partial patch with slug and status", () => {
    const result = LandfillPatchSchema.safeParse({ slug: "foxhole-landfill", status: "closed" });
    expect(result.success).toBe(true);
  });

  it("requires slug", () => {
    const result = LandfillPatchSchema.safeParse({ status: "closed" });
    expect(result.success).toBe(false);
  });
});
