/**
 * import-gis.ts
 *
 * Shared GIS importer with pluggable source adapters for point-entity datasets.
 * Adapters: meck-arcgis, charlotte-od, nrel
 *
 * Patterns preserved from import-greenways.ts:
 *  - resultOffset pagination
 *  - objectid-based dedup
 *  - MIN_EXPECTED_FEATURES guard that throws on suspiciously short/empty response
 *  - outSR=4326 + geometry object (not raw x/y attributes) for meck-arcgis
 */

import fs from "node:fs";
import path from "node:path";

import {
  ParkSchema,
  RecyclingSchema,
  TransitParkingSchema,
  EvChargingSchema,
  LandfillSchema,
  AmenitySchema,
  type Park,
  type Recycling,
  type TransitParking,
  type EvCharging,
  type Landfill,
  type Amenity,
  type AmenityCategory,
} from "@clt/data-schema";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type FetchImpl = typeof fetch;

/**
 * ArcGIS REST API feature shape when f=geojson and outSR=4326 is requested.
 * The `geometry` object contains lng/lat in GeoJSON order (x=lng, y=lat).
 */
export interface ArcGisFeature {
  type: "Feature";
  id?: string | number;
  properties: Record<string, unknown>;
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat] — GeoJSON order
  };
}

export interface ArcGisFeatureCollection {
  type: "FeatureCollection";
  features: ArcGisFeature[];
}

// ---------------------------------------------------------------------------
// Shared pipeline utilities
// ---------------------------------------------------------------------------

const MIN_EXPECTED_FEATURES = 3;

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Paginates an ArcGIS FeatureServer endpoint using resultOffset.
 * Deduplicates records by OBJECTID to guard against endpoint bugs.
 * Throws if fewer than minExpected unique features are returned.
 */
export async function paginateArcGis(
  baseUrl: string,
  extraParams: Record<string, string>,
  fetchImpl: FetchImpl,
  minExpected: number = MIN_EXPECTED_FEATURES,
): Promise<ArcGisFeature[]> {
  const all: ArcGisFeature[] = [];
  const seenObjectIds = new Set<unknown>();
  let offset = 0;
  const chunk = 2000;

  for (let page = 0; page < 50; page++) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "*",
      f: "geojson",
      outSR: "4326",
      resultOffset: String(offset),
      resultRecordCount: String(chunk),
      orderByFields: "OBJECTID",
      ...extraParams,
    });
    const url = `${baseUrl}?${params.toString()}`;
    const res = await fetchImpl(url);
    if (!res.ok) {
      throw new Error(`ArcGIS fetch: HTTP ${res.status} on page ${page} (${baseUrl})`);
    }
    const data = (await res.json()) as ArcGisFeatureCollection & {
      error?: unknown;
    };
    if (data.error) {
      throw new Error(
        `ArcGIS fetch: server returned error on page ${page}: ${JSON.stringify(data.error)}`,
      );
    }
    if (!Array.isArray(data.features)) {
      throw new Error(
        `ArcGIS fetch: expected features array on page ${page}, got ${typeof data.features}`,
      );
    }

    let newOnPage = 0;
    for (const feat of data.features) {
      const oid =
        feat.properties["OBJECTID"] ??
        feat.properties["objectid"] ??
        feat.properties["FID"];
      if (oid !== undefined && seenObjectIds.has(oid)) continue;
      if (oid !== undefined) seenObjectIds.add(oid);
      all.push(feat);
      newOnPage++;
    }

    if (data.features.length === chunk && newOnPage === 0) {
      throw new Error(
        `ArcGIS fetch: page ${page} returned ${chunk} duplicate features (objectid collision). Pagination contract may have changed.`,
      );
    }
    if (data.features.length < chunk) break;
    offset += chunk;
  }

  if (all.length < minExpected) {
    throw new Error(
      `ArcGIS fetch: only ${all.length} unique features returned (< ${minExpected}). Endpoint may be returning an error body.`,
    );
  }
  return all;
}

// ---------------------------------------------------------------------------
// meck-arcgis adapter
// ---------------------------------------------------------------------------

const MECK_BASE = "https://meckgis.mecklenburgcountync.gov/server/rest/services";

const MECK_PARKS_URL = `${MECK_BASE}/ParkLocations/FeatureServer/0/query`;
const MECK_RECYCLING_URL = `${MECK_BASE}/SolidWasteFacility/FeatureServer/0/query`;
const MECK_LANDFILLS_URL = `${MECK_BASE}/Landfills/FeatureServer/0/query`;

