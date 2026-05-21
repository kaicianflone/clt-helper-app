import { describe, expect, it, vi } from "vitest";
import type { Context } from "../trpc";
import { appRouter } from "../root";

const validGreenway = {
  slug: "test-trail",
  name: "Test Trail",
  description: "",
  lengthMiles: 1,
  surface: "paved",
  trailheads: [{ name: "Start", lat: 35.2, lng: -80.84 }],
  geometry: { type: "LineString", coordinates: [[-80.84, 35.2], [-80.85, 35.21]] },
  pointsOfInterest: [],
  photos: [],
  lastVerified: "2026-01-01",
} as const;

const buildCtx = (overrides: Partial<Context> = {}): Context => ({
  baseUrl: "https://cdn.example.com",
  checkRateLimit: vi.fn().mockResolvedValue({ ok: true, remaining: 2 }),
  fetchFileFromRepo: vi.fn().mockResolvedValue(validGreenway),
  renderDiff: vi.fn().mockReturnValue("- name: Test Trail → Renamed Trail"),
  openCommunityPR: vi.fn().mockResolvedValue({
    prUrl: "https://github.com/x/y/pull/1", prNumber: 1, branch: "community/test",
  }),
  isVerifyOnlyChange: vi.fn().mockReturnValue(false),
  ...overrides,
});

describe("submit.contribute", () => {
  it("opens a PR for a valid greenway patch", async () => {
    const ctx = buildCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.submit.contribute({
      kind: "greenway",
      patch: { slug: "test-trail", name: "Renamed Trail" },
      note: "name correction",
      displayName: "Kai",
      deviceId: "device-1",
      eulaAcceptedAt: "2026-05-20T00:00:00Z",
    });
    expect(result.prUrl).toMatch(/pull\/1$/);
    expect(ctx.openCommunityPR).toHaveBeenCalledOnce();
  });

  it("rejects when rate limit exceeded", async () => {
    const ctx = buildCtx({ checkRateLimit: vi.fn().mockResolvedValue({ ok: false, remaining: 0 }) });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.submit.contribute({
      kind: "greenway",
      patch: { slug: "test-trail", name: "X" },
      note: "", displayName: "Kai", deviceId: "device-1",
      eulaAcceptedAt: "2026-05-20T00:00:00Z",
    })).rejects.toThrow(/rate.*limit|too.*many/i);
    expect(ctx.openCommunityPR).not.toHaveBeenCalled();
  });

  it("rejects when content is objectionable", async () => {
    const ctx = buildCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.submit.contribute({
      kind: "greenway",
      patch: { slug: "test-trail", name: "X" },
      note: "fucking awesome",
      displayName: "Kai", deviceId: "device-1",
      eulaAcceptedAt: "2026-05-20T00:00:00Z",
    })).rejects.toThrow(/disallowed/i);
    expect(ctx.openCommunityPR).not.toHaveBeenCalled();
  });

  it("passes autoMerge=true when isVerifyOnlyChange returns true", async () => {
    const ctx = buildCtx({ isVerifyOnlyChange: vi.fn().mockReturnValue(true) });
    const caller = appRouter.createCaller(ctx);
    await caller.submit.contribute({
      kind: "greenway",
      patch: { slug: "test-trail", lastVerified: "2026-05-20" },
      note: "still good",
      displayName: "Kai", deviceId: "device-1",
      eulaAcceptedAt: "2026-05-20T00:00:00Z",
    });
    expect(ctx.openCommunityPR).toHaveBeenCalledWith(
      expect.objectContaining({ autoMerge: true })
    );
  });

  it("rejects when eulaAcceptedAt is missing", async () => {
    const ctx = buildCtx();
    const caller = appRouter.createCaller(ctx);
    const badInput = {
      kind: "greenway" as const,
      patch: { slug: "test-trail", name: "X" },
      note: "", displayName: "Kai", deviceId: "device-1",
      eulaAcceptedAt: "",
    };
    await expect(caller.submit.contribute(badInput)).rejects.toThrow();
  });
});
