// apps/nextjs/src/components/marketing/GlyphDivider.tsx
export function GlyphDivider(props: { glyph?: string }) {
  const g = props.glyph ?? "⟡";
  return (
    <p
      aria-hidden="true"
      className="py-9 text-center tracking-[0.5em] text-[color:var(--gold)]"
    >
      {`${g}  ${g}  ${g}`}
    </p>
  );
}