/**
 * Boolean flag attributes present on ParkLocations features.
 * Values are "Yes" / "No" strings from the service.
 */
const AMENITY_FLAGS: { field: string; category: AmenityCategory }[] = [
  { field: "tennis", category: "tennis" },
  { field: "pickleball", category: "pickleball" },
  { field: "discgolf", category: "disc-golf" },
  { field: "skatepark", category: "skatepark" },
  { field: "dogpark", category: "dog-park" },
  { field: "basketball", category: "basketball" },
];

const isTruthy = (value: unknown): boolean => {
  if (typeof value === "string") return value.toLowerCase() === "yes";
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return false;
};

export interface MeckParksResult {
  parks: Park[];
  amenities: Amenity[];
}

/**
 * Fetches ParkLocations from Mecklenburg GIS.
 * Returns both park records and fanned-out amenity points for each truthy
 * boolean flag (tennis, pickleball, discgolf, skatepark, dogpark, basketball).
 */
export async function fetchMeckParks(
  fetchImpl: FetchImpl = fetch,
  minExpected: number = MIN_EXPECTED_FEATURES,
): Promise<MeckParksResult> {
  const today = new Date().toISOString().slice(0, 10);
  const features = await paginateArcGis(MECK_PARKS_URL, {}, fetchImpl, minExpected);

  const parks: Park[] = [];
  const amenities: Amenity[] = [];

  for (const feat of features) {
    const p = feat.properties;
    const [lng, lat] = feat.geometry.coordinates;

    const name = String(p["prkname"] ?? p["name"] ?? "Unnamed Park");
    const slug = slugify(name);

    const numParkingRaw = p["numparking"];
    const numParking =
      numParkingRaw !== null &&
      numParkingRaw !== undefined &&
      numParkingRaw !== "" &&
      Number.isFinite(Number(numParkingRaw))
        ? Math.round(Number(numParkingRaw))
        : undefined;

    const parkUrlRaw = p["parkurl"];
    const parkUrl =
      typeof parkUrlRaw === "string" && parkUrlRaw.startsWith("http")
        ? parkUrlRaw
        : undefined;

    const amenityFlags = {
      tennis: isTruthy(p["tennis"]),
      pickleball: isTruthy(p["pickleball"]),
      discGolf: isTruthy(p["discgolf"]),
      skatepark: isTruthy(p["skatepark"]),
      dogPark: isTruthy(p["dogpark"]),
      basketball: isTruthy(p["basketball"]),
    };

    const park = ParkSchema.parse({
      slug,
      name,
      description: "",
      center: { lat, lng },
      numParking,
      parkUrl,
      amenities: amenityFlags,
      photos: [],
      lastVerified: today,
    });
    parks.push(park);

    // Fan out one Amenity point per truthy boolean flag
    for (const { field, category } of AMENITY_FLAGS) {
      if (!isTruthy(p[field])) continue;
      const amenitySlug = `${slug}-${category}`;
      const amenity = AmenitySchema.parse({
        slug: amenitySlug,
        name: `${name} — ${category}`,
        description: "",
        center: { lat, lng },
        category,
        photos: [],
        lastVerified: today,
      });
      amenities.push(amenity);
    }
  }

  return { parks, amenities };
}

/**
 * Fetches solid waste / recycling facilities from Mecklenburg GIS.
 * SolidWasteFacility fields: facility, faclty_typ, staff_typ
 */
export async function fetchMeckRecycling(
  fetchImpl: FetchImpl = fetch,
  minExpected: number = MIN_EXPECTED_FEATURES,
): Promise<Recycling[]> {
  const today = new Date().toISOString().slice(0, 10);
  const features = await paginateArcGis(MECK_RECYCLING_URL, {}, fetchImpl, minExpected);

  return features.map((feat) => {
    const p = feat.properties;
    const [lng, lat] = feat.geometry.coordinates;
    const name = String(p["facility"] ?? p["name"] ?? "Unnamed Facility");
    const facilityType = String(p["faclty_typ"] ?? "");
    const staffType = String(p["staff_typ"] ?? "");

    const acceptedMaterials: string[] = [];
    if (facilityType) acceptedMaterials.push(facilityType);
    if (staffType && staffType !== facilityType) acceptedMaterials.push(staffType);
    if (acceptedMaterials.length === 0) acceptedMaterials.push("solid waste");

    return RecyclingSchema.parse({
      slug: slugify(name),
      name,
      description: "",
      center: { lat, lng },
      address: String(p["address"] ?? ""),
      acceptedMaterials,
      photos: [],
      lastVerified: today,
    });
  });
}

