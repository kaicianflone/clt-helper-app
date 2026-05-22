import fs from "node:fs";
import path from "node:path";

import type { Deal, Greenway, ParkingLot } from "@clt/data-schema";

export interface Bundle<T> {
  schemaVersion: number;
  builtAt: string;
  entries: T[];
}

export type EntityKind = "greenways" | "deals" | "parking";

export interface DataClientOptions<T> {
  /**
   * HTTP origin where the data bundle is hosted (e.g. an R2 CDN URL). When
   * empty / nullish, the client reads `${CLT_DATA_DIR}/<kind>.json` from the
   * local filesystem instead — used in dev and in any pre-R2 deployment.
   */
  baseUrl?: string | null;
  fetchImpl?: typeof fetch;
  offlineBundle?: Bundle<T>;
  timeoutMs?: number;
  /**
   * Override the directory the local-disk fallback reads from. Used in tests
   * to point at a temp dir. Defaults to `CLT_DATA_DIR` env var, then to
   * `<cwd>/dist/data/v1`.
   */
  localDir?: string;
}

const DEFAULT_TIMEOUT_MS = 5000;

const fetchWithTimeout = async (
  url: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<Response> => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Candidate filesystem roots for the local-disk bundle, in priority order.
 * Returns the first one that contains <kind>.json. Different cwd contexts
 * resolve different roots:
 *   - Monorepo root (CLI / tsx / vitest):     <cwd>/dist/data/v1/<kind>.json
 *   - Next.js dev (cwd = apps/nextjs/):       <cwd>/public/data/v1/<kind>.json
 *   - Vercel standalone (cwd varies):         resolves via __dirname-relative
 *                                             paths to apps/nextjs/public/data/v1/
 *   - Explicit override: opts.localDir or env CLT_DATA_DIR
 */
const resolveLocalFile = (
  kind: EntityKind,
  opts: { localDir?: string },
): string | null => {
  // Explicit localDir wins — used by tests to scope the search. If the file
  // isn't there, return null so the offlineBundle / throw path takes over.
  if (opts.localDir) {
    const file = path.join(opts.localDir, `${kind}.json`);
    return fs.existsSync(file) ? file : null;
  }

  const candidates: string[] = [];
  if (process.env.CLT_DATA_DIR) candidates.push(process.env.CLT_DATA_DIR);
  candidates.push(path.resolve(process.cwd(), "dist/data/v1"));
  candidates.push(path.resolve(process.cwd(), "public/data/v1"));
  // Vercel standalone output bundles packages/api but runs from .next/standalone/.
  // Walk up from this module to find apps/nextjs/public/data/v1 in the repo layout
  // or in the standalone tracer's relocated copy. __dirname is undefined in
  // pure ESM but vitest + tsx + Next.js all run CommonJS here.
  try {
    candidates.push(
      path.resolve(__dirname, "../../apps/nextjs/public/data/v1"),
      path.resolve(__dirname, "../../../apps/nextjs/public/data/v1"),
      path.resolve(__dirname, "../../../../apps/nextjs/public/data/v1"),
    );
  } catch {
    // __dirname not available — skip silently.
  }

  for (const dir of candidates) {
    const file = path.join(dir, `${kind}.json`);
    if (fs.existsSync(file)) return file;
  }
  return null;
};

// In-memory cache keyed by absolute file path + mtime. Reading 1.6 MB of
// greenway JSON on every tRPC request would block the Node event loop under
// concurrency. The cache invalidates automatically when build:data writes a
// new bundle (mtime changes), so dev reload + prod ISR both stay correct.
interface CacheEntry {
  mtimeMs: number;
  bundle: unknown;
}
const bundleCache = new Map<string, CacheEntry>();

const fetchBundleLocal = <T>(
  kind: EntityKind,
  opts: DataClientOptions<T>,
): Bundle<T> => {
  const file = resolveLocalFile(kind, opts);
  if (!file) {
    if (opts.offlineBundle) return opts.offlineBundle;
    throw new Error(
      `data bundle ${kind}.json not found. Tried CLT_DATA_DIR, dist/data/v1, and public/data/v1 relative to cwd=${process.cwd()}. Run \`pnpm build:data\` first.`,
    );
  }
  const stat = fs.statSync(file);
  const cached = bundleCache.get(file);
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached.bundle as Bundle<T>;
  }
  const bundle = JSON.parse(fs.readFileSync(file, "utf8")) as Bundle<T>;
  bundleCache.set(file, { mtimeMs: stat.mtimeMs, bundle });
  return bundle;
};

export async function fetchBundle<T>(
  kind: EntityKind,
  opts: DataClientOptions<T>,
): Promise<Bundle<T>> {
  // Local-disk fallback when no baseUrl is configured (dev + non-R2 prod).
  if (!opts.baseUrl) {
    return fetchBundleLocal<T>(kind, opts);
  }

  const f = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = `${opts.baseUrl}/data/v1/${kind}.json`;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(url, f, timeoutMs);
      if (!res.ok) throw new Error(`bundle fetch ${res.status}`);
      return (await res.json()) as Bundle<T>;
    } catch (e) {
      lastErr = e;
      if (attempt === 1) {
        if (opts.offlineBundle) return opts.offlineBundle;
        throw e;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw lastErr;
}

// Convenience typed wrappers
export const fetchGreenways = (opts: DataClientOptions<Greenway>) =>
  fetchBundle<Greenway>("greenways", opts);
export const fetchDeals = (opts: DataClientOptions<Deal>) =>
  fetchBundle<Deal>("deals", opts);
export const fetchParking = (opts: DataClientOptions<ParkingLot>) =>
  fetchBundle<ParkingLot>("parking", opts);
