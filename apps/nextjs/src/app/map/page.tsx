import type { Metadata } from "next";

import { env } from "~/env";
import { createServerCaller } from "~/trpc/server";
import { MapLoader } from "./_components/map-loader";

export const metadata: Metadata = {
  title: "Map · Charlotte greenways and parking",
};

export default async function MapPage() {
  const caller = await createServerCaller();
  const greenways = await caller.greenway.listWithGeometry();
  return (
    <main>
      <MapLoader
        greenways={greenways}
        mapTilerKey={env.NEXT_PUBLIC_MAPTILER_KEY}
      />
    </main>
  );
}
