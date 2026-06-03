// apps/nextjs/src/components/marketing/MarketingHeader.tsx
import Link from "next/link";

import { CrownIcon } from "~/components/CrownIcon";
import { MARKETING_NAV } from "./marketing-content";

export function MarketingHeader() {
  return (
    <header
      className="flex items-center justify-between border-b border-[color:var(--border-soft)] px-6 py-4"
      role="banner"
    >
      <Link
        href="/"
        className="font-display flex items-center gap-1.5 text-2xl font-bold tracking-wider text-[color:var(--brick)] uppercase hover:opacity-80"
        aria-label="clt-app — home"
      >
        <CrownIcon size={22} color="var(--brick)" />
        clt-app
      </Link>
      <nav
        className="hidden items-center gap-5 sm:flex"
        aria-label="Marketing navigation"
      >
        {MARKETING_NAV.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="text-sm text-[color:var(--fg-ink-muted)] hover:text-[color:var(--fg-ink)]"
          >
            {label}
          </Link>
        ))}
        <Link
          href="/today"
          className="text-sm font-medium text-[color:var(--brick)] hover:text-[color:var(--brick-deep)]"
        >
          Open app ▸
        </Link>
      </nav>
    </header>
  );
}
