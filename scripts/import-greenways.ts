import fs from "node:fs";
import path from "node:path";
import { GreenwaySchema, type Greenway, haversineMiles } from "@clt/data-schema";

interface OsmFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry:
    | { type: "LineString"; coordinates: [number, number][] }
    | { type: "MultiLineString"; coordinates: [number, number][][] };
}

const MECK_BBOX = { minLng: -81.5, maxLng: -80, minLat: 34.9, maxLat: 35.6 };
const MAX_VERTICES_PER_SEGMENT = 10_000;
const MIN_EXPECTED_FEATURES = 10;

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const normalizeName = (name: string): string =>
  name.trim().replace(/\s+/g, " ");

const normalizeSurface = (value: unknown): Greenway["surface"] => {
  const s = String(value ?? "").toLowerCase();
  if (s.includes("paved") || s.includes("asphalt") || s.includes("concrete"))
    return "paved";
  if (
    s.includes("dirt") ||
    s.includes("gravel") ||
    s.includes("natural") ||
    s.includes("ground") ||
    s.includes("unpaved")
  )
    return "natural";
  return "mixed";
};

const computeLengthMiles = (geometry: OsmFeature["geometry"]): number => {
  const lines =
    geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
  let total = 0;
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const [lng1, lat1] = line[i - 1]!;
      const [lng2, lat2] = line[i]!;
      total += haversineMiles([lat1, lng1], [lat2, lng2]);
    }
  }
  return Math.round(total * 10) / 10;
};

const firstCoord = (geometry: OsmFeature["geometry"]): [number, number] => {
  if (geometry.type === "LineString") return geometry.coordinates[0]!;
  return geometry.coordinates[0]![0]!;
};

export const transformOsmWay = (
  feature: OsmFeature,
  lastVerified: string,
): Greenway => {
  const name = String(
    feature.properties["name"] ?? feature.properties["ref"] ?? "Unnamed Trail",
  );
  const firstPoint = firstCoord(feature.geometry);
  const [lng, lat] = firstPoint;
  return {
    slug: slugify(name),
    name,
    description: "",
    lengthMiles: computeLengthMiles(feature.geometry),
    surface: normalizeSurface(feature.properties["surface"]),
    trailheads: [{ name: `${name} (start)`, lat, lng }],
    geometry: feature.geometry,
    pointsOfInterest: [],
    photos: [],
    lastVerified,
  };
};

/**
 * Detects a Mecklenburg County GIS feature, matching both the historical
 * uppercase schema (TRAIL_NAME, OBJECTID, LENGTH_MI, SURFACE) used by hand-
 * crafted fixtures AND the live lowercase schema (trail_name, miles, etc.)
 * returned by the current REST endpoint as of 2026-05-21.
 */
export const isMeckFeature = (feature: OsmFeature): boolean => {
  const keys = Object.keys(feature.properties);
  const meckKeys = [
    // uppercase (legacy / fixtures)
    "TRAIL_NAME",
    "OBJECTID",
    "LENGTH_MI",
    "SURFACE",
    // lowercase (live endpoint)
    "trail_name",
    "objectid",
    "miles",
    "trail_surf",
    "trl_status",
    "surfgen",
  ];
  return meckKeys.some((k) => keys.includes(k));
};

const numberOrUndefined = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Transforms a Mecklenburg GIS feature into a Greenway. Reads lowercase
 * fields first (live endpoint), falls back to uppercase (legacy fixtures),
 * falls back to OSM names if neither is present.
 */
export const transformMeckFeature = (
  feature: OsmFeature,
  lastVerified: string,
): Greenway => {
  const props = feature.properties;
  const rawName = String(
    props["trail_name"] ??
      props["TRAIL_NAME"] ??
      props["name"] ??
      props["ref"] ??
      "Unnamed Trail",
  );
  const name = normalizeName(rawName);
  const firstPoint = firstCoord(feature.geometry);
  const [lng, lat] = firstPoint;

  // Length: prefer per-segment explicit miles field; derive from geometry if absent
  const explicitMiles =
    numberOrUndefined(props["miles"]) ?? numberOrUndefined(props["LENGTH_MI"]);
  const lengthMiles =
    explicitMiles !== undefined
      ? Math.round(explicitMiles * 10) / 10
      : computeLengthMiles(feature.geometry);

  // Surface: prefer surfgen (Paved/Natural/Unpaved), then trail_surf/SURFACE, then OSM surface
  const surface = normalizeSurface(
    props["surfgen"] ?? props["trail_surf"] ?? props["SURFACE"] ?? props["surface"] ?? "mixed",
  );

  return {
    slug: slugify(name),
    name,
    description: "",
    lengthMiles,
    surface,
    trailheads: [{ name: `${name} (start)`, lat, lng }],
    geometry: feature.geometry,
    pointsOfInterest: [],
    photos: [],
    lastVerified,
  };
};

