import { useState } from "react";
import { Text, View } from "react-native";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
} from "@maplibre/maplibre-react-native";
import { useQuery } from "@tanstack/react-query";

import { MapLegend } from "~/components/map-legend";
import {
  buildDefaultVisibility,
  MAP_KIND_CONFIGS,
  toggleKindVisibility,
} from "~/map/kinds";
import { colors, space, type } from "~/styles/tokens";
import { trpc } from "~/utils/api";

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;

export default function MapScreen() {
  const [visibility, setVisibility] = useState(() =>
    buildDefaultVisibility(MAP_KIND_CONFIGS),
  );

  const greenways = useQuery(trpc.greenway.listWithGeometry.queryOptions());
  const parking = useQuery(trpc.parking.list.queryOptions());
  const parks = useQuery(trpc.park.list.queryOptions());
  const recycling = useQuery(trpc.recycling.list.queryOptions());
  const transitParking = useQuery(trpc.transitParking.list.queryOptions());
  const evCharging = useQuery(trpc.evCharging.list.queryOptions());
  const landfill = useQuery(trpc.landfill.list.queryOptions());
  const amenity = useQuery(trpc.amenity.list.queryOptions());

  // --- Feature builders ---

  const greenwayFeatures = (greenways.data ?? []).map((g) => ({
    type: "Feature" as const,
    properties: { slug: g.slug, name: g.name },
    geometry: g.geometry as GeoJSON.Geometry,
  }));

  const parkingFeatures = (parking.data ?? []).map((p) => ({
    type: "Feature" as const,
    properties: { slug: p.slug, name: p.name },
    geometry: {
      type: "Point" as const,
      // latLng is [lat, lng]; GeoJSON expects [lng, lat]
      coordinates: [p.latLng[1], p.latLng[0]] as [number, number],
    },
  }));

  /** Builds a Point FeatureCollection from a point-entity list (center: {lat,lng}). */
  const toPointCollection = (
    rows:
      | { slug: string; name: string; center: { lat: number; lng: number } }[]
      | undefined,
  ): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: (rows ?? []).map((r) => ({
      type: "Feature" as const,
      properties: { slug: r.slug, name: r.name },
      geometry: {
        type: "Point" as const,
        coordinates: [r.center.lng, r.center.lat] as [number, number],
      },
    })),
  });

  // --- Handlers ---

  function handleToggle(kind: string) {
    setVisibility((prev) => toggleKindVisibility(prev, kind));
  }

  // --- Guard ---

  if (!MAPTILER_KEY) {
    return (
      <View
        style={{
          flex: 1,
          padding: space[4],
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.bg.cream,
        }}
      >
        <Text style={{ ...type.bodySm, color: "#7A5A0E", textAlign: "center" }}>
          Map tiles unavailable: EXPO_PUBLIC_MAPTILER_KEY is not set. Add a free
          MapTiler key (https://cloud.maptiler.com/account/keys/) to .env.
        </Text>
      </View>
    );
  }

  const styleUrl = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

  /** Returns the MapLibre layout visibility value for a given kind */
  const layerVisibility = (kind: string): "visible" | "none" =>
    visibility[kind] !== false ? "visible" : "none";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.cream }}>
      <MapLibreMap style={{ flex: 1 }} mapStyle={styleUrl}>
        <Camera
          // Charlotte, NC city center
          center={[-80.8431, 35.2271]}
          zoom={11}
        />

        {/* ── Greenway trail lines ── */}
        <GeoJSONSource
          id="greenways"
          data={{
            type: "FeatureCollection",
            features: greenwayFeatures,
          }}
        >
          <Layer
            id="greenway-lines"
            type="line"
            layout={{ visibility: layerVisibility("greenway") }}
            paint={{
              "line-color": colors.map.trail,
              "line-width": 3,
              "line-opacity": 0.9,
            }}
          />
        </GeoJSONSource>

        {/* ── Parking lot markers ── */}
        <GeoJSONSource
          id="parking"
          data={{
            type: "FeatureCollection",
            features: parkingFeatures,
          }}
        >
          <Layer
            id="parking-points"
            type="circle"
            layout={{ visibility: layerVisibility("parking") }}
            paint={{
              "circle-color": colors.map.parking,
              "circle-radius": 5,
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1,
            }}
          />
        </GeoJSONSource>

        {/* ── Park markers ── (data from future park API route; graceful empty) */}
        <GeoJSONSource id="parks" data={toPointCollection(parks.data)}>
          <Layer
            id="park-points"
            type="circle"
            layout={{ visibility: layerVisibility("park") }}
            paint={{
              "circle-color": colors.map.park,
              "circle-radius": 6,
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1,
            }}
          />
        </GeoJSONSource>

        {/* ── Recycling center markers ── */}
        <GeoJSONSource id="recycling" data={toPointCollection(recycling.data)}>
          <Layer
            id="recycling-points"
            type="circle"
            layout={{ visibility: layerVisibility("recycling") }}
            paint={{
              "circle-color": colors.map.recycling,
              "circle-radius": 5,
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1,
            }}
          />
        </GeoJSONSource>

        {/* ── EV charging station markers ── */}
        <GeoJSONSource
          id="ev-charging"
          data={toPointCollection(evCharging.data)}
        >
          <Layer
            id="ev-charging-points"
            type="circle"
            layout={{ visibility: layerVisibility("ev-charging") }}
            paint={{
              "circle-color": colors.map.evCharging,
              "circle-radius": 5,
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1,
            }}
          />
        </GeoJSONSource>

        {/* ── Transit parking markers ── */}
        <GeoJSONSource
          id="transit-parking"
          data={toPointCollection(transitParking.data)}
        >
          <Layer
            id="transit-parking-points"
            type="circle"
            layout={{ visibility: layerVisibility("transit-parking") }}
            paint={{
              "circle-color": colors.map.transitParking,
              "circle-radius": 5,
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1,
            }}
          />
        </GeoJSONSource>

        {/* ── Landfill / waste facility markers ── */}
        <GeoJSONSource id="landfill" data={toPointCollection(landfill.data)}>
          <Layer
            id="landfill-points"
            type="circle"
            layout={{ visibility: layerVisibility("landfill") }}
            paint={{
              "circle-color": colors.map.landfill,
              "circle-radius": 5,
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1,
            }}
          />
        </GeoJSONSource>

        {/* ── Amenity markers ── */}
        <GeoJSONSource id="amenity" data={toPointCollection(amenity.data)}>
          <Layer
            id="amenity-points"
            type="circle"
            layout={{ visibility: layerVisibility("amenity") }}
            paint={{
              "circle-color": colors.map.amenity,
              "circle-radius": 5,
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1,
            }}
          />
        </GeoJSONSource>
      </MapLibreMap>

      {/* ── Layer legend + visibility toggles ── */}
      <MapLegend
        configs={MAP_KIND_CONFIGS}
        visibility={visibility}
        onToggle={handleToggle}
      />
    </View>
  );
}
