"use client";

interface SubmitSuccessOverlayProps {
  prUrl: string;
  onDismiss?: () => void;
}

export function SubmitSuccessOverlay({
  prUrl,
  onDismiss,
}: SubmitSuccessOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--fg-ink)]/40 p-4"
    >
      <div className="max-w-sm rounded-lg bg-[color:var(--bg-cream)] p-8 text-center shadow-lg">
        {/* Checkmark — scale-up animation, respects reduced motion via tokens.css */}
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--green-ok)]/10"
          style={{
            animation:
              "var(--duration-slow, 400ms) var(--ease-default, ease-out) 0ms 1 scale-up-center",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-[color:var(--green-ok)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2
          id="success-title"
          className="font-display text-2xl font-bold text-[color:var(--fg-ink)]"
        >
          Your suggestion is in
        </h2>
        <p className="mt-2 text-sm text-[color:var(--fg-ink-soft)]">
          A maintainer will review it shortly. Your contribution makes Charlotte
          better for everyone.
        </p>

        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium text-[color:var(--brick)] underline underline-offset-2 hover:text-[color:var(--brick-deep)]"
        >
          View pull request
        </a>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-4 block w-full rounded-md border border-[color:var(--border-soft)] px-4 py-2 text-sm font-medium text-[color:var(--fg-ink-soft)] hover:bg-[color:var(--bg-cream-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
