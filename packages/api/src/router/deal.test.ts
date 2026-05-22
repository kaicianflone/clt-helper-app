import { describe, expect, it, vi } from "vitest";

import type { Context } from "../trpc";
import { appRouter } from "../root";

describe("deal router", () => {
  const baseCtx: Context = { baseUrl: "https://cdn.example.com" };

  const dealFixture = {
    slug: "taco-tuesday",
    restaurantName: "Taco Place",
    restaurantAddress: "123 Main St",
    restaurantLatLng: [35.2271, -80.8431],
    daysOfWeek: ["tue", "wed"],
    timeWindow: { start: "11:00", end: "14:00" },
    dealDescription: "$2 tacos",
    lastVerified: "2026-05-20",
  };

  const dealFixture2 = {
    slug: "friday-special",
    restaurantName: "Burger Joint",
    restaurantAddress: "456 Elm St",
    restaurantLatLng: [35.23, -80.84],
    daysOfWeek: ["fri"],
    timeWindow: "all-day",
    dealDescription: "Free burger",
    lastVerified: "2026-05-20",
  };

  const makeBundle = (entries: unknown[]) =>
    new Response(JSON.stringify({ schemaVersion: 1, builtAt: "", entries }));

  it("list returns all entries when no day filter", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(makeBundle([dealFixture, dealFixture2]));
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.deal.list();
    expect(result).toHaveLength(2);
    expect(result[0]?.slug).toBe("taco-tuesday");
  });

  it("list filters by day of week", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(makeBundle([dealFixture, dealFixture2]));
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.deal.list({ day: "tue" });
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe("taco-tuesday");
  });

  it("list returns empty array when no deals on that day", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(makeBundle([dealFixture, dealFixture2]));
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.deal.list({ day: "sun" });
    expect(result).toEqual([]);
  });

  it("get returns full entry by slug", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(makeBundle([dealFixture, dealFixture2]));
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.deal.get({ slug: "friday-special" });
    expect(result.restaurantName).toBe("Burger Joint");
  });

  it("get throws NOT_FOUND when slug missing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(makeBundle([dealFixture]));
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    await expect(caller.deal.get({ slug: "nonexistent" })).rejects.toThrow(
      /not found/i,
    );
  });
});
