import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Context } from "../trpc";
import { appRouter } from "../root";

// Set required GitHub env vars for tests that reach the openCommunityPR call.
// The router reads these at runtime, so they must be present before the mutation runs.
beforeAll(() => {
  process.env.GH_REPO_OWNER = "test-owner";
  process.env.GH_REPO_NAME = "test-repo";
});
afterAll(() => {
  delete process.env.GH_REPO_OWNER;
  delete process.env.GH_REPO_NAME;
});

const validGreenway = {
  slug: "test-trail",
  name: "Test Trail",
  description: "",
  lengthMiles: 1,
  surface: "paved",
  trailheads: [{ name: "Start", lat: 35.2, lng: -80.84 }],
  geometry: {
    type: "LineString",
    coordinates: [
      [-80.84, 35.2],
      [-80.85, 35.21],
    ],
  },
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
    prUrl: "https://github.com/x/y/pull/1",
    prNumber: 1,
    branch: "community/test",
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
      intent: "edit",
    });
    expect(result.prUrl).toMatch(/pull\/1$/);
    expect(ctx.openCommunityPR).toHaveBeenCalledOnce();
  });

  it("rejects when rate limit exceeded", async () => {
    const ctx = buildCtx({
      checkRateLimit: vi.fn().mockResolvedValue({ ok: false, remaining: 0 }),
    });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.submit.contribute({
        kind: "greenway",
        patch: { slug: "test-trail", name: "X" },
        note: "",
        displayName: "Kai",
        deviceId: "device-1",
        eulaAcceptedAt: "2026-05-20T00:00:00Z",
        intent: "edit",
      }),
    ).rejects.toThrow(/rate.*limit|too.*many/i);
    expect(ctx.openCommunityPR).not.toHaveBeenCalled();
  });

  it("rejects when content is objectionable", async () => {
    const ctx = buildCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.submit.contribute({
        kind: "greenway",
        patch: { slug: "test-trail", name: "X" },
        note: "fucking awesome",
        displayName: "Kai",
        deviceId: "device-1",
        eulaAcceptedAt: "2026-05-20T00:00:00Z",
        intent: "edit",
      }),
    ).rejects.toThrow(/disallowed/i);
    expect(ctx.openCommunityPR).not.toHaveBeenCalled();
  });

  it("passes autoMerge=true when isVerifyOnlyChange returns true", async () => {
    const ctx = buildCtx({ isVerifyOnlyChange: vi.fn().mockReturnValue(true) });
    const caller = appRouter.createCaller(ctx);
    await caller.submit.contribute({
      kind: "greenway",
      patch: { slug: "test-trail", lastVerified: "2026-05-20" },
      note: "still good",
      displayName: "Kai",
      deviceId: "device-1",
      eulaAcceptedAt: "2026-05-20T00:00:00Z",
      intent: "edit",
    });
    expect(ctx.openCommunityPR).toHaveBeenCalledWith(
      expect.objectContaining({ autoMerge: true }),
    );
  });

  it("rejects when eulaAcceptedAt is missing", async () => {
    const ctx = buildCtx();
    const caller = appRouter.createCaller(ctx);
    const badInput = {
      kind: "greenway" as const,
      patch: { slug: "test-trail", name: "X" },
      note: "",
      displayName: "Kai",
      deviceId: "device-1",
      eulaAcceptedAt: "",
      intent: "edit" as const,
    };
    await expect(caller.submit.contribute(badInput)).rejects.toThrow();
  });

  // P2-1: eulaAcceptedAt must be a valid ISO 8601 datetime
  it("rejects when eulaAcceptedAt is not a valid ISO 8601 datetime", async () => {
    const ctx = buildCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.submit.contribute({
        kind: "greenway",
        patch: { slug: "test-trail", name: "X" },
        note: "",
        displayName: "Kai",
        deviceId: "device-1",
        eulaAcceptedAt: "not-a-date",
        intent: "edit",
      }),
    ).rejects.toThrow();
  });

  // P0-1: GH_REPO_OWNER / GH_REPO_NAME must be set
  it("throws INTERNAL_SERVER_ERROR when GH_REPO_OWNER env var is absent", async () => {
    const savedOwner = process.env.GH_REPO_OWNER;
    const savedRepo = process.env.GH_REPO_NAME;
    delete process.env.GH_REPO_OWNER;
    delete process.env.GH_REPO_NAME;
    try {
      const ctx = buildCtx();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.submit.contribute({
          kind: "greenway",
          patch: { slug: "test-trail", name: "X" },
          note: "",
          displayName: "Kai",
          deviceId: "device-1",
          eulaAcceptedAt: "2026-05-20T00:00:00Z",
          intent: "edit",
        }),
      ).rejects.toThrow(/misconfigured|missing.*GitHub/i);
    } finally {
      if (savedOwner !== undefined) process.env.GH_REPO_OWNER = savedOwner;
      if (savedRepo !== undefined) process.env.GH_REPO_NAME = savedRepo;
    }
  });

  // P1-2: intent="create" + existing slug → CONFLICT
  it("throws CONFLICT when intent=create but the slug already exists", async () => {
    const ctx = buildCtx({
      // fetchFileFromRepo returns non-empty → slug exists
      fetchFileFromRepo: vi.fn().mockResolvedValue(validGreenway),
    });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.submit.contribute({
        kind: "greenway",
        patch: { slug: "test-trail", name: "New Trail" },
        note: "",
        displayName: "Kai",
        deviceId: "device-1",
        eulaAcceptedAt: "2026-05-20T00:00:00Z",
        intent: "create",
      }),
    ).rejects.toThrow(/already exists|CONFLICT/i);
    expect(ctx.openCommunityPR).not.toHaveBeenCalled();
  });

  // P1-2: intent="edit" + missing slug → NOT_FOUND
  it("throws NOT_FOUND when intent=edit but the slug does not exist", async () => {
    const ctx = buildCtx({
      // fetchFileFromRepo returns empty → slug does not exist
      fetchFileFromRepo: vi.fn().mockResolvedValue({}),
    });
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.submit.contribute({
        kind: "greenway",
        patch: { slug: "ghost-trail", name: "Ghost" },
        note: "",
        displayName: "Kai",
        deviceId: "device-1",
        eulaAcceptedAt: "2026-05-20T00:00:00Z",
        intent: "edit",
      });
      expect.fail("Expected an error but none was thrown");
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      // TRPCError code or message should indicate NOT_FOUND
      expect(
        err.code === "NOT_FOUND" || /not found/i.test(err.message ?? ""),
      ).toBe(true);
    }
    expect(ctx.openCommunityPR).not.toHaveBeenCalled();
  });

  // intent=create + non-existent slug should succeed
  it("succeeds when intent=create and the slug does not exist yet", async () => {
    const ctx = buildCtx({
      fetchFileFromRepo: vi.fn().mockResolvedValue({}),
      openCommunityPR: vi.fn().mockResolvedValue({
        prUrl: "https://github.com/x/y/pull/2",
        prNumber: 2,
        branch: "community/new",
      }),
    });
    const caller = appRouter.createCaller(ctx);
    const fullPatch = {
      slug: "new-trail",
      name: "New Trail",
      description: "",
      lengthMiles: 1.2,
      surface: "paved",
      trailheads: [{ name: "Start", lat: 35.2, lng: -80.84 }],
      geometry: {
        type: "LineString",
        coordinates: [
          [-80.84, 35.2],
          [-80.85, 35.21],
        ],
      },
      pointsOfInterest: [],
      photos: [],
      lastVerified: "2026-05-20",
    };
    const result = await caller.submit.contribute({
      kind: "greenway",
      patch: fullPatch,
      note: "",
      displayName: "Kai",
      deviceId: "device-1",
      eulaAcceptedAt: "2026-05-20T00:00:00Z",
      intent: "create",
    });
    expect(result.prUrl).toMatch(/pull\/2$/);
    expect(ctx.openCommunityPR).toHaveBeenCalledOnce();
  });
});
