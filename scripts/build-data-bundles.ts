import fs from "node:fs";
import path from "node:path";

export interface Bundle {
  schemaVersion: number;
  builtAt: string;
  entries: unknown[];
}

export const buildBundle = (dir: string, schemaVersion: number): Bundle => {
  if (!fs.existsSync(dir)) return { schemaVersion, builtAt: new Date().toISOString(), entries: [] };
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "_index.json");
  const entries = files.map((f) =>
    JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))
  );
  return { schemaVersion, builtAt: new Date().toISOString(), entries };
};

const run = () => {
  const outDir = path.resolve("dist/data/v1");
  fs.mkdirSync(outDir, { recursive: true });
  const categories = ["greenways", "deals", "parking"];
  const manifest: Record<string, { url: string; count: number }> = {};
  for (const cat of categories) {
    const src = path.resolve(`data/${cat}`);
    const bundle = buildBundle(src, 1);
    fs.writeFileSync(path.join(outDir, `${cat}.json`), JSON.stringify(bundle));
    manifest[cat] = { url: `/data/v1/${cat}.json`, count: bundle.entries.length };
  }
  const manifestPath = path.resolve("dist/data/manifest.json");
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify({ builtAt: new Date().toISOString(), bundles: manifest }, null, 2));
  console.log("Built bundles:", manifest);
};

if (import.meta.url === `file://${process.argv[1]}`) run();
