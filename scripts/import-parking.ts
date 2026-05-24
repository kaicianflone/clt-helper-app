import fs from "node:fs";
import path from "node:path";

interface MeterFeature {
  attributes: {
    OBJECTID: number;
    SPACE_: string | null;
    STATUS: string;
    WHOLESTNAME: string;
    SideOfStreet: string;
    Block: string;
  };
  geometry: { x: number; y: number };
}

interface ArcGISResponse {
  features: MeterFeature[];
}

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ENDPOINT =
  "https://services.arcgis.com/9Nl857LBlQVyzq54/arcgis/rest/services/Parking_Meters/FeatureServer/0/query";

const fetchAllMeters = async (): Promise<MeterFeature[]> => {
  const url = `${ENDPOINT}?where=1%3D1&outFields=*&outSR=4326&resultRecordCount=2000&f=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const data = (await res.json()) as ArcGISResponse;
  return data.features;
};

const TODAY = new Date().toISOString().slice(0, 10);

const run = async () => {
  console.log("Fetching parking meters from Charlotte GIS...");
  const meters = await fetchAllMeters();
  console.log(`Fetched ${meters.length} meters`);

  const groups = new Map<
    string,
    {
      street: string;
      block: string;
      spaces: number;
      operational: number;
      payStation: number;
      bagged: number;
      lats: number[];
      lngs: number[];
      zoneNumbers: string[];
    }
  >();

  for (const m of meters) {
    const {
      WHOLESTNAME: street,
      Block: block,
      STATUS: status,
      SPACE_: space,
    } = m.attributes;
    if (!street || !block) continue;

    const key = `${street}|${block}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        street,
        block,
        spaces: 0,
        operational: 0,
        payStation: 0,
        bagged: 0,
        lats: [],
        lngs: [],
        zoneNumbers: [],
      };
      groups.set(key, group);
    }
    group.spaces++;
    if (status === "Operational") group.operational++;
    else if (status === "Pay Station") group.payStation++;
    else if (status === "Bagged") group.bagged++;
    group.lats.push(m.geometry.y);
    group.lngs.push(m.geometry.x);
    if (space) group.zoneNumbers.push(space);
  }

  console.log(`Grouped into ${groups.size} street parking zones`);

  const outDir = path.resolve("data/parking");
  fs.mkdirSync(outDir, { recursive: true });

  let written = 0;
  for (const [, g] of groups) {
    const name = `${g.block} ${g.street} Street Parking`;
    const slug = slugify(`${g.block}-${g.street}`);
    const avgLat = g.lats.reduce((a, b) => a + b, 0) / g.lats.length;
    const avgLng = g.lngs.reduce((a, b) => a + b, 0) / g.lngs.length;

    const hasPayStation = g.payStation > 0;

    const uniqueZones = [...new Set(g.zoneNumbers)].sort();

    const lot = {
      slug,
      name,
      address: `${g.block} block of ${g.street}, Charlotte, NC`,
      latLng: [
        Math.round(avgLat * 1_000_000) / 1_000_000,
        Math.round(avgLng * 1_000_000) / 1_000_000,
      ],
      hourlyRate: 1.5,
      dailyMax: null,
      hours: {
        mon: { open: "08:00", close: "18:00" },
        tue: { open: "08:00", close: "18:00" },
        wed: { open: "08:00", close: "18:00" },
        thu: { open: "08:00", close: "18:00" },
        fri: { open: "08:00", close: "18:00" },
        sat: "closed",
        sun: "closed",
      },
      paymentMethods: ["meter", "app"] as const,
      covered: false,
      totalSpaces: g.spaces,
      zoneNumbers: uniqueZones,
      operator: "ParkMobile",
      lastVerified: TODAY,
    };

    const filePath = path.join(outDir, `${slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(lot, null, 2) + "\n");
    written++;
  }

  console.log(`Wrote ${written} parking zone files to data/parking/`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
