"use client";

interface ErrorStateProps {
  title: string;
  body: string;
  onRetry?: () => void;
}

export function ErrorState({ title, body, onRetry }: ErrorStateProps) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-[color:var(--rose-stale)]/30 bg-[color:var(--rose-stale)]/10 p-8 text-center">
      <p className="font-medium text-[color:var(--fg-ink)]">{title}</p>
      <p className="mt-1 text-sm text-[color:var(--fg-ink-soft)]">{body}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-block rounded-md bg-[color:var(--fg-ink)] px-4 py-2 text-sm font-medium text-[color:var(--bg-cream)] hover:bg-[color:var(--fg-ink-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--fg-ink)]"
        >
          Try again
        </button>
      )}
    </div>
  );
}
