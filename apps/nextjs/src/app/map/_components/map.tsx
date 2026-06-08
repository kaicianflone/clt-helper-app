"use client";

import type { RouterOutputs } from "@clt/api";
import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

import type { DealLocation, GisPin, ParkingPin } from "../page";
import type { LayerVisibility } from "./map-legend";
import { GIS_KINDS } from "./map-kinds";
import { MapLegend } from "./map-legend";
import { buildPopupHtml } from "./popup";

type GreenwayWithGeometry =
  RouterOutputs["greenway"]["listWithGeometry"][number];

interface MapProps {
  greenways: GreenwayWithGeometry[];
  dealLocations: DealLocation[];
  parkingPins: ParkingPin[];
  /** New GIS kind pins, keyed by kind string */
  gisPins: Record<string, GisPin[]>;
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

function buildParkingPopupHtml(props: {
  slug: string;
  name: string;
  hourlyRate: number | null;
}): string {
  const rate =
    props.hourlyRate != null ? `$${props.hourlyRate}/hr` : "Rate not posted";
  return `
    <div class="font-sans">
      <p class="font-semibold text-base leading-tight" style="color:#2a2a2a">${escapeHtml(
        props.name,
      )}</p>
      <p class="text-sm mt-1" style="color:#5a5a5a">${rate} · Street parking</p>
      <a href="/parking/${escapeHtml(
        props.slug,
      )}" class="inline-block mt-3 text-sm font-medium underline" style="color:#B23A1F">View details →</a>
    </div>
  `;
}

function buildGisPopupHtml(props: { name: string; kindLabel: string }): string {
  return `
    <div class="font-sans">
      <p class="font-semibold text-base leading-tight" style="color:#2a2a2a">${escapeHtml(props.name)}</p>
      <p class="text-xs mt-1" style="color:#7a7a7a">${escapeHtml(props.kindLabel)}</p>
    </div>
  `;
}

function buildInitialVisibility(): LayerVisibility {
  // Default: only greenways + deals on. Parking and the GIS kinds start hidden
  // so the map opens uncluttered; users opt in via the legend toggles.
  const vis: LayerVisibility = { greenways: true, deals: true, parking: false };
  for (const k of GIS_KINDS) {
    vis[k.kind] = false;
  }
  return vis;
}

export function GreenwayMap({
  greenways,
  dealLocations,
  parkingPins,
  gisPins,
  mapTilerKey,
}: MapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [fallback, setFallback] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [visibility, setVisibility] = useState<LayerVisibility>(
    buildInitialVisibility,
  );

  const handleToggle = useCallback((layerId: keyof LayerVisibility) => {
    setVisibility((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  }, []);

  // Sync visibility state → MapLibre layer visibility.
  // Layer IDs mirror those registered in the map setup useEffect below.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const hitArea = "greenway-hit-area";
    // The visible greenway line layer id:
    const gwLine = ["greenway-", "lines"].join("");
    const layerGroups: Record<string, string[]> = {
      greenways: [hitArea, gwLine],
      deals: ["deal-points"],
      parking: ["parking-clusters", "parking-cluster-count", "parking-points"],
    };
    for (const k of GIS_KINDS) {
      layerGroups[k.kind] = [`gis-${k.kind}-points`];
    }

    for (const [groupKey, layerIds] of Object.entries(layerGroups)) {
      const vis = visibility[groupKey] ?? true;
      const value = vis ? "visible" : "none";
      for (const layerId of layerIds) {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", value);
        }
      }
    }
  }, [visibility, mapLoaded]);

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

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: ref.current,
        style,
        center: [-80.8431, 35.2271],
        zoom: 11,
      });
    } catch {
      queueMicrotask(() => setFallback(true));
      return;
    }

    mapRef.current = map;

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
      setMapLoaded(true);

      map.addSource("greenways", {
        type: "geojson",
        // Disable MapLibre's per-tile Douglas-Peucker simplification (default
        // tolerance 0.375). At low zoom that tolerance maps to a large ground
        // distance and drops vertices, flattening trail curves into jagged
        // segments. Only 63 trails, so keeping full fidelity is cheap.
        tolerance: 0,
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
        id: "greenway-hit-area",
        type: "line",
        source: "greenways",
        paint: {
          "line-color": "transparent",
          "line-width": 44,
          "line-opacity": 0,
        },
      });
      map.addLayer({
        id: "greenway-lines",
        type: "line",
        source: "greenways",
        layout: {
          // Round joins/caps smooth the rendered line at vertices and ends.
          "line-join": "round",
          "line-cap": "round",
        },
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
          // Deal pins must sit above the greenway lines. This layer is added in
          // an async image-load callback, so its position relative to the
          // greenway layers isn't guaranteed by add order — move it to the top
          // explicitly so a future change to load timing can't bury the pins.
          map.moveLayer("deal-points");
        };
        img.src = `data:image/svg+xml;charset=utf-8,${tagSvg}`;
      }

      if (parkingPins.length > 0) {
        map.addSource("parking-locations", {
          type: "geojson",
          cluster: true,
          clusterMaxZoom: 15,
          clusterRadius: 60,
          data: {
            type: "FeatureCollection",
            features: parkingPins.map((p) => ({
              type: "Feature" as const,
              properties: {
                slug: p.slug,
                name: p.name,
                hourlyRate: p.hourlyRate,
              },
              geometry: {
                type: "Point" as const,
                coordinates: [p.latLng[1], p.latLng[0]],
              },
            })),
          },
        });

        map.addLayer({
          id: "parking-clusters",
          type: "circle",
          source: "parking-locations",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#3B82F6",
              10,
              "#2563EB",
              30,
              "#1D4ED8",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              18,
              10,
              24,
              30,
              30,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.addLayer({
          id: "parking-cluster-count",
          type: "symbol",
          source: "parking-locations",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 13,
            "text-font": ["Open Sans Bold"],
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        const pSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="%232563EB" stroke="%23ffffff" stroke-width="2"/><text x="12" y="16.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="white">P</text></svg>`;
        const pImg = new Image(24, 24);
        pImg.onload = () => {
          if (!map.hasImage("parking-icon")) map.addImage("parking-icon", pImg);
          map.addLayer({
            id: "parking-points",
            type: "symbol",
            source: "parking-locations",
            filter: ["!", ["has", "point_count"]],
            layout: {
              "icon-image": "parking-icon",
              "icon-size": 1,
              "icon-allow-overlap": true,
            },
          });
        };
        pImg.src = `data:image/svg+xml;charset=utf-8,${pSvg}`;
      }

      // New GIS kind layers — one circle layer per kind.
      // Layers are always added (even for empty data) so visibility toggling
      // works uniformly and the legend always shows all entries.
      for (const kindCfg of GIS_KINDS) {
        const pins = gisPins[kindCfg.kind] ?? [];
        const sourceId = `gis-${kindCfg.kind}`;
        const layerId = `gis-${kindCfg.kind}-points`;

        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: pins.map((p) => ({
              type: "Feature" as const,
              properties: { name: p.name, kind: kindCfg.kind },
              geometry: {
                type: "Point" as const,
                // pins use [lat, lng] — convert to MapLibre [lng, lat]
                coordinates: [p.latLng[1], p.latLng[0]],
              },
            })),
          },
        });

        map.addLayer({
          id: layerId,
          type: "circle",
          source: sourceId,
          paint: {
            "circle-color": kindCfg.color,
            "circle-radius": 8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.9,
          },
        });
      }

      let popup: maplibregl.Popup | null = null;

      const focusPopup = (p: maplibregl.Popup) => {
        const el = p.getElement();
        const closeBtn = el.querySelector<HTMLElement>(
          ".maplibregl-popup-close-button",
        );
        if (closeBtn) closeBtn.setAttribute("aria-label", "Close popup");
        const firstLink = el.querySelector<HTMLElement>("a, button");
        if (firstLink) firstLink.focus();
      };

      map.on("click", "parking-clusters", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const clusterId = feature.properties.cluster_id as number;
        const raw = map.getSource("parking-locations");
        if (!raw) return;
        const source = raw as maplibregl.GeoJSONSource;
        void source.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.easeTo({
            center: (feature.geometry as GeoJSON.Point).coordinates as [
              number,
              number,
            ],
            zoom: zoom + 0.5,
            duration: 500,
          });
        });
      });

      map.on("click", "parking-points", (e) => {
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
            buildParkingPopupHtml({
              slug: props.slug as string,
              name: props.name as string,
              hourlyRate: props.hourlyRate as number | null,
            }),
          )
          .addTo(map);
        focusPopup(popup);
      });

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
        focusPopup(popup);
      });

      map.on("click", "greenway-hit-area", (e) => {
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
        focusPopup(popup);
      });

      // GIS kind click handlers
      for (const kindCfg of GIS_KINDS) {
        const layerId = `gis-${kindCfg.kind}-points`;
        map.on("click", layerId, (e) => {
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
              buildGisPopupHtml({
                name: props.name as string,
                kindLabel: kindCfg.label,
              }),
            )
            .addTo(map);
          focusPopup(popup);
        });
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      map.on("mouseenter", "greenway-hit-area", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "greenway-hit-area", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "deal-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "deal-points", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "parking-clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "parking-clusters", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "parking-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "parking-points", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      setMapLoaded(false);
      mapRef.current = null;
      map.remove();
    };
  }, [greenways, dealLocations, parkingPins, gisPins, mapTilerKey, fallback]);

  return (
    <div
      className="relative h-[calc(100dvh-4rem)] w-full md:h-[100dvh]"
      role="application"
      aria-label="Charlotte greenways map"
    >
      <div ref={ref} className="h-full w-full" />
      {fallback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Map tiles unavailable — showing greenways on a plain background.
        </div>
      )}
      <MapLegend visibility={visibility} onToggle={handleToggle} />
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
