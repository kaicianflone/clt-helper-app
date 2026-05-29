"use client";

import { useState } from "react";

import { GIS_KINDS } from "./map-kinds";

interface LegendRowProps {
  label: string;
  /** Hex color for the swatch */
  color: string;
  visible: boolean;
  onToggle: () => void;
  /** Whether this is a line layer (greenway) vs circle marker */
  shape: "line" | "circle";
}

/** Inner content of a legend row (without the <li> wrapper) */
function LegendRowInner({
  label,
  color,
  visible,
  onToggle,
  shape,
}: LegendRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={visible}
      aria-label={`${visible ? "Hide" : "Show"} ${label}`}
      className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-sm hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[color:var(--brick)] focus-visible:outline-none active:bg-black/10"
      style={{ opacity: visible ? 1 : 0.45 }}
    >
      {shape === "line" ? (
        <span
          className="inline-block h-0.5 w-5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      ) : (
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}
      <span className="leading-tight" style={{ color: "var(--fg-ink-soft)" }}>
        {label}
      </span>
    </button>
  );
}

export interface LayerVisibility {
  greenways: boolean;
  deals: boolean;
  parking: boolean;
  /** keyed by GisKindConfig.kind */
  [gisKind: string]: boolean;
}

interface MapLegendProps {
  visibility: LayerVisibility;
  onToggle: (layerId: keyof LayerVisibility) => void;
}

/** Collapsible map legend / key panel positioned over the map. */
export function MapLegend({ visibility, onToggle }: MapLegendProps) {
  // Closed by default — the panel opens on tap to keep the initial map clean.
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div
      className="absolute right-2 bottom-16 z-10 rounded-lg shadow-md md:right-4 md:bottom-8"
      style={{
        backgroundColor: "var(--bg-cream-soft)",
        border: "1px solid var(--border-soft)",
        minWidth: "11rem",
      }}
    >
      {/* Header / collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-controls="map-legend-body"
        className="flex w-full items-center justify-between rounded-t-lg px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[color:var(--brick)] focus-visible:outline-none"
        style={{ color: "var(--fg-ink-muted)" }}
      >
        <span>Map layers</span>
        <span aria-hidden="true" className="ml-2">
          {collapsed ? "▸" : "▾"}
        </span>
      </button>

      {!collapsed && (
        <div id="map-legend-body" className="px-3 pt-1 pb-3">
          <ul className="flex flex-col gap-1.5">
            {/* Existing kinds */}
            <li>
              <LegendRowInner
                label="Greenways"
                color="#2f6e3a"
                visible={visibility.greenways}
                onToggle={() => onToggle("greenways")}
                shape="line"
              />
            </li>
            <li>
              <LegendRowInner
                label="Deals"
                color="#b8902d"
                visible={visibility.deals}
                onToggle={() => onToggle("deals")}
                shape="circle"
              />
            </li>
            <li>
              <LegendRowInner
                label="Parking"
                color="#b23a1f"
                visible={visibility.parking}
                onToggle={() => onToggle("parking")}
                shape="circle"
              />
            </li>

            {/* New GIS kinds — derived from GIS_KINDS config; key on <li> not on custom component */}
            {GIS_KINDS.map((k) => (
              <li key={k.kind}>
                <LegendRowInner
                  label={k.label}
                  color={k.color}
                  visible={visibility[k.kind] ?? true}
                  onToggle={() => onToggle(k.kind)}
                  shape="circle"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