/**
 * Fetches landfill records from Mecklenburg GIS.
 * Landfill fields: name, status_1 ("Closed"/"Open"), location
 */
export async function fetchMeckLandfills(
  fetchImpl: FetchImpl = fetch,
  minExpected: number = MIN_EXPECTED_FEATURES,
): Promise<Landfill[]> {
  const today = new Date().toISOString().slice(0, 10);
  const features = await paginateArcGis(MECK_LANDFILLS_URL, {}, fetchImpl, minExpected);

  return features.map((feat) => {
    const p = feat.properties;
    const [lng, lat] = feat.geometry.coordinates;
    const name = String(p["name"] ?? "Unnamed Landfill");
    const rawStatus = String(p["status_1"] ?? "").toLowerCase();
    const status: "open" | "closed" = rawStatus === "open" ? "open" : "closed";
    const address = String(p["location"] ?? p["address"] ?? "");

    return LandfillSchema.parse({
      slug: slugify(name),
      name,
      description: "",
      center: { lat, lng },
      address,
      status,
      photos: [],
      lastVerified: today,
    });
  });
}

// ---------------------------------------------------------------------------
// charlotte-od adapter (CATS Park-and-Ride lots)
// ---------------------------------------------------------------------------

// Verified CATS / City-of-Charlotte ArcGIS FeatureServer (61 lots, point geometry, OBJECTID present)
export const CHARLOTTE_OD_TRANSIT_PARKING_URL =
  "https://services.arcgis.com/9Nl857LBlQVyzq54/arcgis/rest/services/CATS_Park_and_Ride_Lots/FeatureServer/0/query";

/**
 * Fetches CATS Park-and-Ride lots from the verified City of Charlotte / CATS ArcGIS service.
 * Real field names: Name, Street/City/State (address), Spaces (totalSpaces),
 * Status ("No Cost" → freeParking), Type (transit mode → transitLines).
 */
export async function fetchTransitParking(
  fetchImpl: FetchImpl = fetch,
  minExpected: number = MIN_EXPECTED_FEATURES,
): Promise<TransitParking[]> {
  const today = new Date().toISOString().slice(0, 10);
  const features = await paginateArcGis(
    CHARLOTTE_OD_TRANSIT_PARKING_URL,
    {},
    fetchImpl,
    minExpected,
  );

  return features.map((feat) => {
    const p = feat.properties;
    const [lng, lat] = feat.geometry.coordinates;

    // Real field: Name (with fallback for older/alternate services)
    const name = String(p["Name"] ?? p["name"] ?? p["lot_name"] ?? "Unnamed Lot");

    // Real fields: Street, City, State — join into address string
    const streetParts = [p["Street"], p["City"], p["State"]]
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
    const address =
      streetParts.length > 0
        ? streetParts.join(", ")
        : String(p["address"] ?? p["location"] ?? "");

    // Real field: Spaces (number)
    const rawSpaces = p["Spaces"] ?? p["total_spaces"] ?? p["spaces"];
    const totalSpaces =
      rawSpaces !== null &&
      rawSpaces !== undefined &&
      Number.isFinite(Number(rawSpaces)) &&
      Number(rawSpaces) >= 0
        ? Math.round(Number(rawSpaces))
        : undefined;

    // Real field: Status — "No Cost" means free parking
    const statusRaw = p["Status"] ?? p["free_parking"] ?? p["free"];
    const freeParking =
      typeof statusRaw === "string"
        ? statusRaw === "No Cost" || isTruthy(statusRaw)
        : isTruthy(statusRaw);

    // Real field: Type (transit mode, e.g. "Bus", "Rail") → single-element transitLines array
    const typeRaw = p["Type"] ?? p["transit_lines"] ?? p["routes"];
    const transitLines =
      typeof typeRaw === "string" && typeRaw.trim()
        ? [typeRaw.trim()]
        : undefined;

    return TransitParkingSchema.parse({
      slug: slugify(name),
      name,
      description: "",
      center: { lat, lng },
      address,
      totalSpaces,
      freeParking,
      transitLines,
      photos: [],
      lastVerified: today,
    });
  });
}

