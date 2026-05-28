/**
 * Single source of truth for GIS marker-kind configuration on the web map.
 *
 * Each entry drives:
 *   - the MapLibre GL JS layer color (hex matches the --map-* CSS token)
 *   - the legend label shown to the user
 *   - the default visibility state
 *
 * Colors intentionally mirror tokens.css `--map-*` values. They are inlined
 * as hex here because MapLibre layer paint properties cannot reference CSS
 * custom properties — CSS vars only work inside browser-rendered DOM.
 */

export interface GisKindConfig {
  /** Unique kind identifier — used as layer/source id prefix */
  kind: string;
  /** Human-readable label for the map legend */
  label: string;
  /** Hex color matching the corresponding --map-* CSS token */
  color: string;
  /** CSS custom property name for the swatch in the legend DOM */
  cssVar: string;
}

export const GIS_KINDS: GisKindConfig[] = [
  {
    kind: "park",
    label: "Parks",
    color: "#3a7a4f",
    cssVar: "--map-park-marker",
  },
  {
    kind: "recycling",
    label: "Recycling Centers",
    color: "#2e7d80",
    cssVar: "--map-recycling",
  },
  {
    kind: "ev-charging",
    label: "EV Charging",
    color: "#2f5fa0",
    cssVar: "--map-ev-charging",
  },
  {
    kind: "transit-parking",
    label: "Transit Parking",
    color: "#5b4b9c",
    cssVar: "--map-transit-parking",
  },
  {
    kind: "landfill",
    label: "Landfill / Drop-off",
    // No dedicated token yet — use a neutral dark olive that reads clearly
    color: "#5c5c2e",
    cssVar: "--map-amenity", // closest existing token; landfill token deferred
  },
  {
    kind: "amenity",
    label: "Amenities",
    color: "#9c6b3f",
    cssVar: "--map-amenity",
  },
] as const;

/** Map from kind string to its config, for O(1) lookup */
export const GIS_KIND_MAP: Readonly<Record<string, GisKindConfig>> =
  Object.fromEntries(GIS_KINDS.map((k) => [k.kind, k]));

/** The ordered list of kind strings */
export const GIS_KIND_KEYS = GIS_KINDS.map((k) => k.kind) as string[];
