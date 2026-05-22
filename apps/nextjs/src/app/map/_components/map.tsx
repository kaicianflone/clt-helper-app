"use client";

import type { RouterOutputs } from "@clt/api";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";

type GreenwayWithGeometry =
  RouterOutputs["greenway"]["listWithGeometry"][number];

interface MapProps {
  greenways: GreenwayWithGeometry[];
  tilesUrl: string | null; // null when manifest fetch fails — triggers fallback
}

const FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#F5EFE6" },
    },
  ],
};

const buildVectorStyle = (tilesUrl: string): maplibregl.StyleSpecification => ({
  version: 8,
  sources: {
    basemap: { type: "vector", url: `pmtiles://${tilesUrl}` },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#F5EFE6" },
    },
    {
      id: "park",
      type: "fill",
      source: "basemap",
      "source-layer": "osm",
      filter: ["==", ["get", "leisure"], "park"],
      paint: { "fill-color": "#C3D4B5", "fill-opacity": 0.7 },
    },
    {
      id: "water",
      type: "fill",
      source: "basemap",
      "source-layer": "osm",
      filter: ["has", "water"],
      paint: { "fill-color": "#C8D8DC" },
    },
    {
      id: "roads",
      type: "line",
      source: "basemap",
      "source-layer": "osm",
      filter: ["has", "highway"],
      paint: { "line-color": "#E2D6C2", "line-width": 1.2 },
    },
  ],
});

// Register the pmtiles protocol and return whether registration succeeded.
// Called once per map mount — kept outside the component to be a pure side-effect
// so we never call setState inside the effect body (satisfies react-hooks/set-state-in-effect).
function tryRegisterPmtilesProtocol(): boolean {
  try {
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return true;
  } catch (err) {
    console.error("pmtiles protocol failed, falling back", err);
    return false;
  }
}

export function GreenwayMap({ greenways, tilesUrl }: MapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(tilesUrl === null);

  useEffect(() => {
    if (!ref.current) return;

    // Determine whether to use vector tiles for this render cycle.
    // We intentionally read `fallback` from closure — if a previous map
    // error already degraded us to fallback mode, we stay there.
    const useVector = tilesUrl !== null && !fallback;
    let protocolRegistered = false;

    if (useVector) {
      protocolRegistered = tryRegisterPmtilesProtocol();
      // If protocol registration failed, stay on fallback style but don't
      // call setState here — we just use the fallback style synchronously.
    }

    const style =
      useVector && protocolRegistered && tilesUrl
        ? buildVectorStyle(tilesUrl)
        : FALLBACK_STYLE;

    const map = new maplibregl.Map({
      container: ref.current,
      style,
      center: [-80.8431, 35.2271],
      zoom: 11,
    });

    type MapErrorEvent = maplibregl.MapLibreEvent & {
      error?: { message?: string };
      sourceId?: string;
    };
    map.on("error", (e: MapErrorEvent) => {
      const isPmtilesError =
        typeof e.error?.message === "string" &&
        e.error.message.includes("pmtiles");
      const isBasemapError = e.sourceId === "basemap";
      if (isPmtilesError || isBasemapError) {
        console.warn("Map source error — degrading to fallback", e);
        setFallback(true);
      }
    });

    map.on("load", () => {
      map.addSource("greenways", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: greenways.map((g) => ({
            type: "Feature",
            properties: { slug: g.slug, name: g.name },
            geometry: g.geometry as GeoJSON.Geometry,
          })),
        },
      });
      map.addLayer({
        id: "greenway-lines",
        type: "line",
        source: "greenways",
        paint: {
          "line-color": "#2F6E3A",
          "line-width": 3,
          "line-opacity": 0.9,
        },
      });

      map.on("click", "greenway-lines", (e) => {
        const props = e.features?.[0]?.properties as
          | { slug?: string }
          | undefined;
        if (props?.slug) {
          window.location.href = `/greenways/${props.slug}`;
        }
      });
      map.on("mouseenter", "greenway-lines", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "greenway-lines", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      if (protocolRegistered) {
        try {
          maplibregl.removeProtocol("pmtiles");
        } catch {
          /* ignore */
        }
      }
    };
  }, [greenways, tilesUrl, fallback]);

  return (
    <div className="relative h-screen w-full">
      <div ref={ref} className="absolute inset-0" />
      {fallback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Map tiles unavailable — showing greenways on a plain background.
        </div>
      )}
    </div>
  );
}
