const HISTORY_KEY = "clt-contribution-history";

export interface ContributionEntry {
  kind: "greenway" | "deal" | "parking";
  slug: string;
  prUrl: string;
  submittedAt: string; // ISO timestamp
  note?: string;
}

/**
 * Record a new contribution to localStorage history.
 */
export function recordContribution(entry: ContributionEntry): void {
  if (typeof localStorage === "undefined") return;

  const existing = getContributions();
  // Keep last 50 contributions to bound storage size
  const updated = [entry, ...existing].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

/**
 * Retrieve all recorded contributions from localStorage.
 * Returns an empty array if none exist or if parsing fails.
 */
export function getContributions(): ContributionEntry[] {
  if (typeof localStorage === "undefined") return [];

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ContributionEntry[];
  } catch {
    return [];
  }
}
