// apps/nextjs/src/components/marketing/StoreBadge.tsx
import { CrownIcon } from "~/components/CrownIcon";

interface StoreBadgeProps {
  store: "app-store" | "google-play";
}

const BADGES = {
  "app-store": {
    src: "/badges/app-store.svg",
    alt: "Download on the App Store",
    width: 140,
    height: 47,
  },
  "google-play": {
    src: "/badges/google-play.png",
    alt: "Get it on Google Play",
    width: 121,
    height: 47,
  },
} as const;

/**
 * Renders an official store badge in a disabled "Soon" state — the app is not
 * published yet, so the badge is dimmed, tagged, aria-disabled, and unlinked.
 * To go live: remove the opacity + Soon tag and wrap the <img> in a store link.
 */
export function StoreBadge(props: StoreBadgeProps) {
  const b = BADGES[props.store];
  return (
    <span
      className="relative inline-block align-middle"
      aria-disabled="true"
      title="Coming soon"
    >
      <span className="absolute -top-2 -right-2 z-10 flex items-center gap-0.5 rounded-full bg-[color:var(--gold)] px-1.5 py-0.5 font-display text-[10px] font-bold tracking-wide text-[color:var(--fg-ink)] uppercase">
        <CrownIcon size={9} color="var(--fg-ink)" />
        Soon
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- official brand badge served from /public; must not be re-optimized */}
      <img
        src={b.src}
        alt={b.alt}
        width={b.width}
        height={b.height}
        className="opacity-60"
      />
    </span>
  );
}
