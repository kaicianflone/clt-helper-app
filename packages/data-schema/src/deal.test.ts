import { describe, expect, it } from "vitest";
import { DealSchema, DealPatchSchema } from "./deal";

const validDeal = {
  slug: "common-market-tue-wine",
  restaurantName: "Common Market",
  restaurantAddress: "2007 Commonwealth Ave, Charlotte, NC 28205",
  restaurantLatLng: [-80.8132, 35.2195] as [number, number],
  daysOfWeek: ["tue"],
  timeWindow: { start: "17:00", end: "22:00" },
  dealDescription: "Half off all wine bottles on Tuesdays",
  link: "https://commonmarketclt.com/deals",
  lastVerified: "2026-05-15",
};

describe("DealSchema", () => {
  it("accepts a valid deal", () => {
    const result = DealSchema.safeParse(validDeal);
    expect(result.success).toBe(true);
  });

  it("accepts 'all-day' timeWindow", () => {
    const result = DealSchema.safeParse({
      ...validDeal,
      slug: "rhino-market-all-day",
      timeWindow: "all-day",
    });
    expect(result.success).toBe(true);
  });

  it("rejects malformed time (e.g. '9am')", () => {
    const result = DealSchema.safeParse({
      ...validDeal,
      timeWindow: { start: "9am", end: "21:00" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid end time (e.g. '25:00')", () => {
    const result = DealSchema.safeParse({
      ...validDeal,
      timeWindow: { start: "09:00", end: "25:00" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty daysOfWeek array", () => {
    const result = DealSchema.safeParse({
      ...validDeal,
      daysOfWeek: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid day abbreviation", () => {
    const result = DealSchema.safeParse({
      ...validDeal,
      daysOfWeek: ["monday"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts deal without optional link", () => {
    const { link: _link, ...withoutLink } = validDeal;
    const result = DealSchema.safeParse(withoutLink);
    expect(result.success).toBe(true);
  });

  it("rejects invalid link URL", () => {
    const result = DealSchema.safeParse({
      ...validDeal,
      link: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed lastVerified", () => {
    const result = DealSchema.safeParse({
      ...validDeal,
      lastVerified: "05/15/2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("DealPatchSchema", () => {
  it("accepts a partial patch with only slug and description", () => {
    const result = DealPatchSchema.safeParse({
      slug: "common-market-tue-wine",
      dealDescription: "Updated: 40% off wine on Tuesdays",
    });
    expect(result.success).toBe(true);
  });

  it("requires slug", () => {
    const result = DealPatchSchema.safeParse({
      dealDescription: "Updated description",
    });
    expect(result.success).toBe(false);
  });
});
