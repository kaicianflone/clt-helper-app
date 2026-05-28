"use client";

import type { RouterOutputs } from "@clt/api";
import dynamic from "next/dynamic";

import type { DealLocation, GisPin, ParkingPin } from "../page";

type GreenwayWithGeometry =
  RouterOutputs["greenway"]["listWithGeometry"][number];

interface MapLoaderProps {
  greenways: GreenwayWithGeometry[];
  dealLocations: DealLocation[];
  parkingPins: ParkingPin[];
  /** New GIS kind pins, keyed by kind string */
  gisPins: Record<string, GisPin[]>;
  mapTilerKey: string;
}

const GreenwayMap = dynamic(() => import("./map").then((m) => m.GreenwayMap), {
  ssr: false,
});

export function MapLoader({
  greenways,
  dealLocations,
  parkingPins,
  gisPins,
  mapTilerKey,
}: MapLoaderProps) {
  return (
    <GreenwayMap
      greenways={greenways}
      dealLocations={dealLocations}
      parkingPins={parkingPins}
      gisPins={gisPins}
      mapTilerKey={mapTilerKey}
    />
  );
}
