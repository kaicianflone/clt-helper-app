import { describe, expect, it, vi } from "vitest";

import type { Context } from "../trpc";
import { appRouter } from "../root";

describe("gis routers", () => {
  const baseCtx: Context = { baseUrl: "https://cdn.example.com" };

  const parkFixture = {
    slug: "freedom-park",
    name: "Freedom Park",
    description: "",
    center: { lat: 35.19, lng: -80.84 },
    amenities: {
      tennis: true,
      pickleball: false,
      discGolf: false,
      skatepark: false,
      dogPark: false,
      basketball: true,
    },
    photos: [],
    lastVerified: "2026-05-28",
  };

  const mockBundle = (entries: unknown[]) =>
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ schemaVersion: 1, builtAt: "", entries }),
        ),
      );

  it("park.list returns bundle entries", async () => {
    const fetchImpl = mockBundle([parkFixture]);
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.park.list();
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe("freedom-park");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://cdn.example.com/data/v1/parks.json",
      expect.any(Object),
    );
  });

  it("park.get returns the matching entry", async () => {
    const fetchImpl = mockBundle([parkFixture]);
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.park.get({ slug: "freedom-park" });
    expect(result.name).toBe("Freedom Park");
  });

  it("park.get throws NOT_FOUND for an unknown slug", async () => {
    const fetchImpl = mockBundle([parkFixture]);
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    await expect(caller.park.get({ slug: "nope" })).rejects.toThrow(
      /not found/i,
    );
  });

  it("evCharging.list fetches the amenities-distinct bundle name", async () => {
    const fetchImpl = mockBundle([]);
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    await caller.evCharging.list();
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://cdn.example.com/data/v1/ev-charging.json",
      expect.any(Object),
    );
  });

  it("amenity.list fetches the plural amenities bundle", async () => {
    const fetchImpl = mockBundle([]);
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    await caller.amenity.list();
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://cdn.example.com/data/v1/amenities.json",
      expect.any(Object),
    );
  });
});
