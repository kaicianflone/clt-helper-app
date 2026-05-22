import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "clt-contribution-history";

export interface ContributionEntry {
  id: string;
  kind: "greenway" | "deal" | "parking";
  slug: string;
  prUrl?: string;
  submittedAt: string;
}

export async function recordContribution(
  entry: ContributionEntry,
): Promise<void> {
  const existing = await getContributions();
  const updated = [entry, ...existing].slice(0, 100); // cap at 100 entries
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function getContributions(): Promise<ContributionEntry[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ContributionEntry[];
  } catch {
    return [];
  }
}
