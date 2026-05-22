"use client";

// This client component wrapper exists solely to allow `ssr: false` on the
// MapLibre dynamic import. Next.js 16+ (Turbopack) forbids `ssr: false` in
// Server Components — it must live in a Client Component.
import type { RouterOutputs } from "@clt/api";
import dynamic from "next/dynamic";

type GreenwayWithGeometry =
  RouterOutputs["greenway"]["listWithGeometry"][number];

interface MapLoaderProps {
  greenways: GreenwayWithGeometry[];
  tilesUrl: string | null;
}

// MapLibre-gl requires browser APIs (WebGL, window) and bundles its own CSS.
// Using ssr:false prevents SSR errors and avoids CSS import issues in Next.js.
const GreenwayMap = dynamic(() => import("./map").then((m) => m.GreenwayMap), {
  ssr: false,
});

export function MapLoader({ greenways, tilesUrl }: MapLoaderProps) {
  return <GreenwayMap greenways={greenways} tilesUrl={tilesUrl} />;
}
