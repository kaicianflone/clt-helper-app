"use client";

import type { RouterOutputs } from "@clt/api";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

import { buildPopupHtml } from "./popup";

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

    // env.ts validated mapTilerKey shape, but defense in depth: URL-encode
    // before interpolation so a future schema regression cannot smuggle
    // characters into the URL or the request logs MapTiler ships back.
    const styleUrl = `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(mapTilerKey)}`;
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
      sourceId?: string;
    };
    map.on("error", (e: MapErrorEvent) => {
      // Already in fallback — don't thrash the effect with repeat setFallback
      // calls that would re-run the entire setup and risk an error storm.
      if (fallback) return;
      // Only degrade for tile-source / style errors. Greenway-overlay
      // GeoJSON errors should not nuke the basemap.
      const isStyleError = e.sourceId !== "greenways";
      if (!isStyleError) return;
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
            properties: {
              slug: g.slug,
              name: g.name,
              lengthMiles: g.lengthMiles,
              surface: g.surface,
              trailheadCount: g.trailheadCount,
              lastVerified: g.lastVerified,
            },
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

      let popup: maplibregl.Popup | null = null;
      map.on("click", "greenway-lines", (e) => {
        const props = e.features?.[0]?.properties as
          | {
              slug?: string;
              name?: string;
              lengthMiles?: number;
              surface?: string;
              trailheadCount?: number;
              lastVerified?: string;
            }
          | undefined;
        if (!props?.slug) return;

        popup?.remove();
        popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "260px",
        })
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHtml({ ...props, slug: props.slug }))
          .addTo(map);
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
    <div
      className="relative h-screen w-full"
      role="application"
      aria-label="Charlotte greenways map"
    >
      <div ref={ref} className="h-full w-full" />
      {fallback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Map tiles unavailable — showing greenways on a plain background.
        </div>
      )}
      <ul className="sr-only">
        {greenways.map((g) => (
          <li key={g.slug}>
            <a href={`/greenways/${g.slug}`}>{g.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
