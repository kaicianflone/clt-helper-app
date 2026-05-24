export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-[color:var(--bg-cream)] focus:p-3 focus:text-[color:var(--brick)] focus:shadow-lg"
    >
      Skip to content
    </a>
  );
}