/* ------------------------------------------------------------------------- */
/* Grouping per trail_name into MultiLineString                              */
/* ------------------------------------------------------------------------- */

const coordsEqual = (
  a: [number, number],
  b: [number, number],
): boolean => a[0] === b[0] && a[1] === b[1];

const segmentInBbox = (coords: [number, number][]): boolean => {
  for (const [lng, lat] of coords) {
    if (
      lng < MECK_BBOX.minLng ||
      lng > MECK_BBOX.maxLng ||
      lat < MECK_BBOX.minLat ||
      lat > MECK_BBOX.maxLat
    ) {
      return false;
    }
  }
  return true;
};

const pickDisplayName = (variants: string[]): string => {
  if (variants.length === 0) return "Unnamed Trail";
  // Most non-whitespace characters wins; tie-break alphabetically (deterministic).
  return [...variants].sort((a, b) => {
    const lenA = a.replace(/\s/g, "").length;
    const lenB = b.replace(/\s/g, "").length;
    if (lenA !== lenB) return lenB - lenA;
    return a < b ? -1 : a > b ? 1 : 0;
  })[0]!;
};

/**
 * Groups Mecklenburg GIS features (one LineString per segment) into one
 * Greenway per normalized trail_name, emitted as a MultiLineString whose
 * coordinates array preserves each original segment as its own element.
 *
 * Critical: we do NOT concatenate segments into a single LineString. Doing
 * so would (a) add phantom inter-segment distance to computeLengthMiles, and
 * (b) cause MapLibre to draw straight lines between unrelated trail ends.
 */
