// apps/nextjs/src/components/marketing/MarketingHeader.tsx
import Link from "next/link";

import { CrownIcon } from "~/components/CrownIcon";

export function MarketingHeader() {
  return (
    <header
      className="flex items-center justify-between border-b border-[color:var(--border-soft)] px-6 py-4"
      role="banner"
    >
      <Link
        href="/"
        className="font-display flex items-center gap-1.5 text-2xl font-bold tracking-wider text-[color:var(--brick)] uppercase hover:opacity-80"
        aria-label="CLT Greenways — home"
      >
        <CrownIcon size={22} color="var(--brick)" />
        CLT Greenways
      </Link>
    </header>
  );
}
