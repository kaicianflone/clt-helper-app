"use client";

import type { RouterOutputs } from "@clt/api";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

type GreenwayWithGeometry =
  RouterOutputs["greenway"]["listWithGeometry"][number];

interface MapProps {
  greenways: GreenwayWithGeometry[];
  mapTilerKey: string;
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

export function GreenwayMap({ greenways, mapTilerKey }: MapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const styleUrl = `https://api.maptiler.com/maps/streets-v2/style.json?key=${mapTilerKey}`;
    const style: string | maplibregl.StyleSpecification = fallback
      ? FALLBACK_STYLE
      : styleUrl;

    const map = new maplibregl.Map({
      container: ref.current,
      style,
      center: [-80.8431, 35.2271],
      zoom: 11,
    });

    type MapErrorEvent = maplibregl.MapLibreEvent & {
      error?: { message?: string };
    };
    map.on("error", (e: MapErrorEvent) => {
      // Degrade to fallback styling if MapTiler is unreachable. The greenway
      // overlay is still useful on a plain background.
      const message = e.error?.message ?? "unknown";
      console.warn(
        JSON.stringify({
          event: "tiles.error",
          source: "maptiler",
          error: message.slice(0, 200),
        }),
      );
      setFallback(true);
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
    };
  }, [greenways, mapTilerKey, fallback]);

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
