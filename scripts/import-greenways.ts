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

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeSurface = (value: unknown): Greenway["surface"] => {
  const s = String(value ?? "").toLowerCase();
  if (s.includes("paved") || s.includes("asphalt") || s.includes("concrete")) return "paved";
  if (s.includes("dirt") || s.includes("gravel") || s.includes("natural") || s.includes("ground") || s.includes("unpaved")) return "natural";
  return "mixed";
};

const computeLengthMiles = (geometry: OsmFeature["geometry"]): number => {
  const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
  let total = 0;
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const [lng1, lat1] = line[i - 1];
      const [lng2, lat2] = line[i];
      total += haversineMiles([lat1, lng1], [lat2, lng2]);
    }
  }
  return Math.round(total * 10) / 10;
};

const firstCoord = (geometry: OsmFeature["geometry"]): [number, number] => {
  if (geometry.type === "LineString") return geometry.coordinates[0];
  return geometry.coordinates[0][0];
};

export const transformOsmWay = (
  feature: OsmFeature,
  lastVerified: string,
): Greenway => {
  const name = String(feature.properties["name"] ?? feature.properties["ref"] ?? "Unnamed Trail");
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

const fetchOverpassGreenways = async (): Promise<OsmFeature[]> => {
  // Try multiple endpoints in case one is rate-limited or down
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
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!res.ok) {
        lastError = new Error(`Overpass: ${res.status} from ${url}`);
        console.warn(lastError.message);
        continue;
      }
      const data = await res.json() as {
        elements: Array<{ type: "way" | "relation"; id: number; tags?: Record<string,string>; geometry?: Array<{lat:number;lon:number}> }>;
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
            coordinates: e.geometry!.map((p) => [p.lon, p.lat] as [number, number]),
          },
        }));
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn(`Endpoint ${url} failed: ${lastError.message}`);
    }
  }
  throw lastError ?? new Error("All Overpass endpoints failed");
};

const run = async () => {
  const fileArg = process.argv[2];
  const outArg = process.argv.find((a) => a.startsWith("--out="))?.replace("--out=", "");
  const today = new Date().toISOString().slice(0, 10);
  const outDir = outArg ? path.resolve(outArg) : path.resolve("data/greenways");
  fs.mkdirSync(outDir, { recursive: true });

  let features: OsmFeature[] = [];

  if (fileArg && !fileArg.startsWith("--")) {
    // From local GeoJSON file
    const fc = JSON.parse(fs.readFileSync(fileArg, "utf8")) as { features: OsmFeature[] };
    features = fc.features;
    console.log(`Loaded ${features.length} features from ${fileArg}`);
  } else {
    // From OSM Overpass
    console.log("Fetching greenways from OSM Overpass...");
    features = await fetchOverpassGreenways();
    console.log(`Fetched ${features.length} features from OSM Overpass`);
  }

  // Deduplicate by slug
  const bySlug = new Map<string, Greenway>();
  for (const feature of features) {
    const greenway = transformOsmWay(feature, today);
    // Validate before writing
    try {
      GreenwaySchema.parse(greenway);
      // Keep the longer entry if a duplicate slug appears (likely a merged trail)
      const existing = bySlug.get(greenway.slug);
      if (!existing || greenway.lengthMiles > existing.lengthMiles) {
        bySlug.set(greenway.slug, greenway);
      }
    } catch (e) {
      console.warn(`Skipping invalid: ${greenway.slug} - ${e instanceof Error ? e.message : e}`);
    }
  }

  const entries: { slug: string; name: string }[] = [];
  for (const [, greenway] of bySlug) {
    fs.writeFileSync(
      path.join(outDir, `${greenway.slug}.json`),
      JSON.stringify(greenway, null, 2) + "\n",
    );
    entries.push({ slug: greenway.slug, name: greenway.name });
  }
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
