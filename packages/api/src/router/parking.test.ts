import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../root";

describe("parking router", () => {
  const baseCtx = { baseUrl: "https://cdn.example.com" };

  const parkingFixture = {
    slug: "uptown-deck",
    name: "Uptown Deck",
    address: "100 Trade St, Charlotte, NC",
    latLng: [35.2272, -80.8431],
    hourlyRate: 2.0,
    dailyMax: 15.0,
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
    covered: true,
    lastVerified: "2026-05-20",
  };

  const parkingFixture2 = {
    slug: "south-end-surface",
    name: "South End Surface Lot",
    address: "200 Camden Rd",
    latLng: [35.2171, -80.8501],
    hourlyRate: null,
    dailyMax: 10.0,
    hours: {
      mon: "24h",
      tue: "24h",
      wed: "24h",
      thu: "24h",
      fri: "24h",
      sat: "24h",
      sun: "24h",
    },
    paymentMethods: ["cash", "card"],
    covered: false,
    lastVerified: "2026-05-20",
  };

  const makeBundle = (entries: unknown[]) =>
    new Response(
      JSON.stringify({ schemaVersion: 1, builtAt: "", entries }),
    );

  it("list returns all parking lots", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(makeBundle([parkingFixture, parkingFixture2]));
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl } as any);
    const result = await caller.parking.list();
    expect(result).toHaveLength(2);
    expect(result[0]!.slug).toBe("uptown-deck");
    expect(result[1]!.slug).toBe("south-end-surface");
  });

  it("get returns full entry by slug", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(makeBundle([parkingFixture, parkingFixture2]));
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl } as any);
    const result = await caller.parking.get({ slug: "south-end-surface" });
    expect(result.name).toBe("South End Surface Lot");
    expect(result.covered).toBe(false);
  });

  it("get throws NOT_FOUND when slug missing", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(makeBundle([parkingFixture]));
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl } as any);
    await expect(
      caller.parking.get({ slug: "nonexistent" }),
    ).rejects.toThrow(/not found/i);
  });
});
