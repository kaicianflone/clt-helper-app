"use client";

import type { RouterOutputs } from "@clt/api";
import dynamic from "next/dynamic";

import type { DealLocation } from "../page";

type GreenwayWithGeometry =
  RouterOutputs["greenway"]["listWithGeometry"][number];

interface MapLoaderProps {
  greenways: GreenwayWithGeometry[];
  dealLocations: DealLocation[];
  mapTilerKey: string;
}

const GreenwayMap = dynamic(() => import("./map").then((m) => m.GreenwayMap), {
  ssr: false,
});

export function MapLoader({ greenways, dealLocations, mapTilerKey }: MapLoaderProps) {
  return <GreenwayMap greenways={greenways} dealLocations={dealLocations} mapTilerKey={mapTilerKey} />;
}
