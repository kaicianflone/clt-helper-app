import type { Greenway, Deal, ParkingLot } from "@clt/data-schema";

export interface Bundle<T> {
  schemaVersion: number;
  builtAt: string;
  entries: T[];
}

export type EntityKind = "greenways" | "deals" | "parking";

export interface DataClientOptions<T> {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  offlineBundle?: Bundle<T>;
  timeoutMs?: number;
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

export async function fetchBundle<T>(
  kind: EntityKind,
  opts: DataClientOptions<T>,
): Promise<Bundle<T>> {
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
