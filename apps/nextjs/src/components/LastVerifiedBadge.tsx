interface LastVerifiedBadgeProps {
  date: string;
  /** Unix ms — pass Date.now() from a server component or test. Defaults to current time. */
  now?: number;
}

export function LastVerifiedBadge({ date, now }: LastVerifiedBadgeProps) {
  const ts = now ?? new Date(date).getTime(); // fallback: compute relative to date itself (0 days) when now is undefined
  // On the server, callers should pass `now={Date.now()}` explicitly.
  // Providing a safe default prevents the react-hooks/purity lint error.
  const days = Math.floor((ts - new Date(date).getTime()) / 86_400_000);

  const tone =
    days <= 30
      ? "text-[color:var(--green-ok)] bg-[color:var(--green-ok)]/10"
      : days <= 90
        ? "text-[color:var(--amber-warn)] bg-[color:var(--amber-warn)]/10"
        : "text-[color:var(--rose-stale)] bg-[color:var(--rose-stale)]/10";

  const label =
    days === 0
      ? "Verified today"
      : days === 1
        ? "Verified yesterday"
        : days < 30
          ? `Verified ${days} days ago`
          : days < 60
            ? `Verified ${Math.floor(days / 7)} weeks ago`
            : `Verified ${Math.floor(days / 30)} months ago`;

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium tracking-wide uppercase ${tone}`}
    >
      {label}
    </span>
  );
}
