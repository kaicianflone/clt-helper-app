const isPrimitive = (v: unknown): v is string | number | boolean | null =>
  v === null || ["string", "number", "boolean"].includes(typeof v);

const isObjectArray = (v: unknown): v is Record<string, unknown>[] =>
  Array.isArray(v) &&
  v.length > 0 &&
  typeof v[0] === "object" &&
  v[0] !== null &&
  !Array.isArray(v[0]);

const keyOf = (o: Record<string, unknown>): string => {
  const key = o.slug ?? o.name ?? o.url;
  if (typeof key === "string" || typeof key === "number") return String(key);
  return JSON.stringify(o).slice(0, 40);
};

export const renderDiff = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string => {
  const lines: string[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    const b = before[k];
    const a = after[k];
    if (JSON.stringify(b) === JSON.stringify(a)) continue;

    if (isPrimitive(b) && isPrimitive(a)) {
      lines.push(`- \`${k}\`: ${JSON.stringify(b)} → ${JSON.stringify(a)}`);
      continue;
    }
    if (isObjectArray(b) || isObjectArray(a)) {
      const bArr = (b as Record<string, unknown>[] | undefined) ?? [];
      const aArr = (a as Record<string, unknown>[] | undefined) ?? [];
      const bMap = new Map(bArr.map((o) => [keyOf(o), o]));
      const aMap = new Map(aArr.map((o) => [keyOf(o), o]));
      const added = [...aMap.keys()].filter((kk) => !bMap.has(kk));
      const removed = [...bMap.keys()].filter((kk) => !aMap.has(kk));
      const modified = [...aMap.keys()].filter(
        (kk) =>
          bMap.has(kk) &&
          JSON.stringify(bMap.get(kk)) !== JSON.stringify(aMap.get(kk)),
      );
      const parts: string[] = [];
      if (added.length) parts.push(`added [${added.join(", ")}]`);
      if (removed.length) parts.push(`removed [${removed.join(", ")}]`);
      if (modified.length) parts.push(`modified [${modified.join(", ")}]`);
      lines.push(`- \`${k}\`: ${parts.join("; ")}`);
      continue;
    }
    if (Array.isArray(b) && Array.isArray(a)) {
      const delta = a.length - b.length;
      if (delta > 0) lines.push(`- \`${k}\`: added ${delta} entry/entries`);
      else if (delta < 0)
        lines.push(`- \`${k}\`: removed ${-delta} entry/entries`);
      else lines.push(`- \`${k}\`: modified in place`);
      continue;
    }
    lines.push(`- \`${k}\`: modified`);
  }
  if (lines.length === 0) return "(no changes)";
  return lines.join("\n");
};

export const escapeMd = (s: string): string =>
  s ? s.replace(/[\\`*_{}[\]<>()#+\-.!|]/g, "\\$&") : "";

export const isVerifyOnlyChange = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): boolean => {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    if (k === "lastVerified") continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) return false;
  }
  return before.lastVerified !== after.lastVerified;
};
