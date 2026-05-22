import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Set a default before route.ts is imported. env.ts validates
// NEXT_PUBLIC_MAPTILER_KEY at module-load time; tests override via vi.stubEnv
// later. Lint forbids process.env in app code — this is a test fixture, hence
// the eslint-disable.
// eslint-disable-next-line no-restricted-properties
process.env.NEXT_PUBLIC_MAPTILER_KEY = "test-key-123";

describe("/api/tiles/health", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports keyConfigured=true when NEXT_PUBLIC_MAPTILER_KEY is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPTILER_KEY", "test-key-123");
    const { GET } = await import("./route");
    const res = GET();
    const body = (await res.json()) as {
      source: string;
      keyConfigured: boolean;
      error: string | null;
    };
    expect(res.status).toBe(200);
    expect(body).toEqual({
      source: "maptiler",
      keyConfigured: true,
      error: null,
    });
  });

  it("reports keyConfigured=false with error=no_key when env var is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPTILER_KEY", "");
    const { GET } = await import("./route");
    const res = GET();
    const body = (await res.json()) as {
      source: string;
      keyConfigured: boolean;
      error: string | null;
    };
    expect(res.status).toBe(200);
    expect(body).toEqual({
      source: "maptiler",
      keyConfigured: false,
      error: "no_key",
    });
  });
});