export const groupByTrailName = (
  features: OsmFeature[],
  lastVerified: string,
): Greenway[] => {
  type Bucket = {
    nameVariants: string[];
    segments: [number, number][][];
    milesSum: number;
    milesMissing: boolean;
    surfaces: unknown[];
  };
  const buckets = new Map<string, Bucket>();
  let droppedShort = 0;
  let droppedOversize = 0;
  let droppedBbox = 0;

  for (const feature of features) {
    if (feature.geometry.type !== "LineString") continue;
    const coords = feature.geometry.coordinates;
    if (coords.length < 2) {
      droppedShort++;
      continue;
    }
    if (coords.length > MAX_VERTICES_PER_SEGMENT) {
      droppedOversize++;
      continue;
    }
    if (!segmentInBbox(coords)) {
      droppedBbox++;
      continue;
    }

    const rawName = String(
      feature.properties["trail_name"] ??
        feature.properties["TRAIL_NAME"] ??
        feature.properties["name"] ??
        "Unnamed Trail",
    );
    const norm = normalizeName(rawName);
    if (!norm) continue;
    const key = norm.toLowerCase();

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        nameVariants: [],
        segments: [],
        milesSum: 0,
        milesMissing: false,
        surfaces: [],
      };
      buckets.set(key, bucket);
    }
    bucket.nameVariants.push(norm);
    bucket.segments.push(coords);

    const m = numberOrUndefined(feature.properties["miles"]);
    if (m !== undefined) {
      bucket.milesSum += m;
    } else {
      bucket.milesMissing = true;
      bucket.milesSum += computeLengthMiles({
        type: "LineString",
        coordinates: coords,
      });
    }

    const surf =
      feature.properties["surfgen"] ??
      feature.properties["trail_surf"] ??
      feature.properties["SURFACE"];
    if (surf !== undefined) bucket.surfaces.push(surf);
  }

  if (droppedShort || droppedOversize || droppedBbox) {
    console.warn(
      `groupByTrailName dropped segments: short=${droppedShort} oversize=${droppedOversize} out_of_bbox=${droppedBbox}`,
    );
  }

  const greenways: Greenway[] = [];
  for (const bucket of buckets.values()) {
    if (bucket.segments.length === 0) continue;

    // Drop duplicate vertex when segment N ends where segment N+1 starts.
    // Keep original order — we don't try to reorder segments topologically;
    // ArcGIS OBJECTID order is arbitrary and we expose MultiLineString
    // exactly to make the disconnection explicit. Skip dedup when the
    // earlier segment is only 2 coords (slicing would leave it with 1, which
    // fails the per-line min-2 constraint in GreenwayGeometry).
    const deduped: [number, number][][] = [];
    for (let i = 0; i < bucket.segments.length; i++) {
      const cur = bucket.segments[i]!;
      const next = bucket.segments[i + 1];
      if (
        next &&
        cur.length > 2 &&
        coordsEqual(cur[cur.length - 1]!, next[0]!)
      ) {
        deduped.push(cur.slice(0, -1));
      } else {
        deduped.push(cur);
      }
    }

    // Pick the geographically northernmost endpoint across all segments as
    // the trailhead. Real trailhead data should come from a POI dataset
    // (TODO); this is a deterministic placeholder so the schema constraint
    // (trailheads.min(1)) is satisfied.
    let trailheadCoord: [number, number] = deduped[0]![0]!;
    let bestLat = -Infinity;
    for (const seg of deduped) {
      for (const coord of seg) {
        if (coord[1] > bestLat) {
          bestLat = coord[1];
          trailheadCoord = coord;
        }
      }
    }

    const displayName = pickDisplayName(bucket.nameVariants);
    const surface = normalizeSurface(bucket.surfaces[0]);
    const lengthMiles = Math.round(bucket.milesSum * 10) / 10;
    if (lengthMiles <= 0) continue;

    greenways.push({
      slug: slugify(displayName),
      name: displayName,
      description: "",
      lengthMiles,
      surface,
      trailheads: [
        {
          name: `${displayName} (start)`,
          lat: trailheadCoord[1],
          lng: trailheadCoord[0],
        },
      ],
      geometry: {
        type: "MultiLineString",
        coordinates: deduped,
      },
      pointsOfInterest: [],
      photos: [],
      lastVerified,
    });
  }

  return greenways;
};

/* ------------------------------------------------------------------------- */
/* Fetchers                                                                  */
/* ------------------------------------------------------------------------- */

