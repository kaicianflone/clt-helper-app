import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { geocodeDeals } from "./geocode-deals";

let workDir: string;

beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), "geocode-"));
});
afterEach(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

const makeDeal = (overrides: Record<string, unknown> = {}) => ({
  slug: "test-deal",
  restaurantName: "Test Place",
  restaurantAddress: "100 N Tryon St, Charlotte, NC 28202",
  restaurantLatLng: [35.0, -80.0],
  daysOfWeek: ["mon"],
  timeWindow: "all-day",
  dealDescription: "Test deal",
  lastVerified: "2026-01-01",
  ...overrides,
});

const mockFetchGeocode = (lat: number, lng: number) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({
      result: {
        addressMatches: [{ coordinates: { x: lng, y: lat } }],
      },
    }),
  } as Response);

describe("geocodeDeals", () => {
  it("returns 0 when directory does not exist", async () => {
    const count = await geocodeDeals(path.join(workDir, "nope"));
    expect(count).toBe(0);
  });

  it("updates coordinates when drift exceeds threshold", async () => {
    const dealFile = path.join(workDir, "test.json");
    fs.writeFileSync(dealFile, JSON.stringify(makeDeal()));

    mockFetchGeocode(35.2271, -80.8431);

    const count = await geocodeDeals(workDir);
    expect(count).toBe(1);

    const updated = JSON.parse(fs.readFileSync(dealFile, "utf8"));
    expect(updated.restaurantLatLng).toEqual([35.2271, -80.8431]);
  });

  it("skips files when drift is below threshold", async () => {
    const coords: [number, number] = [35.2271, -80.8431];
    const dealFile = path.join(workDir, "test.json");
    fs.writeFileSync(
      dealFile,
      JSON.stringify(makeDeal({ restaurantLatLng: coords })),
    );

    mockFetchGeocode(35.2271, -80.8431);

    const count = await geocodeDeals(workDir);
    expect(count).toBe(0);
  });

  it("groups deals by address to avoid redundant API calls", async () => {
    const addr = "100 N Tryon St, Charlotte, NC 28202";
    fs.writeFileSync(
      path.join(workDir, "a.json"),
      JSON.stringify(makeDeal({ slug: "a", restaurantAddress: addr })),
    );
    fs.writeFileSync(
      path.join(workDir, "b.json"),
      JSON.stringify(makeDeal({ slug: "b", restaurantAddress: addr })),
    );

    const spy = mockFetchGeocode(35.2271, -80.8431);

    const count = await geocodeDeals(workDir);
    expect(count).toBe(2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("handles geocode API failure gracefully", async () => {
    fs.writeFileSync(
      path.join(workDir, "test.json"),
      JSON.stringify(makeDeal()),
    );

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));

    const count = await geocodeDeals(workDir);
    expect(count).toBe(0);

    const unchanged = JSON.parse(
      fs.readFileSync(path.join(workDir, "test.json"), "utf8"),
    );
    expect(unchanged.restaurantLatLng).toEqual([35.0, -80.0]);
  });

  it("handles non-ok response gracefully", async () => {
    fs.writeFileSync(
      path.join(workDir, "test.json"),
      JSON.stringify(makeDeal()),
    );

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const count = await geocodeDeals(workDir);
    expect(count).toBe(0);
  });

  it("handles no address matches from API", async () => {
    fs.writeFileSync(
      path.join(workDir, "test.json"),
      JSON.stringify(makeDeal()),
    );

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ result: { addressMatches: [] } }),
    } as Response);

    const count = await geocodeDeals(workDir);
    expect(count).toBe(0);
  });

  it("ignores _index.json", async () => {
    fs.writeFileSync(
      path.join(workDir, "_index.json"),
      JSON.stringify(makeDeal()),
    );

    const count = await geocodeDeals(workDir);
    expect(count).toBe(0);
  });
});
