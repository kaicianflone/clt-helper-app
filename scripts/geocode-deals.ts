import fs from "node:fs";
import path from "node:path";

const CENSUS_API =
  "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";
const FETCH_TIMEOUT_MS = 10_000;

interface CensusMatch {
  coordinates: { x: number; y: number };
}

interface CensusResponse {
  result: { addressMatches: CensusMatch[] };
}

async function geocodeAddress(
  address: string,
): Promise<[number, number] | null> {
  const url = new URL(CENSUS_API);
  url.searchParams.set("address", address);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as CensusResponse;
    const match = data.result.addressMatches[0];
    if (!match) return null;

    return [
      Math.round(match.coordinates.y * 10000) / 10000,
      Math.round(match.coordinates.x * 10000) / 10000,
    ];
  } catch {
    return null;
  }
}

function haversineMeters(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number],
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DRIFT_THRESHOLD_METERS = 200;

export async function geocodeDeals(dealsDir: string): Promise<number> {
  if (!fs.existsSync(dealsDir)) return 0;

  const files = fs
    .readdirSync(dealsDir)
    .filter((f) => f.endsWith(".json") && f !== "_index.json");

  const addressGroups = new Map<string, string[]>();
  for (const file of files) {
    const deal = JSON.parse(
      fs.readFileSync(path.join(dealsDir, file), "utf8"),
    );
    const addr: string = deal.restaurantAddress;
    if (!addressGroups.has(addr)) addressGroups.set(addr, []);
    addressGroups.get(addr)!.push(file);
  }

  let updated = 0;

  for (const [address, dealFiles] of addressGroups) {
    const coords = await geocodeAddress(address);
    if (!coords) {
      console.warn(`  ⚠ No geocode result for: ${address}`);
      continue;
    }

    for (const file of dealFiles) {
      const filePath = path.join(dealsDir, file);
      const deal = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const old: [number, number] = deal.restaurantLatLng;
      const drift = haversineMeters(old, coords);

      if (drift > DRIFT_THRESHOLD_METERS) {
        console.log(
          `  ✓ ${file}: ${old} → ${coords} (${Math.round(drift)}m drift)`,
        );
        deal.restaurantLatLng = coords;
        fs.writeFileSync(filePath, JSON.stringify(deal, null, 2) + "\n");
        updated++;
      }
    }
  }

  return updated;
}

const run = async () => {
  const root = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
  );
  const dealsDir = path.join(root, "data/deals");
  console.log("Geocoding deals…");
  const count = await geocodeDeals(dealsDir);
  console.log(count > 0 ? `Updated ${count} file(s).` : "All coordinates OK.");
};

if (import.meta.url === `file://${process.argv[1]}`) run();