// ---------------------------------------------------------------------------
// nrel adapter (NREL Alternative Fuel Stations — EV charging)
// ---------------------------------------------------------------------------

// NREL migrated developer.nrel.gov → developer.nlr.gov (old domain shut down
// 2026-05-29; it now returns 410 SCHEDULED_BROWNOUT). Use the new domain.
const NREL_BASE_URL = "https://developer.nlr.gov/api/alt-fuel-stations/v1.geojson";

/**
 * Mecklenburg County bounding box (approx). NREL returns all ~2,000 NC stations;
 * this is a Charlotte app, so we clip to the county to avoid flooding the map
 * with statewide pins. Widen these bounds if coverage should extend regionally.
 */
const MECK_BBOX = { minLat: 35.0, maxLat: 35.52, minLng: -81.06, maxLng: -80.55 };

const inMecklenburg = (lat: number, lng: number): boolean =>
  lat >= MECK_BBOX.minLat &&
  lat <= MECK_BBOX.maxLat &&
  lng >= MECK_BBOX.minLng &&
  lng <= MECK_BBOX.maxLng;

interface NrelStation {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
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
    [key: string]: unknown;
  };
}

interface NrelFeatureCollection {
  type: "FeatureCollection";
  features: NrelStation[];
}

/**
 * Builds the NREL EV charging stations URL.
 * Reads api key from NREL_API_KEY env var; falls back to "DEMO_KEY" for dev.
 */
export function buildNrelUrl(apiKey?: string): string {
  const key = apiKey ?? process.env["NREL_API_KEY"] ?? "DEMO_KEY";
  const params = new URLSearchParams({
    api_key: key,
    fuel_type: "ELEC",
    state: "NC",
  });
  return `${NREL_BASE_URL}?${params.toString()}`;
}

/**
 * Fetches EV charging stations from NREL for North Carolina.
 * Throws loudly on HTTP 403 (invalid key) rather than silently returning zero.
 */
export async function fetchEvCharging(
  fetchImpl: FetchImpl = fetch,
): Promise<EvCharging[]> {
  const today = new Date().toISOString().slice(0, 10);
  const url = buildNrelUrl();
  const res = await fetchImpl(url);

  if (res.status === 403) {
    throw new Error(
      `NREL API: HTTP 403 Forbidden. Set a valid NREL_API_KEY environment variable. ` +
        `Get a free key at https://developer.nlr.gov/signup/`,
    );
  }
  if (!res.ok) {
    throw new Error(`NREL API: HTTP ${res.status} fetching EV charging stations`);
  }

  const data = (await res.json()) as NrelFeatureCollection;
  if (!Array.isArray(data.features)) {
    throw new Error(
      `NREL API: expected features array, got ${typeof data.features}`,
    );
  }

  if (data.features.length < 1) {
    throw new Error(
      `NREL API: returned 0 EV charging stations for NC. Response may indicate an error.`,
    );
  }

  const seen = new Set<number>();
  const results: EvCharging[] = [];

  for (const feat of data.features) {
    const p = feat.properties;
    if (seen.has(p.id)) continue;
    seen.add(p.id);

    // Prefer geometry coordinates (GeoJSON order: [lng, lat]) for position
    const [lng, lat] = feat.geometry.coordinates;

    // Clip to Mecklenburg County — NREL returns the whole state.
    if (!inMecklenburg(lat, lng)) continue;

    const name = String(p.station_name ?? "Unnamed Station");
    const address = [p.street_address, p.city, p.state, p.zip]
      .filter(Boolean)
      .join(", ");

    const numLevel2 =
      p.ev_level2_evse_num !== null && p.ev_level2_evse_num !== undefined
        ? Math.max(0, Math.round(p.ev_level2_evse_num))
        : undefined;
    const numDcFast =
      p.ev_dc_fast_num !== null && p.ev_dc_fast_num !== undefined
        ? Math.max(0, Math.round(p.ev_dc_fast_num))
        : undefined;

    const networks =
      p.ev_network && p.ev_network.trim()
        ? [p.ev_network.trim()]
        : undefined;

    results.push(
      EvChargingSchema.parse({
        slug: slugify(`${name}-${p.id}`),
        name,
        description: "",
        center: { lat, lng },
        address,
        numLevel2Ports: numLevel2,
        numDcFastPorts: numDcFast,
        networks,
        photos: [],
        lastVerified: today,
      }),
    );
  }

  return results;
}

