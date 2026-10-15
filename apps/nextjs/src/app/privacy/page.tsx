import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How the CLT Greenways website handles your data — and what it doesn't collect.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <h1 className="font-display text-4xl font-bold tracking-tight text-[color:var(--fg-ink)]">
        Privacy
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[color:var(--fg-ink-soft)]">
        This page covers the CLT Greenways marketing website. CLT Greenways is
        an independent project and is not affiliated with the City of Charlotte
        or Mecklenburg County.
      </p>

      <h2 className="font-display mt-8 text-2xl font-bold text-[color:var(--fg-ink)]">
        The website
      </h2>
      <ul className="mt-3 space-y-2 text-base text-[color:var(--fg-ink-soft)]">
        <li className="flex gap-2">
          <span aria-hidden>·</span>
          No accounts, logins, or profiles
        </li>
        <li className="flex gap-2">
          <span aria-hidden>·</span>
          No analytics or tracking pixels
        </li>
        <li className="flex gap-2">
          <span aria-hidden>·</span>
          No advertising IDs or personal information collected by the site
        </li>
        <li className="flex gap-2">
          <span aria-hidden>·</span>
          Standard server logs (such as IP address and user agent) are kept
          briefly by our hosting provider, Vercel
        </li>
      </ul>

      <h2 className="font-display mt-8 text-2xl font-bold text-[color:var(--fg-ink)]">
        The iPhone app
      </h2>
      <p className="mt-3 text-base leading-relaxed text-[color:var(--fg-ink-soft)]">
        The CLT Greenways iPhone app is not yet released. Its privacy
        information will be published here and on its App Store listing before
        launch.
      </p>
    </main>
  );
}
