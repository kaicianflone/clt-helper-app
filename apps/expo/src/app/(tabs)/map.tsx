import type { StyleSpecification } from "@maplibre/maplibre-react-native";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
} from "@maplibre/maplibre-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { colors, space, type } from "~/styles/tokens";

const TILES_MANIFEST_URL = `${process.env.EXPO_PUBLIC_R2_BASE_URL ?? "https://cdn.clt-app.com"}/tiles/manifest.json`;

const FALLBACK_STYLE: StyleSpecification = {
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

const buildVectorStyle = (tilesUrl: string): StyleSpecification => ({
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
      id: "roads",
      type: "line",
      source: "basemap",
      "source-layer": "osm",
      filter: ["has", "highway"],
      paint: { "line-color": "#E2D6C2", "line-width": 1 },
    },
  ],
});

export default function MapScreen() {
  const greenways = useQuery(trpc.greenway.listWithGeometry.queryOptions());
  const parking = useQuery(trpc.parking.list.queryOptions());

  const [tilesUrl, setTilesUrl] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    fetch(TILES_MANIFEST_URL, { signal: ctrl.signal })
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`${r.status}`)),
      )
      .then((data: { current?: string }) => {
        if (data.current) {
          const base =
            process.env.EXPO_PUBLIC_R2_BASE_URL ?? "https://cdn.clt-app.com";
          setTilesUrl(`${base}/${data.current}`);
        } else {
          setTilesUrl(null);
        }
      })
      .catch(() => setTilesUrl(null))
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  if (tilesUrl === undefined) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.bg.cream,
        }}
      >
        <ActivityIndicator color={colors.brick.DEFAULT} />
        <Text
          style={{
            ...type.bodySm,
            color: colors.fg.inkMuted,
            marginTop: space[2],
          }}
        >
          Loading map...
        </Text>
      </View>
    );
  }

  const mapStyle = tilesUrl ? buildVectorStyle(tilesUrl) : FALLBACK_STYLE;

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.cream }}>
      <MapLibreMap style={{ flex: 1 }} mapStyle={mapStyle}>
        <Camera
          // Charlotte, NC city center
          center={[-80.8431, 35.2271]}
          zoom={11}
        />

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
            paint={{
              "line-color": "#2F6E3A",
              "line-width": 3,
              "line-opacity": 0.9,
            }}
          />
        </GeoJSONSource>

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
            paint={{
              "circle-color": "#B23A1F",
              "circle-radius": 5,
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1,
            }}
          />
        </GeoJSONSource>
      </MapLibreMap>

      {tilesUrl === null && (
        <View
          style={{
            position: "absolute",
            top: space[4],
            left: space[4],
            right: space[4],
            padding: space[3],
            backgroundColor: "#FDF6E3",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.amber,
          }}
        >
          <Text style={{ ...type.bodySm, color: "#7A5A0E" }}>
            Map tiles unavailable. Showing trails and lots on a plain
            background.
          </Text>
        </View>
      )}
    </View>
  );
}
