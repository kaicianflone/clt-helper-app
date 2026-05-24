import type { Metadata } from "next";
import Link from "next/link";

import { env } from "~/env";
import { createServerCaller } from "~/trpc/server";
import { MapLoader } from "./_components/map-loader";

// Greenway geometry is ~1.6 MB. ISR caches the rendered HTML so we don't
// re-serialize all 63 MultiLineStrings on every request.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Map",
};

export default async function MapPage() {
  const caller = await createServerCaller();
  const greenways = await caller.greenway.listWithGeometry();
  return (
    <main>
      <Link
        href="/"
        className="font-display fixed top-4 left-4 z-50 rounded-full bg-[color:var(--bg-cream)] px-3 py-1.5 text-sm font-bold text-[color:var(--brick)] shadow-md hover:bg-[color:var(--bg-cream-deep)]"
      >
        clt
      </Link>
      <MapLoader
        greenways={greenways}
        mapTilerKey={env.NEXT_PUBLIC_MAPTILER_KEY}
      />
    </main>
  );
}
