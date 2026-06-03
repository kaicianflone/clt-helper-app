// apps/nextjs/src/components/marketing/CommunityStory.tsx
import { MARKETING_COPY } from "./marketing-content";

export function CommunityStory() {
  const [h1, h2] = MARKETING_COPY.communityHeading;
  return (
    <section className="mx-auto max-w-xl px-6 py-4 text-center">
      <p className="font-display text-sm font-semibold tracking-widest text-[color:var(--fg-ink-muted)] uppercase">
        {MARKETING_COPY.communityLabel}
      </p>
      <h2 className="font-display mt-2 text-4xl font-bold tracking-tight text-[color:var(--fg-ink)] uppercase">
        {h1}
        <br />
        {h2}
      </h2>
      <p className="mt-3.5 text-base leading-relaxed text-[color:var(--fg-ink-soft)]">
        {MARKETING_COPY.communityBody}
      </p>
    </section>
  );
}
