"use client";

import dynamic from "next/dynamic";

interface Props {
  latLng: [number, number];
  mapTilerKey: string;
}

const DealMapSnippet = dynamic(
  () => import("./deal-map-snippet").then((m) => m.DealMapSnippet),
  { ssr: false }
);

export function DealMapSnippetLoader(props: Props) {
  return <DealMapSnippet {...props} />;
}
