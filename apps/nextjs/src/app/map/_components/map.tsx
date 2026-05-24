"use client";

import type { RouterOutputs } from "@clt/api";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

import type { DealLocation } from "../page";
import { buildPopupHtml } from "./popup";

type GreenwayWithGeometry =
  RouterOutputs["greenway"]["listWithGeometry"][number];

interface MapProps {
  greenways: GreenwayWithGeometry[];
  dealLocations: DealLocation[];
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

function escapeHtml(s: string): string {
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

function timeAgo(dateStr: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86_400_000,
  );
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

function buildDealPopupHtml(props: {
  restaurantName: string;
  locationSlug: string;
  dealCount: number;
  lastVerified: string;
}): string {
  return `
    <div class="font-sans">
      <p class="font-semibold text-base leading-tight" style="color:#2a2a2a">${escapeHtml(
        props.restaurantName,
      )}</p>
      <p class="text-sm mt-1" style="color:#5a5a5a">${props.dealCount} deal${
        props.dealCount !== 1 ? "s" : ""
      }</p>
      <p class="text-xs mt-1" style="color:#7a7a7a">Updated ${timeAgo(
        props.lastVerified,
      )}</p>
      <a href="/deals/location/${escapeHtml(
        props.locationSlug,
      )}" class="inline-block mt-3 text-sm font-medium underline" style="color:#B23A1F">View all deals →</a>
    </div>
  `;
}

export function GreenwayMap({
  greenways,
  dealLocations,
  mapTilerKey,
}: MapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    // env.ts validated mapTilerKey shape, but defense in depth: URL-encode
    // before interpolation so a future schema regression cannot smuggle
    // characters into the URL or the request logs MapTiler ships back.
    const styleUrl = `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(
      mapTilerKey,
    )}`;
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

      if (dealLocations.length > 0) {
        map.addSource("deal-locations", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: dealLocations.map((loc) => ({
              type: "Feature" as const,
              properties: {
                restaurantName: loc.restaurantName,
                locationSlug: loc.locationSlug,
                dealCount: loc.dealCount,
                lastVerified: loc.lastVerified,
              },
              geometry: {
                type: "Point" as const,
                coordinates: [loc.latLng[1], loc.latLng[0]],
              },
            })),
          },
        });
        const tagSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="%23D97706" stroke="%23ffffff" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01z"/></svg>`;
        const img = new Image(28, 28);
        img.onload = () => {
          if (!map.hasImage("deal-icon")) map.addImage("deal-icon", img);
          map.addLayer({
            id: "deal-points",
            type: "symbol",
            source: "deal-locations",
            layout: {
              "icon-image": "deal-icon",
              "icon-size": 1,
              "icon-allow-overlap": true,
            },
          });
        };
        img.src = `data:image/svg+xml;charset=utf-8,${tagSvg}`;
      }

      let popup: maplibregl.Popup | null = null;

      map.on("click", "deal-points", (e) => {
        const props = e.features?.[0]?.properties;
        if (!props) return;
        popup?.remove();
        popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "240px",
        })
          .setLngLat(e.lngLat)
          .setHTML(
            buildDealPopupHtml({
              restaurantName: props.restaurantName as string,
              locationSlug: props.locationSlug as string,
              dealCount: props.dealCount as number,
              lastVerified: props.lastVerified as string,
            }),
          )
          .addTo(map);
      });

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
      map.on("mouseenter", "deal-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "deal-points", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
    };
  }, [greenways, dealLocations, mapTilerKey, fallback]);

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
