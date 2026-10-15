// apps/nextjs/src/components/marketing/DownloadFooter.tsx
import { CrownIcon } from "~/components/CrownIcon";
import { MARKETING_COPY } from "./marketing-content";
import { StoreBadge } from "./StoreBadge";

export function DownloadFooter() {
  const [h1, h2] = MARKETING_COPY.footerHeading;
  return (
    <footer className="border-t border-[color:var(--border-soft)] bg-[color:var(--bg-cream-soft)] px-6 py-11 text-center">
      <h2 className="font-display text-3xl font-bold tracking-tight text-[color:var(--fg-ink)] uppercase">
        {h1}
        <br />
        {h2}
      </h2>
      <div className="mt-5 flex justify-center">
        <StoreBadge />
      </div>
      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs tracking-widest text-[color:var(--fg-ink-muted)] uppercase">
        {MARKETING_COPY.signoff}
        <CrownIcon size={14} color="var(--brick)" />
      </p>
    </footer>
  );
}
