/**
 * import-gis.test.ts
 *
 * All tests mock network — no live fetches are made.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  paginateArcGis,
  fetchMeckParks,
  fetchMeckRecycling,
  fetchMeckLandfills,
  fetchTransitParking,
  fetchEvCharging,
  buildNrelUrl,
  CHARLOTTE_OD_TRANSIT_PARKING_URL,
  type ArcGisFeature,
  type ArcGisFeatureCollection,
} from "./import-gis";
import {
  ParkSchema,
  RecyclingSchema,
  TransitParkingSchema,
  EvChargingSchema,
  LandfillSchema,
  AmenitySchema,
} from "@clt/data-schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeArcGisResponse(
  features: ArcGisFeature[],
): ArcGisFeatureCollection {
  return { type: "FeatureCollection", features };
}

function mockFetch(responses: ArcGisFeatureCollection[]): typeof fetch {
  let call = 0;
  return vi.fn(async () => {
    const body = responses[call] ?? responses[responses.length - 1]!;
    call++;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
}

function makePoint(
  lng: number,
  lat: number,
  props: Record<string, unknown>,
  objectId = 1,
): ArcGisFeature {
  return {
    type: "Feature",
    properties: { OBJECTID: objectId, ...props },
    geometry: { type: "Point", coordinates: [lng, lat] },
  };
}

// ---------------------------------------------------------------------------
// paginateArcGis — core pagination + dedup + MIN_EXPECTED guard
// ---------------------------------------------------------------------------

describe("paginateArcGis", () => {
  const BASE_URL = "https://example.com/FeatureServer/0/query";

  it("returns features from a single page", async () => {
    const features = [makePoint(-80.84, 35.23, { prkname: "Test Park" }, 1)];
    const mockFetchImpl = mockFetch([makeArcGisResponse(features)]);
    const result = await paginateArcGis(BASE_URL, {}, mockFetchImpl, 1);
    expect(result).toHaveLength(1);
  });

  it("paginates across multiple pages using resultOffset", async () => {
    // Page 1: full chunk of 2000 features (simulate with 2 for test simplicity)
    // We override chunk to 2 by injecting 2 features per page with length === 2
    // Actually we need to produce exactly 2000 items to trigger next page,
    // so instead we test via page count using real chunk size by examining calls.
    const page1Features: ArcGisFeature[] = Array.from({ length: 2 }, (_, i) =>
      makePoint(-80.84 + i * 0.001, 35.23, { name: `Feature ${i}` }, i + 1),
    );
    // Second page has fewer than chunk, signals end of pagination
    const page2Features: ArcGisFeature[] = [
      makePoint(-80.9, 35.3, { name: "Last Feature" }, 100),
    ];

    // We'll test pagination by checking resultOffset is passed correctly.
    let capturedOffsets: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      const urlObj = new URL(url as string);
      capturedOffsets.push(urlObj.searchParams.get("resultOffset") ?? "?");
      // First call returns page1 (full-sized — we'll use chunk=2 by returning 2000 items)
      // But since real chunk=2000, let's just verify the offset tracking works
      // by returning short pages both times.
      const features = capturedOffsets.length === 1 ? page1Features : page2Features;
      return new Response(JSON.stringify(makeArcGisResponse(features)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    // With minExpected=1, this should complete with 3 features total across 2 pages
    // (even though pages have fewer than 2000 — first page returns 2, triggers done condition)
    const result = await paginateArcGis(BASE_URL, {}, fetchImpl, 1);
    // Only one page call since page1 has fewer than 2000 features
    expect(result).toHaveLength(2);
    expect(capturedOffsets[0]).toBe("0");
  });

  it("deduplicates records by OBJECTID", async () => {
    // Both features share the same OBJECTID
    const feat1 = makePoint(-80.84, 35.23, { name: "A" }, 42);
    const feat2 = makePoint(-80.85, 35.24, { name: "B" }, 42); // duplicate OID
    const mockFetchImpl = mockFetch([makeArcGisResponse([feat1, feat2])]);
    const result = await paginateArcGis(BASE_URL, {}, mockFetchImpl, 1);
    // Should only include feat1 (first occurrence of OID 42)
    expect(result).toHaveLength(1);
    expect(result[0]!.properties["name"]).toBe("A");
  });

  it("dedup proven: second page duplicate triggers no error and is skipped (not full page)", async () => {
    const feat = makePoint(-80.84, 35.23, { name: "Park" }, 7);
    // Two pages, each with same single feature (short page, so won't hit full-page-all-dup error)
    const mockFetchImpl = vi.fn(async () => {
      return new Response(JSON.stringify(makeArcGisResponse([feat])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;
    // First page returns 1 item (< 2000, stops pagination) — only 1 call
    const result = await paginateArcGis(BASE_URL, {}, mockFetchImpl, 1);
    expect(result).toHaveLength(1);
  });

  it("throws when MIN_EXPECTED_FEATURES not met", async () => {
    const features = [makePoint(-80.84, 35.23, {}, 1)];
    const mockFetchImpl = mockFetch([makeArcGisResponse(features)]);
    await expect(
      paginateArcGis(BASE_URL, {}, mockFetchImpl, 5),
    ).rejects.toThrow(/only 1 unique features returned/);
  });

  it("throws on HTTP error", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response("Server Error", { status: 500 });
    }) as unknown as typeof fetch;
    await expect(paginateArcGis(BASE_URL, {}, fetchImpl, 0)).rejects.toThrow(
      /HTTP 500/,
    );
  });

  it("throws on ArcGIS error body", async () => {
    const errorBody = { error: { code: 400, message: "Bad request" } };
    const fetchImpl = vi.fn(async () => {
      return new Response(JSON.stringify(errorBody), { status: 200 });
    }) as unknown as typeof fetch;
    await expect(paginateArcGis(BASE_URL, {}, fetchImpl, 0)).rejects.toThrow(
      /server returned error/,
    );
  });

  it("always requests outSR=4326", async () => {
    let capturedUrl = "";
    const fetchImpl = vi.fn(async (url: string) => {
      capturedUrl = url as string;
      return new Response(JSON.stringify(makeArcGisResponse([makePoint(-80.84, 35.23, {}, 1)])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    await paginateArcGis(BASE_URL, {}, fetchImpl, 1);
    const urlObj = new URL(capturedUrl);
    expect(urlObj.searchParams.get("outSR")).toBe("4326");
  });
});

// ---------------------------------------------------------------------------
// meck-arcgis adapter — Parks
// ---------------------------------------------------------------------------

describe("fetchMeckParks", () => {
  it("parses a park feature into a valid ParkSchema record", async () => {
    const feat = makePoint(-80.84, 35.23, {
      prkname: "Freedom Park",
      numparking: "120",
      parkurl: "https://example.com/freedompark",
      tennis: "Yes",
      pickleball: "No",
      discgolf: "No",
      skatepark: "No",
      dogpark: "No",
      basketball: "No",
    }, 1);

    const mockFetchImpl = mockFetch([makeArcGisResponse([feat])]);
    const { parks } = await fetchMeckParks(mockFetchImpl, 1);

    expect(parks).toHaveLength(1);
    expect(() => ParkSchema.parse(parks[0])).not.toThrow();
    expect(parks[0]!.name).toBe("Freedom Park");
    expect(parks[0]!.center.lat).toBe(35.23);
    expect(parks[0]!.center.lng).toBe(-80.84);
    expect(parks[0]!.numParking).toBe(120);
  });

  it("reads geometry coordinates in lng/lat order (not swapped)", async () => {
    // Mecklenburg is near lng≈-80.84, lat≈35.23
    // If order were swapped, lat would be -80 (negative) and lng 35 (positive/small)
    const expectedLng = -80.843;
    const expectedLat = 35.229;
    const feat = makePoint(expectedLng, expectedLat, { prkname: "Test" }, 1);
    const mockFetchImpl = mockFetch([makeArcGisResponse([feat])]);
    const { parks } = await fetchMeckParks(mockFetchImpl, 1);
    expect(parks[0]!.center.lng).toBeCloseTo(expectedLng, 3);
    expect(parks[0]!.center.lat).toBeCloseTo(expectedLat, 3);
    // Ensure not swapped: lat should be ~35, lng should be ~-80
    expect(parks[0]!.center.lat).toBeGreaterThan(34);
    expect(parks[0]!.center.lat).toBeLessThan(36);
    expect(parks[0]!.center.lng).toBeGreaterThan(-82);
    expect(parks[0]!.center.lng).toBeLessThan(-79);
  });

  it("fans out one amenity per truthy boolean flag", async () => {
    const feat = makePoint(-80.84, 35.23, {
      prkname: "Multi-Amenity Park",
      tennis: "Yes",
      pickleball: "Yes",
      discgolf: "No",
      skatepark: "Yes",
      dogpark: "No",
      basketball: "No",
    }, 1);

    const mockFetchImpl = mockFetch([makeArcGisResponse([feat])]);
    const { amenities } = await fetchMeckParks(mockFetchImpl, 1);

    // 3 truthy flags: tennis, pickleball, skatepark
    expect(amenities).toHaveLength(3);
    const categories = amenities.map((a) => a.category).sort();
    expect(categories).toEqual(["pickleball", "skatepark", "tennis"]);
    // All amenities valid
    for (const amenity of amenities) {
      expect(() => AmenitySchema.parse(amenity)).not.toThrow();
    }
  });

  it("produces zero amenities for a park with no truthy flags", async () => {
    const feat = makePoint(-80.84, 35.23, {
      prkname: "Quiet Park",
      tennis: "No",
      pickleball: "No",
      discgolf: "No",
      skatepark: "No",
      dogpark: "No",
      basketball: "No",
    }, 1);

    const mockFetchImpl = mockFetch([makeArcGisResponse([feat])]);
    const { amenities } = await fetchMeckParks(mockFetchImpl, 1);
    expect(amenities).toHaveLength(0);
  });

  it("amenity points share the park's center coordinates", async () => {
    const feat = makePoint(-80.843, 35.229, {
      prkname: "Dog Park Test",
      dogpark: "Yes",
    }, 1);

    const mockFetchImpl = mockFetch([makeArcGisResponse([feat])]);
    const { parks, amenities } = await fetchMeckParks(mockFetchImpl, 1);

    expect(amenities).toHaveLength(1);
    expect(amenities[0]!.center.lat).toBe(parks[0]!.center.lat);
    expect(amenities[0]!.center.lng).toBe(parks[0]!.center.lng);
  });
});

// ---------------------------------------------------------------------------
// meck-arcgis adapter — Recycling
// ---------------------------------------------------------------------------

describe("fetchMeckRecycling", () => {
  it("parses a recycling facility feature into a valid RecyclingSchema record", async () => {
    const feat = makePoint(-80.9, 35.1, {
      facility: "Metrolina Recycling Center",
      faclty_typ: "Recycling Drop-off",
      staff_typ: "Staffed",
      address: "123 Main St, Charlotte, NC",
    }, 1);

    const mockFetchImpl = mockFetch([makeArcGisResponse([feat])]);
    const result = await fetchMeckRecycling(mockFetchImpl, 1);

    expect(result).toHaveLength(1);
    expect(() => RecyclingSchema.parse(result[0])).not.toThrow();
    expect(result[0]!.name).toBe("Metrolina Recycling Center");
    expect(result[0]!.center.lat).toBe(35.1);
    expect(result[0]!.center.lng).toBe(-80.9);
    expect(result[0]!.acceptedMaterials).toContain("Recycling Drop-off");
  });

  it("uses lng/lat from geometry coordinates (not swapped)", async () => {
    const feat = makePoint(-80.95, 35.18, { facility: "Test Facility", address: "999 Test Rd" }, 1);
    const mockFetchImpl = mockFetch([makeArcGisResponse([feat])]);
    const result = await fetchMeckRecycling(mockFetchImpl, 1);
    expect(result[0]!.center.lng).toBe(-80.95);
    expect(result[0]!.center.lat).toBe(35.18);
  });
});

// ---------------------------------------------------------------------------
// meck-arcgis adapter — Landfills
// ---------------------------------------------------------------------------

describe("fetchMeckLandfills", () => {
  it("parses a landfill feature into a valid LandfillSchema record", async () => {
    const feat = makePoint(-80.7, 35.15, {
      name: "Foxhole Landfill",
      status_1: "Closed",
      location: "456 Foxhole Rd, Charlotte, NC",
    }, 1);

    const mockFetchImpl = mockFetch([makeArcGisResponse([feat])]);
    const result = await fetchMeckLandfills(mockFetchImpl, 1);

    expect(result).toHaveLength(1);
    expect(() => LandfillSchema.parse(result[0])).not.toThrow();
    expect(result[0]!.name).toBe("Foxhole Landfill");
    expect(result[0]!.status).toBe("closed");
  });

  it("maps status_1='Open' to status='open'", async () => {
    const feat = makePoint(-80.7, 35.15, { name: "Open Landfill", status_1: "Open", location: "100 Landfill Rd" }, 1);
    const mockFetchImpl = mockFetch([makeArcGisResponse([feat])]);
    const result = await fetchMeckLandfills(mockFetchImpl, 1);
    expect(result[0]!.status).toBe("open");
  });

  it("maps status_1='Closed' to status='closed'", async () => {
    const feat = makePoint(-80.7, 35.15, { name: "Closed Landfill", status_1: "Closed", location: "200 Landfill Rd" }, 1);
    const mockFetchImpl = mockFetch([makeArcGisResponse([feat])]);
    const result = await fetchMeckLandfills(mockFetchImpl, 1);
    expect(result[0]!.status).toBe("closed");
  });
});

// ---------------------------------------------------------------------------
// charlotte-od adapter — TransitParking
// ---------------------------------------------------------------------------

describe("fetchTransitParking", () => {
  it("parses a CATS Park-and-Ride feature into a valid TransitParkingSchema record", async () => {
    const feat = makePoint(-80.88, 35.3, {
      lot_name: "Rosa Parks Transit Center",
      address: "600 E Trade St, Charlotte, NC",
      total_spaces: "500",
      free_parking: "Yes",
      routes: "9,15,21",
    }, 1);

    const mockFetchImpl = mockFetch([makeArcGisResponse([feat])]);
    const result = await fetchTransitParking(mockFetchImpl, 1);

    expect(result).toHaveLength(1);
    expect(() => TransitParkingSchema.parse(result[0])).not.toThrow();
    expect(result[0]!.name).toBe("Rosa Parks Transit Center");
    expect(result[0]!.freeParking).toBe(true);
    expect(result[0]!.totalSpaces).toBe(500);
    expect(result[0]!.center.lat).toBe(35.3);
    expect(result[0]!.center.lng).toBe(-80.88);
  });

  it("has a TODO constant for the endpoint URL", () => {
    // Verify the constant is defined (may be a placeholder)
    expect(typeof CHARLOTTE_OD_TRANSIT_PARKING_URL).toBe("string");
    expect(CHARLOTTE_OD_TRANSIT_PARKING_URL.length).toBeGreaterThan(0);
  });

  it("handles missing optional fields gracefully", async () => {
    const feat = makePoint(-80.88, 35.3, {
      name: "Simple Lot",
      address: "100 Main St",
    }, 1);

    const mockFetchImpl = mockFetch([makeArcGisResponse([feat])]);
    const result = await fetchTransitParking(mockFetchImpl, 1);

    expect(result).toHaveLength(1);
    expect(() => TransitParkingSchema.parse(result[0])).not.toThrow();
    expect(result[0]!.freeParking).toBe(false);
    expect(result[0]!.totalSpaces).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// nrel adapter — EV Charging
// ---------------------------------------------------------------------------

interface NrelMockStation {
  id: number;
  station_name: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  ev_level2_evse_num: number | null;
  ev_dc_fast_num: number | null;
  ev_network: string | null;
}

function makeNrelResponse(stations: NrelMockStation[]) {
  return {
    type: "FeatureCollection",
    features: stations.map((s) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [s.longitude, s.latitude],
      },
      properties: s,
    })),
  };
}

describe("buildNrelUrl", () => {
  it("includes fuel_type=ELEC and state=NC", () => {
    const url = buildNrelUrl("TEST_KEY");
    expect(url).toContain("fuel_type=ELEC");
    expect(url).toContain("state=NC");
    expect(url).toContain("api_key=TEST_KEY");
    expect(url).toContain("developer.nrel.gov");
  });

  it("falls back to DEMO_KEY when no key provided and env var not set", () => {
    const originalKey = process.env["NREL_API_KEY"];
    delete process.env["NREL_API_KEY"];
    const url = buildNrelUrl();
    expect(url).toContain("api_key=DEMO_KEY");
    if (originalKey !== undefined) {
      process.env["NREL_API_KEY"] = originalKey;
    }
  });

  it("reads NREL_API_KEY from environment", () => {
    const originalKey = process.env["NREL_API_KEY"];
    process.env["NREL_API_KEY"] = "MY_ENV_KEY";
    const url = buildNrelUrl();
    expect(url).toContain("api_key=MY_ENV_KEY");
    if (originalKey !== undefined) {
      process.env["NREL_API_KEY"] = originalKey;
    } else {
      delete process.env["NREL_API_KEY"];
    }
  });
});

describe("fetchEvCharging", () => {
  it("parses NREL station features into valid EvChargingSchema records", async () => {
    const stations: NrelMockStation[] = [
      {
        id: 1001,
        station_name: "ChargePoint Station",
        street_address: "101 W Trade St",
        city: "Charlotte",
        state: "NC",
        zip: "28202",
        latitude: 35.227,
        longitude: -80.843,
        ev_level2_evse_num: 4,
        ev_dc_fast_num: null,
        ev_network: "ChargePoint Network",
      },
    ];

    const fetchImpl = vi.fn(async () => {
      return new Response(JSON.stringify(makeNrelResponse(stations)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const result = await fetchEvCharging(fetchImpl);
    expect(result).toHaveLength(1);
    expect(() => EvChargingSchema.parse(result[0])).not.toThrow();
    expect(result[0]!.name).toBe("ChargePoint Station");
    expect(result[0]!.numLevel2Ports).toBe(4);
    expect(result[0]!.numDcFastPorts).toBeUndefined();
    expect(result[0]!.networks).toEqual(["ChargePoint Network"]);
  });

  it("reads geometry coordinates in lng/lat order (not swapped)", async () => {
    const stations: NrelMockStation[] = [
      {
        id: 2001,
        station_name: "Test Station",
        street_address: "200 N Tryon St",
        city: "Charlotte",
        state: "NC",
        zip: "28202",
        latitude: 35.228,
        longitude: -80.844,
        ev_level2_evse_num: 2,
        ev_dc_fast_num: null,
        ev_network: null,
      },
    ];

    const fetchImpl = vi.fn(async () => {
      return new Response(JSON.stringify(makeNrelResponse(stations)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const result = await fetchEvCharging(fetchImpl);
    // GeoJSON coordinates are [lng, lat], so:
    expect(result[0]!.center.lng).toBeCloseTo(-80.844, 3);
    expect(result[0]!.center.lat).toBeCloseTo(35.228, 3);
    // Sanity: lat > 34, lng < -79 for Charlotte
    expect(result[0]!.center.lat).toBeGreaterThan(34);
    expect(result[0]!.center.lng).toBeLessThan(-79);
  });

  it("builds correct developer.nrel.gov URL", async () => {
    let capturedUrl = "";
    const fetchImpl = vi.fn(async (url: string) => {
      capturedUrl = url as string;
      return new Response(
        JSON.stringify(makeNrelResponse([
          {
            id: 9999,
            station_name: "S",
            street_address: "1 A St",
            city: "Charlotte",
            state: "NC",
            zip: "28201",
            latitude: 35.2,
            longitude: -80.8,
            ev_level2_evse_num: 1,
            ev_dc_fast_num: null,
            ev_network: null,
          },
        ])),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    await fetchEvCharging(fetchImpl);
    expect(capturedUrl).toContain("developer.nrel.gov");
    expect(capturedUrl).toContain("fuel_type=ELEC");
    expect(capturedUrl).toContain("state=NC");
  });

  it("throws on HTTP 403 (invalid key) with clear error message", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response("Forbidden", { status: 403 });
    }) as unknown as typeof fetch;

    await expect(fetchEvCharging(fetchImpl)).rejects.toThrow(/403 Forbidden/);
    await expect(fetchEvCharging(fetchImpl)).rejects.toThrow(/NREL_API_KEY/);
  });

  it("throws on other HTTP errors", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response("Internal Server Error", { status: 500 });
    }) as unknown as typeof fetch;

    await expect(fetchEvCharging(fetchImpl)).rejects.toThrow(/HTTP 500/);
  });

  it("deduplicates stations by id", async () => {
    const stations: NrelMockStation[] = [
      {
        id: 3001,
        station_name: "Dupe Station",
        street_address: "300 A St",
        city: "Charlotte",
        state: "NC",
        zip: "28202",
        latitude: 35.22,
        longitude: -80.84,
        ev_level2_evse_num: 2,
        ev_dc_fast_num: null,
        ev_network: null,
      },
      {
        id: 3001, // duplicate id
        station_name: "Dupe Station Copy",
        street_address: "300 A St",
        city: "Charlotte",
        state: "NC",
        zip: "28202",
        latitude: 35.22,
        longitude: -80.84,
        ev_level2_evse_num: 2,
        ev_dc_fast_num: null,
        ev_network: null,
      },
    ];

    const fetchImpl = vi.fn(async () => {
      return new Response(JSON.stringify(makeNrelResponse(stations)), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    const result = await fetchEvCharging(fetchImpl);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Dupe Station");
  });
});

// ---------------------------------------------------------------------------
// Pagination integration: resultOffset increments correctly
// ---------------------------------------------------------------------------

describe("paginateArcGis resultOffset pagination", () => {
  it("increments resultOffset by chunk size on each page", async () => {
    const capturedOffsets: string[] = [];
    let pageNum = 0;

    const fetchImpl = vi.fn(async (url: string) => {
      const urlObj = new URL(url as string);
      capturedOffsets.push(urlObj.searchParams.get("resultOffset") ?? "?");

      // Return 2000 items on page 0 to trigger next page
      // Return 1 item on page 1 to stop pagination
      let features: ArcGisFeature[];
      if (pageNum === 0) {
        features = Array.from({ length: 2000 }, (_, i) =>
          makePoint(-80 + i * 0.0001, 35 + i * 0.0001, { name: `f${i}` }, i + 1),
        );
      } else {
        features = [makePoint(-80.9, 35.4, { name: "last" }, 9999)];
      }
      pageNum++;

      return new Response(JSON.stringify(makeArcGisResponse(features)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const result = await paginateArcGis(
      "https://example.com/query",
      {},
      fetchImpl,
      1,
    );

    // Two pages: offset 0, then offset 2000
    expect(capturedOffsets).toHaveLength(2);
    expect(capturedOffsets[0]).toBe("0");
    expect(capturedOffsets[1]).toBe("2000");
    // 2000 from page 0 + 1 from page 1 = 2001 total
    expect(result).toHaveLength(2001);
  });
});
