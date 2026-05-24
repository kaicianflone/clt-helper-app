import leoProfanity from "leo-profanity";

leoProfanity.loadDictionary("en");

const PII_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/, label: "SSN-shaped" },
  { pattern: /\b(?:\d{4}[\s-]?){4}\b/, label: "credit-card-shaped" },
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    label: "email",
  },
  {
    pattern: /\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/,
    label: "phone",
  },
];

export interface ContentCheckResult {
  violation: boolean;
  reason?: string;
}

const collectStrings = (val: unknown, out: string[] = []): string[] => {
  if (typeof val === "string") out.push(val);
  else if (Array.isArray(val)) val.forEach((v) => collectStrings(v, out));
  else if (val && typeof val === "object")
    Object.values(val as Record<string, unknown>).forEach((v) =>
      collectStrings(v, out)
    );
  return out;
};

export const containsObjectionableContent = (input: {
  displayName: string;
  note: string;
  patch: Record<string, unknown>;
}): ContentCheckResult => {
  const strings = [
    input.displayName,
    input.note,
    ...collectStrings(input.patch),
  ];
  for (const s of strings) {
    if (!s) continue;
    if (leoProfanity.check(s)) return { violation: true, reason: "profanity" };
    for (const { pattern, label } of PII_PATTERNS) {
      if (pattern.test(s))
        return {
          violation: true,
          reason: `potentially identifies a person (${label})`,
        };
    }
  }
  return { violation: false };
};