// ---------------------------------------------------------------------------
// Persistence helper (mirrors import-greenways.ts lines ~554-650)
// ---------------------------------------------------------------------------

/**
 * Writes per-slug JSON files + _index.json into `dir`, mirroring the
 * import-greenways.ts persistence pattern:
 *  1. mkdirSync (recursive)
 *  2. Delete all existing *.json files in the directory
 *  3. Write <slug>.json per record
 *  4. Write _index.json as { entries: [{slug, name}] } sorted by slug
 */
export function writeEntities(
  dir: string,
  records: Array<{ slug: string; name: string }>,
): void {
  fs.mkdirSync(dir, { recursive: true });

  // Wipe existing .json files so removed entities actually go away
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith(".json")) fs.unlinkSync(path.join(dir, f));
  }

  const entries: { slug: string; name: string }[] = [];
  for (const record of records) {
    fs.writeFileSync(
      path.join(dir, `${record.slug}.json`),
      JSON.stringify(record, null, 2) + "\n",
    );
    entries.push({ slug: record.slug, name: record.name });
  }

  entries.sort((a, b) => (a.slug < b.slug ? -1 : 1));
  fs.writeFileSync(
    path.join(dir, "_index.json"),
    JSON.stringify({ entries }, null, 2) + "\n",
  );
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

type AdapterName = "meck-parks" | "meck-recycling" | "meck-landfills" | "charlotte-od" | "nrel";

const VALID_ADAPTERS: AdapterName[] = [
  "meck-parks",
  "meck-recycling",
  "meck-landfills",
  "charlotte-od",
  "nrel",
];

const run = async () => {
  const args = process.argv.slice(2);
  const adapterArg = args.find((a) => a.startsWith("--adapter="))?.replace("--adapter=", "");
  const dryRun = args.includes("--dry-run");

  if (!adapterArg || !VALID_ADAPTERS.includes(adapterArg as AdapterName)) {
    throw new Error(
      `Usage: tsx scripts/import-gis.ts --adapter=<name> [--dry-run]\n` +
        `Valid adapters: ${VALID_ADAPTERS.join(", ")}`,
    );
  }

  const adapter = adapterArg as AdapterName;
  console.log(`Running import-gis adapter: ${adapter}${dryRun ? " (dry-run)" : ""}`);

  const repoRoot = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
  );

  switch (adapter) {
    case "meck-parks": {
      const { parks, amenities } = await fetchMeckParks();
      console.log(`Fetched ${parks.length} parks, ${amenities.length} amenity points`);
      if (!dryRun) {
        writeEntities(path.join(repoRoot, "data/parks"), parks);
        console.log(`Wrote ${parks.length} parks to data/parks`);
        writeEntities(path.join(repoRoot, "data/amenities"), amenities);
        console.log(`Wrote ${amenities.length} amenities to data/amenities`);
      }
      break;
    }
    case "meck-recycling": {
      const recycling = await fetchMeckRecycling();
      console.log(`Fetched ${recycling.length} recycling/solid-waste facilities`);
      if (!dryRun) {
        writeEntities(path.join(repoRoot, "data/recycling"), recycling);
        console.log(`Wrote ${recycling.length} recycling facilities to data/recycling`);
      }
      break;
    }
    case "meck-landfills": {
      const landfills = await fetchMeckLandfills();
      console.log(`Fetched ${landfills.length} landfills`);
      if (!dryRun) {
        writeEntities(path.join(repoRoot, "data/landfills"), landfills);
        console.log(`Wrote ${landfills.length} landfills to data/landfills`);
      }
      break;
    }
    case "charlotte-od": {
      const lots = await fetchTransitParking();
      console.log(`Fetched ${lots.length} CATS Park-and-Ride lots`);
      if (!dryRun) {
        writeEntities(path.join(repoRoot, "data/transit-parking"), lots);
        console.log(`Wrote ${lots.length} transit-parking lots to data/transit-parking`);
      }
      break;
    }
    case "nrel": {
      const stations = await fetchEvCharging();
      console.log(`Fetched ${stations.length} EV charging stations`);
      if (!dryRun) {
        writeEntities(path.join(repoRoot, "data/ev-charging"), stations);
        console.log(`Wrote ${stations.length} EV charging stations to data/ev-charging`);
      }
      break;
    }
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
