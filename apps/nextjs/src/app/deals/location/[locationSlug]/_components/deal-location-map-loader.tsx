"use client";

import dynamic from "next/dynamic";

interface Props {
  latLng: [number, number];
  mapTilerKey: string;
}

const DealMapSnippet = dynamic(
  () =>
    import("~/app/deals/[slug]/_components/deal-map-snippet").then(
      (m) => m.DealMapSnippet
    ),
  { ssr: false }
);

export function DealLocationMapLoader(props: Props) {
  return <DealMapSnippet {...props} />;
}
