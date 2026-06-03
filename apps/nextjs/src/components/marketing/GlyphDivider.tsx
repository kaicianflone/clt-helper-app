// apps/nextjs/src/components/marketing/GlyphDivider.tsx
export function GlyphDivider(props: { glyph?: string }) {
  const g = props.glyph ?? "⟡";
  return (
    <p
      aria-hidden="true"
      className="py-9 text-center text-[color:var(--gold)] tracking-[0.5em]"
    >
      {`${g}  ${g}  ${g}`}
    </p>
  );
}
