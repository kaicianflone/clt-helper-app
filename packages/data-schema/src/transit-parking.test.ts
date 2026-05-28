import { describe, expect, it } from "vitest";
import { TransitParkingSchema, TransitParkingPatchSchema } from "./transit-parking";

const validTransitParking = {
  slug: "eastway-park-and-ride",
  name: "Eastway Park & Ride",
  description: "CATS park-and-ride facility near the Eastway station.",
  center: { lat: 35.2271, lng: -80.7801 },
  address: "3800 Eastway Dr, Charlotte, NC 28205",
  freeParking: true,
  photos: [],
  lastVerified: "2026-05-15",
};

describe("TransitParkingSchema", () => {
  it("accepts a valid transit parking location", () => {
    const result = TransitParkingSchema.safeParse(validTransitParking);
    expect(result.success).toBe(true);
  });

  it("accepts optional totalSpaces, permitRequired, and transitLines", () => {
    const result = TransitParkingSchema.safeParse({
      ...validTransitParking,
      totalSpaces: 300,
      permitRequired: false,
      transitLines: ["Gold Line", "Silver Line"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts with photos", () => {
    const result = TransitParkingSchema.safeParse({
      ...validTransitParking,
      photos: [
        { url: "https://example.com/lot.jpg", caption: "Parking lot", attribution: "CATS" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean freeParking", () => {
    const result = TransitParkingSchema.safeParse({ ...validTransitParking, freeParking: "yes" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    const result = TransitParkingSchema.safeParse({ ...validTransitParking, slug: "Eastway P&R" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed lastVerified", () => {
    const result = TransitParkingSchema.safeParse({ ...validTransitParking, lastVerified: "May 15" });
    expect(result.success).toBe(false);
  });
});

describe("TransitParkingPatchSchema", () => {
  it("accepts partial patch with slug and totalSpaces", () => {
    const result = TransitParkingPatchSchema.safeParse({
      slug: "eastway-park-and-ride",
      totalSpaces: 350,
    });
    expect(result.success).toBe(true);
  });

  it("requires slug", () => {
    const result = TransitParkingPatchSchema.safeParse({ totalSpaces: 350 });
    expect(result.success).toBe(false);
  });
});
