// apps/nextjs/src/components/marketing/DomainColumns.tsx
import { MARKETING_COPY, MARKETING_DOMAINS } from "./marketing-content";

export function DomainColumns() {
  const [h1, h2] = MARKETING_COPY.domainsHeading;
  return (
    <section className="px-6 py-4">
      <div className="text-center">
        <p className="font-display text-sm font-semibold tracking-widest text-[color:var(--fg-ink-muted)] uppercase">
          {MARKETING_COPY.domainsLabel}
        </p>
        <h2 className="font-display mt-2 text-4xl font-bold tracking-tight text-[color:var(--fg-ink)] uppercase">
          {h1}
          <br />
          {h2}
        </h2>
      </div>
      <div className="mx-auto mt-8 grid max-w-4xl gap-8 sm:grid-cols-3">
        {MARKETING_DOMAINS.map((d) => (
          <div key={d.name} className="text-center">
            <h3
              className="font-display text-2xl font-bold uppercase"
              style={{ color: `var(${d.colorVar})` }}
            >
              {d.name}
            </h3>
            <p className="mt-1.5 text-sm text-[color:var(--fg-ink-soft)]">
              {d.blurb}
            </p>
            <ul className="mt-3 text-left">
              {d.items.map((item) => (
                <li
                  key={item}
                  className="border-t border-[color:var(--border-soft)] py-1.5 text-sm text-[color:var(--fg-ink-soft)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
