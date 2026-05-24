import { describe, expect, it, vi } from "vitest";

import type { Context } from "../trpc";
import { appRouter } from "../root";

describe("activity router", () => {
  const baseCtx: Context = { baseUrl: "https://cdn.example.com" };

  const makeBundle = (entries: unknown[]) =>
    new Response(JSON.stringify({ schemaVersion: 1, builtAt: "", entries }));

  const greenway = {
    slug: "mallard-creek",
    name: "Mallard Creek Greenway",
    description: "",
    lengthMiles: 3.2,
    surface: "paved",
    trailheads: [{ name: "x", lat: 0, lng: 0 }],
    geometry: {
      type: "LineString",
      coordinates: [
        [0, 0],
        [1, 1],
      ],
    },
    pointsOfInterest: [],
    photos: [],
    lastVerified: "2026-05-10",
  };

  const deal1 = {
    slug: "suffolk-punch-trivia",
    restaurantName: "Suffolk Punch South End",
    restaurantAddress: "2920 Griffith St, Charlotte, NC 28203",
    restaurantLatLng: [35.213, -80.8565],
    daysOfWeek: ["mon"],
    timeWindow: "all-day",
    dealDescription: "Trivia night at 7 PM",
    lastVerified: "2026-05-24",
  };

  const deal2 = {
    slug: "suffolk-punch-3-beers",
    restaurantName: "Suffolk Punch South End",
    restaurantAddress: "2920 Griffith St, Charlotte, NC 28203",
    restaurantLatLng: [35.213, -80.8565],
    daysOfWeek: ["thu"],
    timeWindow: "all-day",
    dealDescription: "$3 beers",
    lastVerified: "2026-05-20",
  };

  const parking = {
    slug: "seventh-street-lot",
    name: "7th Street Lot",
    address: "700 E 7th St",
    latLng: [35.23, -80.83],
    hourlyRate: 3,
    dailyMax: 15,
    hours: {
      mon: { open: "06:00", close: "22:00" },
      tue: { open: "06:00", close: "22:00" },
      wed: { open: "06:00", close: "22:00" },
      thu: { open: "06:00", close: "22:00" },
      fri: { open: "06:00", close: "22:00" },
      sat: { open: "08:00", close: "20:00" },
      sun: "closed",
    },
    paymentMethods: ["card", "app"],
    covered: false,
    lastVerified: "2026-05-15",
  };

  it("returns items sorted by lastVerified descending", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(makeBundle([greenway]))
      .mockResolvedValueOnce(makeBundle([deal1, deal2]))
      .mockResolvedValueOnce(makeBundle([parking]));

    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.activity.recent();

    expect(result[0]?.slug).toBe("suffolk-punch-trivia");
    expect(result[0]?.lastVerified).toBe("2026-05-24");
    expect(result[1]?.slug).toBe("suffolk-punch-3-beers");
    expect(result[2]?.slug).toBe("seventh-street-lot");
    expect(result[3]?.slug).toBe("mallard-creek");
  });

  it("returns at most 5 items", async () => {
    const manyGreenways = Array.from({ length: 10 }, (_, i) => ({
      ...greenway,
      slug: `gw-${i}`,
      lastVerified: `2026-05-${String(i + 1).padStart(2, "0")}`,
    }));

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(makeBundle(manyGreenways))
      .mockResolvedValueOnce(makeBundle([]))
      .mockResolvedValueOnce(makeBundle([]));

    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.activity.recent();

    expect(result).toHaveLength(5);
    expect(result[0]?.slug).toBe("gw-9");
  });

  it("mixes entity kinds correctly", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(makeBundle([greenway]))
      .mockResolvedValueOnce(makeBundle([deal1]))
      .mockResolvedValueOnce(makeBundle([parking]));

    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.activity.recent();

    const kinds = result.map((r) => r.kind);
    expect(kinds).toContain("greenway");
    expect(kinds).toContain("deal");
    expect(kinds).toContain("parking");
  });

  it("deal labels include restaurant name and description", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(makeBundle([]))
      .mockResolvedValueOnce(makeBundle([deal1]))
      .mockResolvedValueOnce(makeBundle([]));

    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.activity.recent();

    expect(result[0]?.label).toContain("Suffolk Punch South End");
    expect(result[0]?.label).toContain("Trivia night at 7 PM");
  });

  it("returns empty array when no data", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(makeBundle([]))
      .mockResolvedValueOnce(makeBundle([]))
      .mockResolvedValueOnce(makeBundle([]));

    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.activity.recent();

    expect(result).toEqual([]);
  });
});
