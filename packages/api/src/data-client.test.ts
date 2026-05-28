import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchAmenity,
  fetchBundle,
  fetchEvCharging,
  fetchLandfill,
  fetchParks,
  fetchRecycling,
  fetchTransitParking,
} from "./data-client";

describe("fetchBundle", () => {
  it("returns parsed bundle on 200", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaVersion: 1,
          builtAt: "",
          entries: [{ slug: "a" }],
        }),
      ),
    );
    const bundle = await fetchBundle("greenways", {
      baseUrl: "https://cdn.example.com",
      fetchImpl: fetchMock,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cdn.example.com/data/v1/greenways.json",
      expect.any(Object),
    );
    expect(bundle.entries).toHaveLength(1);
  });

  it("retries once on network failure then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ schemaVersion: 1, builtAt: "", entries: [] }),
        ),
      );
    const bundle = await fetchBundle("deals", {
      baseUrl: "https://cdn.example.com",
      fetchImpl: fetchMock,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bundle.entries).toEqual([]);
  });

  it("throws after second failure", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(
      fetchBundle("parking", {
        baseUrl: "https://cdn.example.com",
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to provided offlineBundle when network fails twice", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    const offline = {
      schemaVersion: 1,
      builtAt: "2026-05-20T00:00:00Z",
      entries: [{ slug: "bundled" }],
    };
    const bundle = await fetchBundle("greenways", {
      baseUrl: "https://cdn.example.com",
      fetchImpl: fetchMock,
      offlineBundle: offline,
    });
    expect(bundle.entries).toEqual([{ slug: "bundled" }]);
  });

  it("throws on non-ok response without retrying past limit", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("not found", { status: 404 }));
    await expect(
      fetchBundle("greenways", {
        baseUrl: "https://cdn.example.com",
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrow(/404/);
  });
});

describe("fetchBundle — local-disk fallback (empty baseUrl)", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clt-data-test-"));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reads from localDir when baseUrl is undefined", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "greenways.json"),
      JSON.stringify({
        schemaVersion: 1,
        builtAt: "2026-05-21T00:00:00Z",
        entries: [{ slug: "from-disk" }],
      }),
    );
    const bundle = await fetchBundle("greenways", { localDir: tmpDir });
    expect(bundle.entries).toEqual([{ slug: "from-disk" }]);
  });

  it("reads from localDir when baseUrl is empty string", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "deals.json"),
      JSON.stringify({
        schemaVersion: 1,
        builtAt: "",
        entries: [{ slug: "empty-base" }],
      }),
    );
    const bundle = await fetchBundle("deals", {
      baseUrl: "",
      localDir: tmpDir,
    });
    expect(bundle.entries).toEqual([{ slug: "empty-base" }]);
  });

  it("falls back to offlineBundle when localDir lacks the file", async () => {
    const offline = {
      schemaVersion: 1,
      builtAt: "",
      entries: [{ slug: "offline" }],
    };
    const bundle = await fetchBundle("parking", {
      localDir: tmpDir,
      offlineBundle: offline,
    });
    expect(bundle.entries).toEqual([{ slug: "offline" }]);
  });

  it("throws a helpful error when localDir lacks the file and no offlineBundle is given", async () => {
    await expect(
      fetchBundle("greenways", { localDir: tmpDir }),
    ).rejects.toThrow(/greenways\.json not found/);
  });

  it("respects CLT_DATA_DIR when localDir is unset", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "parking.json"),
      JSON.stringify({
        schemaVersion: 1,
        builtAt: "",
        entries: [{ slug: "via-env" }],
      }),
    );
    vi.stubEnv("CLT_DATA_DIR", tmpDir);
    try {
      const bundle = await fetchBundle("parking", {});
      expect(bundle.entries).toEqual([{ slug: "via-env" }]);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("fetchBundle — new kinds (parks, recycling, transit-parking, ev-charging, landfill, amenity)", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clt-data-new-kinds-"));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it.each([
    ["parks", fetchParks],
    ["recycling", fetchRecycling],
    ["transit-parking", fetchTransitParking],
    ["ev-charging", fetchEvCharging],
    ["landfills", fetchLandfill],
    ["amenities", fetchAmenity],
  ] as const)(
    "fetchBundle %s reads from CDN when baseUrl is set",
    async (kind, fetchFn) => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            schemaVersion: 1,
            builtAt: "",
            entries: [{ slug: kind }],
          }),
        ),
      );
      const bundle = await fetchFn({
        baseUrl: "https://cdn.example.com",
        fetchImpl: fetchMock,
      });
      expect(fetchMock).toHaveBeenCalledWith(
        `https://cdn.example.com/data/v1/${kind}.json`,
        expect.any(Object),
      );
      expect(bundle.entries).toEqual([{ slug: kind }]);
    },
  );

  it("fetchParks reads from localDir when baseUrl is absent", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "parks.json"),
      JSON.stringify({
        schemaVersion: 1,
        builtAt: "",
        entries: [{ slug: "romare-bearden" }],
      }),
    );
    const bundle = await fetchParks({ localDir: tmpDir });
    expect(bundle.entries).toEqual([{ slug: "romare-bearden" }]);
  });

  it("fetchEvCharging reads from localDir when baseUrl is absent", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "ev-charging.json"),
      JSON.stringify({
        schemaVersion: 1,
        builtAt: "",
        entries: [{ slug: "station-1" }],
      }),
    );
    const bundle = await fetchEvCharging({ localDir: tmpDir });
    expect(bundle.entries).toEqual([{ slug: "station-1" }]);
  });

  it("falls back to offlineBundle for transit-parking when localDir lacks the file", async () => {
    const offline = {
      schemaVersion: 1,
      builtAt: "",
      entries: [
        {
          slug: "offline-tp",
          name: "Offline P&R",
          description: "",
          center: { lat: 35.2, lng: -80.8 },
          address: "100 Test St",
          freeParking: true,
          photos: [],
          lastVerified: "2026-05-28",
        },
      ],
    };
    const bundle = await fetchTransitParking({
      localDir: tmpDir,
      offlineBundle: offline,
    });
    expect(bundle.entries[0]?.slug).toBe("offline-tp");
  });
});
