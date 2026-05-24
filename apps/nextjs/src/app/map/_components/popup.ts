export interface PopupProps {
  slug: string;
  name?: string;
  lengthMiles?: number;
  surface?: string;
  trailheadCount?: number;
  lastVerified?: string;
}

// HTML-escape any string we interpolate into the popup template. Defense in
// depth: greenway data is community-sourced via the contribution flow, so we
// treat name/surface/etc. as untrusted even though the schema validates them.
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&"
      ? "&amp;"
      : c === "<"
        ? "&lt;"
        : c === ">"
          ? "&gt;"
          : c === '"'
            ? "&quot;"
            : "&#39;",
  );
}

export function buildPopupHtml(props: PopupProps): string {
  const detailLines: string[] = [];
  if (props.lengthMiles != null) detailLines.push(`${props.lengthMiles} mi`);
  if (props.surface) detailLines.push(escapeHtml(props.surface));
  const meta1 = detailLines.join(" · ");

  const trailheadLine =
    props.trailheadCount != null
      ? `${props.trailheadCount} trailhead${props.trailheadCount === 1 ? "" : "s"}`
      : "";

  return `
    <div class="font-sans">
      <p class="font-semibold text-base leading-tight" style="color:#2a2a2a">${escapeHtml(props.name ?? "Greenway")}</p>
      ${meta1 ? `<p class="text-sm mt-1" style="color:#5a5a5a">${meta1}</p>` : ""}
      ${trailheadLine ? `<p class="text-xs mt-1" style="color:#7a7a7a">${trailheadLine}</p>` : ""}
      <a href="/greenways/${escapeHtml(props.slug)}" class="inline-block mt-3 text-sm font-medium underline" style="color:#B23A1F">View details →</a>
    </div>
  `;
}
