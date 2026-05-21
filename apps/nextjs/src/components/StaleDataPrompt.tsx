interface StaleDataPromptProps {
  date: string;
  slug: string;
  kind: "greenway" | "deal" | "parking";
  /** Unix ms — pass Date.now() from a server component or test. */
  now?: number;
}

export function StaleDataPrompt({ date, slug, kind, now }: StaleDataPromptProps) {
  const ts = now ?? new Date(date).getTime();
  const days = Math.floor((ts - new Date(date).getTime()) / 86_400_000);

  if (days < 60) return null;

  const months = Math.floor(days / 30);

  return (
    <div className="rounded-lg border border-[color:var(--amber-warn)]/30 bg-[color:var(--amber-warn)]/10 p-4">
      <p className="text-sm text-[color:var(--fg-ink-soft)]">
        This hasn&apos;t been verified in {months} month{months !== 1 ? "s" : ""}. Still accurate?
      </p>
      <div className="mt-2 flex gap-4">
        <a
          href={`/contribute/${kind}/${slug}?verify=yes`}
          className="text-sm font-medium text-[color:var(--brick)] underline underline-offset-2 hover:text-[color:var(--brick-deep)]"
        >
          Yes, it&apos;s accurate
        </a>
        <a
          href={`/contribute/${kind}/${slug}`}
          className="text-sm font-medium text-[color:var(--fg-ink-soft)] underline underline-offset-2 hover:text-[color:var(--fg-ink)]"
        >
          Suggest an edit
        </a>
      </div>
    </div>
  );
}
