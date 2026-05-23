"use client";

import dynamic from "next/dynamic";

interface Props {
  geometry: GeoJSON.MultiLineString;
  mapTilerKey: string;
}

const GreenwayMapSnippet = dynamic(
  () =>
    import("./greenway-map-snippet").then((m) => m.GreenwayMapSnippet),
  { ssr: false },
);

export function GreenwayMapSnippetLoader(props: Props) {
  return <GreenwayMapSnippet {...props} />;
}
