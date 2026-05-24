"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

interface Props {
  latLng: [number, number];
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

export function DealMapSnippet({ latLng, mapTilerKey }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const styleUrl = `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(
      mapTilerKey,
    )}`;
    const style: string | maplibregl.StyleSpecification = fallback
      ? FALLBACK_STYLE
      : styleUrl;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: ref.current,
        style,
        center: [latLng[1], latLng[0]],
        zoom: 15,
        attributionControl: { compact: true },
      });
    } catch {
      setFallback(true);
      return;
    }

    type MapErrorEvent = maplibregl.MapLibreEvent & {
      error?: { message?: string };
      sourceId?: string;
    };
    map.on("error", (e: MapErrorEvent) => {
      if (fallback) return;
      const isStyleError = e.sourceId !== "deal-marker";
      if (!isStyleError) return;
      setFallback(true);
    });

    map.on("load", () => {
      map.addSource("deal-marker", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [latLng[1], latLng[0]],
          },
        },
      });
      map.addLayer({
        id: "deal-point",
        type: "circle",
        source: "deal-marker",
        paint: {
          "circle-radius": 8,
          "circle-color": "#9B2C2C",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    });

    return () => {
      map.remove();
    };
  }, [latLng, mapTilerKey, fallback]);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg border border-[color:var(--border-soft)]">
      <div ref={ref} className="h-full w-full" />
      {fallback && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900">
          Map tiles unavailable
        </div>
      )}
    </div>
  );
}
