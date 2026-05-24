import { describe, expect, it } from "vitest";
import { ParkingLotSchema, ParkingLotPatchSchema } from "./parking";

const validHours = {
  mon: { open: "07:00", close: "22:00" },
  tue: { open: "07:00", close: "22:00" },
  wed: { open: "07:00", close: "22:00" },
  thu: { open: "07:00", close: "22:00" },
  fri: { open: "07:00", close: "23:00" },
  sat: "24h" as const,
  sun: "closed" as const,
};

const validLot = {
  slug: "7th-st-station-deck",
  name: "7th Street Station Deck",
  address: "300 E 7th St, Charlotte, NC 28202",
  latLng: [-80.8394, 35.2271] as [number, number],
  hourlyRate: 2.0,
  dailyMax: 15.0,
  hours: validHours,
  paymentMethods: ["card", "app"],
  covered: true,
  operator: "Charlotte Center City Partners",
  lastVerified: "2026-05-15",
};

describe("ParkingLotSchema", () => {
  it("accepts a valid lot", () => {
    const result = ParkingLotSchema.safeParse(validLot);
    expect(result.success).toBe(true);
  });

  it("accepts '24h' for a day hours value", () => {
    const result = ParkingLotSchema.safeParse({
      ...validLot,
      hours: { ...validHours, sat: "24h" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts 'closed' for a day hours value", () => {
    const result = ParkingLotSchema.safeParse({
      ...validLot,
      hours: { ...validHours, sun: "closed" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts null hourlyRate", () => {
    const result = ParkingLotSchema.safeParse({
      ...validLot,
      hourlyRate: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null dailyMax", () => {
    const result = ParkingLotSchema.safeParse({
      ...validLot,
      dailyMax: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown payment method", () => {
    const result = ParkingLotSchema.safeParse({
      ...validLot,
      paymentMethods: ["bitcoin"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty paymentMethods array", () => {
    const result = ParkingLotSchema.safeParse({
      ...validLot,
      paymentMethods: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts lot without optional operator", () => {
    const { operator: _op, ...withoutOp } = validLot;
    const result = ParkingLotSchema.safeParse(withoutOp);
    expect(result.success).toBe(true);
  });

  it("rejects malformed HH:MM time in hours (e.g. '7am')", () => {
    const result = ParkingLotSchema.safeParse({
      ...validLot,
      hours: {
        ...validHours,
        mon: { open: "7am", close: "22:00" },
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid day hours object (missing close)", () => {
    const result = ParkingLotSchema.safeParse({
      ...validLot,
      hours: {
        ...validHours,
        mon: { open: "07:00" },
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean covered", () => {
    const result = ParkingLotSchema.safeParse({
      ...validLot,
      covered: "yes",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional totalSpaces and zoneNumbers", () => {
    const result = ParkingLotSchema.safeParse({
      ...validLot,
      totalSpaces: 30,
      zoneNumbers: ["2238", "2251"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts lot without totalSpaces and zoneNumbers", () => {
    const result = ParkingLotSchema.safeParse(validLot);
    expect(result.success).toBe(true);
  });
});

describe("ParkingLotPatchSchema", () => {
  it("accepts partial patch with only slug and hourlyRate", () => {
    const result = ParkingLotPatchSchema.safeParse({
      slug: "7th-st-station-deck",
      hourlyRate: 3.0,
    });
    expect(result.success).toBe(true);
  });

  it("requires slug", () => {
    const result = ParkingLotPatchSchema.safeParse({
      hourlyRate: 3.0,
    });
    expect(result.success).toBe(false);
  });
});
