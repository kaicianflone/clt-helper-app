import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
} from "@maplibre/maplibre-react-native";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

import { colors, space, type } from "~/styles/tokens";
import { trpc } from "~/utils/api";

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;

export default function MapScreen() {
  const greenways = useQuery(trpc.greenway.listWithGeometry.queryOptions());
  const parking = useQuery(trpc.parking.list.queryOptions());

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.cream }}>
      <MapLibreMap style={{ flex: 1 }} mapStyle={styleUrl}>
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
    </View>
  );
}