const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  way["highway"="cycleway"](35.05,-81.05,35.45,-80.55);
  way["highway"="footway"]["bicycle"="designated"](35.05,-81.05,35.45,-80.55);
  way["route"="hiking"](35.05,-81.05,35.45,-80.55);
  relation["route"="bicycle"](35.05,-81.05,35.45,-80.55);
);
out geom;
`.trim();

type FetchImpl = typeof fetch;

const fetchOverpassGreenways = async (
  fetchImpl: FetchImpl = fetch,
): Promise<OsmFeature[]> => {
  const endpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.openstreetmap.ru/api/interpreter",
  ];
  let lastError: Error | null = null;
  for (const url of endpoints) {
    try {
      console.log(`Trying Overpass endpoint: ${url}`);
      const body = new URLSearchParams({ data: OVERPASS_QUERY });
      const res = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!res.ok) {
        lastError = new Error(`Overpass: ${res.status} from ${url}`);
        console.warn(lastError.message);
        continue;
      }
      const data = (await res.json()) as {
        elements: {
          type: "way" | "relation";
          id: number;
          tags?: Record<string, string>;
          geometry?: { lat: number; lon: number }[];
        }[];
      };
      return data.elements
        .filter((e) => e.geometry && e.geometry.length >= 2 && e.tags?.name)
        .map((e) => ({
          type: "Feature" as const,
          properties: {
            "@id": `${e.type}/${e.id}`,
            ...(e.tags ?? {}),
          },
          geometry: {
            type: "LineString" as const,
            coordinates: e.geometry!.map(
              (p) => [p.lon, p.lat] as [number, number],
            ),
          },
        }));
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn(`Endpoint ${url} failed: ${lastError.message}`);
    }
  }
  throw lastError ?? new Error("All Overpass endpoints failed");
};

const MECK_REST_BASE =
  "https://meckgis.mecklenburgcountync.gov/server/rest/services/GreenwayTrails/FeatureServer/0/query";

const MECK_OPENDATA_URL =
  "https://data.charlottenc.gov/api/download/v1/items/9a147a92a6694158bbc162aa879ca7a3/geojson?layers=0";

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: OsmFeature[];
}

/**
 * Fetches the live Mecklenburg County GIS GreenwayTrails feature service.
 * Paginates 2000 records at a time. Filters server-side on trl_status =
 * 'Active'. Throws if the total feature count is implausibly low (catches
 * the "HTTP 200 with JSON error body" failure mode).
 */
export const fetchMeckRest = async (
  fetchImpl: FetchImpl = fetch,
): Promise<OsmFeature[]> => {
  const all: OsmFeature[] = [];
  const seenObjectIds = new Set<unknown>();
  let offset = 0;
  const chunk = 2000;
  // Safety cap so a misbehaving endpoint can't drive us infinite.
  for (let page = 0; page < 50; page++) {
    const params = new URLSearchParams({
      where: "trl_status='Active'",
      outFields: "*",
      f: "geojson",
      outSR: "4326",
      resultOffset: String(offset),
      resultRecordCount: String(chunk),
      // ArcGIS REST without orderBy can return duplicate/missing rows across
      // pages. Sort by objectid for stable pagination.
      orderByFields: "objectid",
    });
    const url = `${MECK_REST_BASE}?${params.toString()}`;
    const res = await fetchImpl(url);
    if (!res.ok) {
      throw new Error(`Meck REST: ${res.status} on page ${page}`);
    }
    const data = (await res.json()) as GeoJSONFeatureCollection & {
      error?: unknown;
    };
    if (!Array.isArray(data.features)) {
      throw new Error(
        `Meck REST: expected features array on page ${page}, got ${typeof data.features}`,
      );
    }
    // Dedup by objectid in case the endpoint ignores resultOffset or repeats
    // pages — otherwise milesSum inflates silently and trail lengths are wrong.
    let newOnPage = 0;
    for (const feat of data.features) {
      const oid = feat.properties.objectid ?? feat.properties.OBJECTID;
      if (oid !== undefined && seenObjectIds.has(oid)) continue;
      if (oid !== undefined) seenObjectIds.add(oid);
      all.push(feat);
      newOnPage++;
    }
    if (data.features.length === chunk && newOnPage === 0) {
      // Endpoint returned a full page but every record was a duplicate —
      // either pagination is broken or we're hitting the safety cap loop.
      throw new Error(
        `Meck REST: page ${page} returned ${chunk} duplicate features (objectid collision). Pagination contract may have changed.`,
      );
    }
    if (data.features.length < chunk) break;
    offset += chunk;
  }
  if (all.length < MIN_EXPECTED_FEATURES) {
    throw new Error(
      `Meck REST: only ${all.length} unique features returned (< ${MIN_EXPECTED_FEATURES}). Endpoint may be returning an error body.`,
    );
  }
  return all;
};

/**
 * Fetches the Charlotte Open Data item-ID GeoJSON download as a fallback.
 * Item IDs can change when datasets are republished, so this is the
 * secondary source.
 */
export const fetchMeckOpenData = async (
  fetchImpl: FetchImpl = fetch,
): Promise<OsmFeature[]> => {
  const res = await fetchImpl(MECK_OPENDATA_URL);
  if (!res.ok) {
    throw new Error(`Meck OpenData: ${res.status}`);
  }
  const data = (await res.json()) as GeoJSONFeatureCollection & {
    error?: unknown;
  };
  if (!Array.isArray(data.features)) {
    throw new Error(
      `Meck OpenData: expected features array, got ${typeof data.features}`,
    );
  }
  // Filter to active only (open-data download doesn't filter server-side).
  const active = data.features.filter(
    (f) => f.properties["trl_status"] === "Active",
  );
  if (active.length < MIN_EXPECTED_FEATURES) {
    throw new Error(
      `Meck OpenData: only ${active.length} active features. Item ID may have changed.`,
    );
  }
  return active;
};

/* ------------------------------------------------------------------------- */
/* CLI                                                                       */
/* ------------------------------------------------------------------------- */

const parseSource = (args: string[]): string | null => {
  const arg = args.find((a) => a.startsWith("--source="));
  return arg ? arg.replace("--source=", "") : null;
};

const run = async () => {
  const args = process.argv.slice(2);
  const fileArg =
    args.find((a) => !a.startsWith("--")) ?? undefined;
  const outArg = args.find((a) => a.startsWith("--out="))?.replace("--out=", "");
  const source = parseSource(args) ?? (fileArg ? "file" : "meck-rest");

  const today = new Date().toISOString().slice(0, 10);
  const outDir = outArg ? path.resolve(outArg) : path.resolve("data/greenways");
  fs.mkdirSync(outDir, { recursive: true });

  let features: OsmFeature[] = [];
  if (source === "file" && fileArg) {
    const fc = JSON.parse(fs.readFileSync(fileArg, "utf8")) as {
      features: OsmFeature[];
    };
    features = fc.features;
    console.log(`Loaded ${features.length} features from ${fileArg}`);
  } else if (source === "meck-rest") {
    console.log("Fetching greenways from Mecklenburg REST endpoint...");
    features = await fetchMeckRest();
    console.log(`Fetched ${features.length} features from Meck REST`);
  } else if (source === "meck-opendata") {
    console.log("Fetching greenways from Charlotte Open Data download...");
    features = await fetchMeckOpenData();
    console.log(`Fetched ${features.length} active features from Open Data`);
  } else if (source === "overpass") {
    console.log("Fetching greenways from OSM Overpass...");
    features = await fetchOverpassGreenways();
    console.log(`Fetched ${features.length} features from OSM Overpass`);
  } else {
    throw new Error(
      `Unknown --source=${source}. Valid: meck-rest (default), meck-opendata, overpass, or pass a file path.`,
    );
  }

  let greenways: Greenway[];
  if (
    (source === "meck-rest" || source === "meck-opendata") ||
    (features.length > 0 && isMeckFeature(features[0]!))
  ) {
    console.log("Grouping segments by trail_name into MultiLineString trails...");
    const active = features.filter(
      (f) =>
        source === "overpass" ||
        source === "file" ||
        f.properties["trl_status"] === "Active",
    );
    greenways = groupByTrailName(active, today);
    console.log(`Grouped into ${greenways.length} unique trails`);
  } else {
    // OSM/Overpass or unknown — use the per-feature OSM transformer with
    // slug-based dedup (longer entry wins).
    const transform = transformOsmWay;
    const bySlug = new Map<string, Greenway>();
    for (const feature of features) {
      const greenway = transform(feature, today);
      const existing = bySlug.get(greenway.slug);
      if (!existing || greenway.lengthMiles > existing.lengthMiles) {
        bySlug.set(greenway.slug, greenway);
      }
    }
    greenways = Array.from(bySlug.values());
  }

  // Wipe previous greenway files so removed trails actually go away.
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith(".json")) fs.unlinkSync(path.join(outDir, f));
  }

  // Detect slug collisions before writing — otherwise two distinct trail_names
  // that slugify to the same value would silently overwrite each other.
  const slugsSeen = new Map<string, string>();
  for (const greenway of greenways) {
    const prior = slugsSeen.get(greenway.slug);
    if (prior && prior !== greenway.name) {
      throw new Error(
        `Slug collision: "${prior}" and "${greenway.name}" both slugify to "${greenway.slug}". Add a disambiguator in the importer or rename one trail.`,
      );
    }
    slugsSeen.set(greenway.slug, greenway.name);
  }

  const entries: { slug: string; name: string }[] = [];
  for (const greenway of greenways) {
    try {
      GreenwaySchema.parse(greenway);
    } catch (e) {
      console.warn(
        `Skipping invalid greenway "${greenway.slug}": ${e instanceof Error ? e.message : String(e)}`,
      );
      continue;
    }
    fs.writeFileSync(
      path.join(outDir, `${greenway.slug}.json`),
      JSON.stringify(greenway, null, 2) + "\n",
    );
    entries.push({ slug: greenway.slug, name: greenway.name });
  }
  entries.sort((a, b) => (a.slug < b.slug ? -1 : 1));
  fs.writeFileSync(
    path.join(outDir, "_index.json"),
    JSON.stringify({ entries }, null, 2) + "\n",
  );
  console.log(`Wrote ${entries.length} greenways to ${outDir}`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
