// apps/nextjs/src/components/marketing/Hero.tsx
import { CrownIcon } from "~/components/CrownIcon";
import { MARKETING_COPY } from "./marketing-content";
import { StoreBadge } from "./StoreBadge";

export function Hero() {
  const [line1, line2, line3] = MARKETING_COPY.heroTitle;
  return (
    <section className="relative">
      <div className="px-6 pt-14 pb-2 text-center">
        <div className="mkt-rise mkt-rise-d1 mkt-float font-display tracking-[0.5em] text-[color:var(--gold)]">
          ✦&#8194;&#8194;✦&#8194;&#8194;✦
        </div>
        <h1 className="mkt-rise mkt-rise-d2 font-display mx-auto mt-4 max-w-3xl text-6xl leading-[0.92] font-bold tracking-tight text-[color:var(--fg-ink)] uppercase sm:text-7xl">
          {line1}
          <br />
          {line2}
          <br />
          {line3}{" "}
          <CrownIcon
            size={52}
            color="var(--brick)"
            className="inline-block align-baseline"
          />
        </h1>
        <p className="mkt-rise mkt-rise-d3 mx-auto mt-4 max-w-md text-lg leading-relaxed text-[color:var(--fg-ink-soft)]">
          {MARKETING_COPY.heroSubhead}
        </p>
        <div className="mkt-rise mkt-rise-d4 mt-6">
          <StoreBadge />
        </div>
      </div>
      <svg
        className="mkt-trail mt-1 block h-14 w-full"
        viewBox="0 0 600 70"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,40 C80,10 140,60 220,38 C300,16 360,58 440,36 C520,16 560,46 600,30"
          stroke="var(--map-trail)"
          strokeWidth="2.5"
          opacity="0.5"
        />
      </svg>
    </section>
  );
}
