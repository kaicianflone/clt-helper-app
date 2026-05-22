import { describe, expect, it, vi } from "vitest";

import type { Context } from "../trpc";
import { appRouter } from "../root";

describe("greenway router", () => {
  const baseCtx: Context = {
    baseUrl: "https://cdn.example.com",
  };

  const greenwayFixture = {
    slug: "a",
    name: "A",
    description: "",
    lengthMiles: 1,
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
    lastVerified: "2026-05-20",
  };

  it("list returns lightweight entries", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaVersion: 1,
          builtAt: "",
          entries: [greenwayFixture],
        }),
      ),
    );
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.greenway.list();
    expect(result).toEqual([
      { slug: "a", name: "A", lengthMiles: 1, surface: "paved" },
    ]);
  });

  it("get returns full entry", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaVersion: 1,
          builtAt: "",
          entries: [greenwayFixture],
        }),
      ),
    );
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.greenway.get({ slug: "a" });
    expect(result.name).toBe("A");
    expect(result.geometry.type).toBe("LineString");
  });

  it("get throws when slug not found", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaVersion: 1,
          builtAt: "",
          entries: [greenwayFixture],
        }),
      ),
    );
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    await expect(caller.greenway.get({ slug: "missing" })).rejects.toThrow(
      /not found/i,
    );
  });

  it("listWithGeometry returns slug + name + geometry only", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaVersion: 1,
          builtAt: "",
          entries: [greenwayFixture],
        }),
      ),
    );
    const caller = appRouter.createCaller({ ...baseCtx, fetchImpl });
    const result = await caller.greenway.listWithGeometry();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      slug: "a",
      name: "A",
      geometry: greenwayFixture.geometry,
    });
  });
});
