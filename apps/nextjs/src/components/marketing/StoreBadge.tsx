// apps/nextjs/src/components/marketing/StoreBadge.tsx
import { CrownIcon } from "~/components/CrownIcon";
import { env } from "~/env";
import { MARKETING_COPY } from "./marketing-content";

interface StoreBadgeProps {
  /** Defaults to NEXT_PUBLIC_APP_STORE_URL; when empty, "Coming soon" shows. */
  url?: string;
}

/**
 * Single App Store call to action. With no URL configured it renders a
 * "Coming soon" pill; once NEXT_PUBLIC_APP_STORE_URL is set (and the site
 * redeployed) it renders the official "Download on the App Store" badge.
 */
export function StoreBadge(props: StoreBadgeProps) {
  const url = (props.url ?? env.NEXT_PUBLIC_APP_STORE_URL ?? "").trim();

  if (url) {
    return (
      <a href={url} className="inline-block align-middle">
        {/* eslint-disable-next-line @next/next/no-img-element -- official brand badge served from /public; must not be re-optimized */}
        <img
          src="/badges/app-store.svg"
          alt="Download on the App Store"
          width={140}
          height={47}
        />
      </a>
    );
  }

  return (
    <p
      className="font-display inline-flex items-center gap-2 rounded-md border border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-5 py-3 text-base font-semibold tracking-wide text-[color:var(--fg-ink)] uppercase"
      data-testid="app-store-coming-soon"
    >
      <CrownIcon size={16} color="var(--brick)" />
      {MARKETING_COPY.comingSoon}
    </p>
  );
}
