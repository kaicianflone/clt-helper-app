import type { Metadata } from "next";

import { env } from "~/env";
import { createServerCaller } from "~/trpc/server";
import { MapLoader } from "./_components/map-loader";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Map · Charlotte greenways and parking",
};

async function fetchTilesUrl(): Promise<string | null> {
  const baseUrl = env.R2_PUBLIC_BASE_URL;
  if (!baseUrl) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${baseUrl}/tiles/manifest.json`, {
      signal: ctrl.signal,
      next: { revalidate: 60 },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { current?: string };
    if (!data.current) return null;
    return `${baseUrl}/${data.current}`;
  } catch {
    return null;
  }
}

export default async function MapPage() {
  const caller = await createServerCaller();
  const greenways = await caller.greenway.listWithGeometry();
  const tilesUrl = await fetchTilesUrl();
  return (
    <main>
      <MapLoader greenways={greenways} tilesUrl={tilesUrl} />
    </main>
  );
}
