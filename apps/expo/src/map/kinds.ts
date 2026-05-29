/**
 * Single source of truth for map layer kinds on mobile.
 *
 * Each entry defines:
 *   - kind:   stable identifier (matches data-schema EntityKind where applicable)
 *   - color:  marker / layer color from the --map-* design tokens
 *   - label:  human-readable legend label
 *   - layer:  MapLibre layer type for this kind
 *
 * Colors mirror the --map-* CSS token values in DESIGN.md.
 * New kinds (park, recycling, ev-charging, transit-parking, landfill, amenity)
 * degrade gracefully with empty feature collections until their API routes ship.
 */

import { colors } from "../styles/tokens";

export type MapLayerType = "line" | "circle";

export interface MapKindConfig {
  /** Stable kind identifier */
  kind: string;
  /** Hex color used for the layer paint and legend swatch */
  color: string;
  /** Human-readable label shown in the legend */
  label: string;
  /** MapLibre layer geometry type */
  layerType: MapLayerType;
  /** MapLibre GeoJSON source id (must be unique per map) */
  sourceId: string;
  /** MapLibre layer id (must be unique per map) */
  layerId: string;
}

export const MAP_KIND_CONFIGS: readonly MapKindConfig[] = [
  {
    kind: "greenway",
    color: colors.map.trail,
    label: "Greenways",
    layerType: "line",
    sourceId: "greenways",
    layerId: "greenway-lines",
  },
  {
    kind: "parking",
    color: colors.map.parking,
    label: "Parking",
    layerType: "circle",
    sourceId: "parking",
    layerId: "parking-points",
  },
  {
    kind: "park",
    color: colors.map.park,
    label: "Parks",
    layerType: "circle",
    sourceId: "parks",
    layerId: "park-points",
  },
  {
    kind: "recycling",
    color: colors.map.recycling,
    label: "Recycling",
    layerType: "circle",
    sourceId: "recycling",
    layerId: "recycling-points",
  },
  {
    kind: "ev-charging",
    color: colors.map.evCharging,
    label: "EV Charging",
    layerType: "circle",
    sourceId: "ev-charging",
    layerId: "ev-charging-points",
  },
  {
    kind: "transit-parking",
    color: colors.map.transitParking,
    label: "Transit Parking",
    layerType: "circle",
    sourceId: "transit-parking",
    layerId: "transit-parking-points",
  },
  {
    kind: "landfill",
    color: colors.map.landfill,
    label: "Landfill / Waste",
    layerType: "circle",
    sourceId: "landfill",
    layerId: "landfill-points",
  },
  {
    kind: "amenity",
    color: colors.map.amenity,
    label: "Amenities",
    layerType: "circle",
    sourceId: "amenity",
    layerId: "amenity-points",
  },
] as const;

export type LayerVisibility = Record<string, boolean>;

/** Kinds enabled on first load. Everything else starts hidden (opt-in via legend). */
const DEFAULT_VISIBLE_KINDS = new Set(["greenway", "deal"]);

/** Default visibility: only greenways/deals on; all other layers start hidden. */
export function buildDefaultVisibility(
  configs: readonly MapKindConfig[],
): LayerVisibility {
  return Object.fromEntries(
    configs.map((c) => [c.kind, DEFAULT_VISIBLE_KINDS.has(c.kind)]),
  );
}

/** Toggle a single kind in a visibility state (immutable — returns new object) */
export function toggleKindVisibility(
  state: LayerVisibility,
  kind: string,
): LayerVisibility {
  return { ...state, [kind]: !state[kind] };
}

/** Lookup a config by kind string. Returns undefined if not found. */
export function getKindConfig(kind: string): MapKindConfig | undefined {
  return MAP_KIND_CONFIGS.find((c) => c.kind === kind);
}
