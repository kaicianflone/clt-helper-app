"use client";

import { useSyncExternalStore } from "react";

const EULA_KEY = "clt-eula-accepted-at";

const subscribe = (callback: () => void) => {
  // Subscribe to storage events (cross-tab sync)
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

const getSnapshot = () => {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(EULA_KEY);
};

const getServerSnapshot = () => null;

export interface EulaGate {
  accepted: boolean;
  acceptedAt: string | null;
  accept: () => void;
}

export function useEulaGate(): EulaGate {
  const acceptedAt = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const accept = () => {
    const ts = new Date().toISOString();
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(EULA_KEY, ts);
    }
    // Dispatch a storage event so useSyncExternalStore re-reads
    window.dispatchEvent(new Event("storage"));
  };

  return {
    accepted: acceptedAt !== null,
    acceptedAt,
    accept,
  };
}

interface EulaModalProps {
  onAccept: () => void;
}

export function EulaModal({ onAccept }: EulaModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="eula-title"
      aria-describedby="eula-terms"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--bg-cream)]/80 p-4 backdrop-blur-sm"
    >
      <div className="max-w-md rounded-lg bg-[color:var(--bg-cream)] p-6 shadow-lg">
        <h2
          id="eula-title"
          className="font-display text-2xl font-bold text-[color:var(--fg-ink)]"
        >
          Before you contribute
        </h2>
        <p className="mt-3 text-sm text-[color:var(--fg-ink-soft)]">
          By submitting an edit, you agree:
        </p>
        <ul
          id="eula-terms"
          className="mt-2 list-disc space-y-1 pl-5 text-base text-[color:var(--fg-ink-soft)] sm:text-sm"
        >
          <li>
            You won&apos;t submit profanity, hate speech, or content that
            targets individuals
          </li>
          <li>
            You won&apos;t submit personal information about anyone (names,
            contacts, addresses of private people)
          </li>
          <li>
            Your submission is fact-based and accurate to the best of your
            knowledge
          </li>
          <li>Submissions become public pull requests visible on GitHub</li>
        </ul>
        <button
          onClick={onAccept}
          className="mt-6 w-full rounded-md bg-[color:var(--brick)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[color:var(--brick-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
        >
          I agree — continue
        </button>
      </div>
    </div>
  );
}
