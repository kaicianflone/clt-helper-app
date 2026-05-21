"use client";

import { useState } from "react";

interface ShareButtonProps {
  url: string;
  title: string;
}

const copyToClipboard = async (text: string): Promise<void> => {
  // Use the Clipboard API, gracefully degrade if unavailable
  const cb = (navigator as { clipboard?: { writeText: (t: string) => Promise<void> } }).clipboard;
  if (cb) {
    await cb.writeText(text);
  }
};

export function ShareButton({ url, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    if ("share" in navigator) {
      try {
        await navigator.share({ url, title });
      } catch {
        // User cancelled — no-op
      }
      return;
    }

    try {
      await copyToClipboard(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available — no-op
    }
  };

  return (
    <button
      onClick={onClick}
      aria-label={`Share: ${title}`}
      className="rounded-md px-4 py-2 text-sm font-medium text-[color:var(--fg-ink-soft)] hover:bg-[color:var(--bg-cream-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
