import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How clt-app handles your data — and what it doesn't collect.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <h1 className="font-display text-4xl font-bold tracking-tight text-[color:var(--fg-ink)]">
        Privacy
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[color:var(--fg-ink-soft)]">
        clt-app is an anonymous, open-source app for Charlotte. Here&apos;s what
        we do and don&apos;t collect.
      </p>

      <h2 className="font-display mt-8 text-2xl font-bold text-[color:var(--fg-ink)]">
        What we don&apos;t collect
      </h2>
      <ul className="mt-3 space-y-2 text-base text-[color:var(--fg-ink-soft)]">
        <li className="flex gap-2">
          <span aria-hidden>·</span>
          No accounts, no logins, no profiles
        </li>
        <li className="flex gap-2">
          <span aria-hidden>·</span>
          No analytics or tracking pixels
        </li>
        <li className="flex gap-2">
          <span aria-hidden>·</span>
          No advertising IDs
        </li>
        <li className="flex gap-2">
          <span aria-hidden>·</span>
          No personally identifying information
        </li>
      </ul>

      <h2 className="font-display mt-8 text-2xl font-bold text-[color:var(--fg-ink)]">
        What we do collect
      </h2>
      <ul className="mt-3 space-y-4 text-base text-[color:var(--fg-ink-soft)]">
        <li>
          <strong className="text-[color:var(--fg-ink)]">
            Device installation ID
          </strong>{" "}
          — a random anonymous identifier created the first time you open the
          app, used only to limit submission spam to 3 per device per day. We
          never link this to any personal information. It resets if you
          reinstall the app.
        </li>
        <li>
          <strong className="text-[color:var(--fg-ink)]">
            Location (optional)
          </strong>{" "}
          — only when you tap &ldquo;Near me&rdquo; on a list. Your location
          stays on your device; we never send it to a server.
        </li>
        <li>
          <strong className="text-[color:var(--fg-ink)]">
            Contributions you submit
          </strong>{" "}
          — your submission becomes a public pull request on GitHub with the
          display name and note you typed. Don&apos;t include personal
          information you don&apos;t want public.
        </li>
      </ul>

      <h2 className="font-display mt-8 text-2xl font-bold text-[color:var(--fg-ink)]">
        Open source
      </h2>
      <p className="mt-3 text-base leading-relaxed text-[color:var(--fg-ink-soft)]">
        The full source code, including this privacy policy, lives on{" "}
        <a
          href="https://github.com/CHANGE-ME/clt-app"
          className="text-[color:var(--brick)] underline underline-offset-2 hover:text-[color:var(--brick-deep)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        . Read it, fork it, contribute.
      </p>
    </main>
  );
}
