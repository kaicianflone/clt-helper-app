import fs from "node:fs";
import path from "node:path";
import { ENTITY_REGISTRY } from "@clt/data-schema";

export interface Bundle {
  schemaVersion: number;
  builtAt: string;
  entries: unknown[];
}

export const buildBundle = (dir: string, schemaVersion: number): Bundle => {
  if (!fs.existsSync(dir)) {
    throw new Error(
      `buildBundle: input directory does not exist: "${dir}". ` +
        `Run the data import first or verify the path configuration.`,
    );
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "_index.json");
  const entries = files.map((f) =>
    JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))
  );
  return { schemaVersion, builtAt: new Date().toISOString(), entries };
};

/** Derives bundle category names from ENTITY_REGISTRY, matching validate-data.ts's pattern. */
export const getBundleCategories = (): string[] =>
  Object.values(ENTITY_REGISTRY).map((entity) => {
    const dataDir = entity.dataPath("x").replace(/\/x\.json$/, "");
    return path.basename(dataDir);
  });

const run = () => {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const outDir = path.join(root, "dist/data/v1");
  fs.mkdirSync(outDir, { recursive: true });
  const categories = getBundleCategories();
  const manifest: Record<string, { url: string; count: number }> = {};
  for (const cat of categories) {
    const src = path.join(root, `data/${cat}`);
    const bundle = buildBundle(src, 1);
    fs.writeFileSync(path.join(outDir, `${cat}.json`), JSON.stringify(bundle));
    manifest[cat] = { url: `/data/v1/${cat}.json`, count: bundle.entries.length };
  }
  const manifestPath = path.join(root, "dist/data/manifest.json");
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify({ builtAt: new Date().toISOString(), bundles: manifest }, null, 2));

  const nextPublicDir = path.join(root, "apps/nextjs/public/data/v1");
  fs.mkdirSync(nextPublicDir, { recursive: true });
  for (const cat of categories) {
    fs.copyFileSync(
      path.join(outDir, `${cat}.json`),
      path.join(nextPublicDir, `${cat}.json`),
    );
  }

  console.log("Built bundles:", manifest);
};

if (import.meta.url === `file://${process.argv[1]}`) run();
