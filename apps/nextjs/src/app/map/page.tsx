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

export interface DealLocation {
  restaurantName: string;
  locationSlug: string;
  latLng: [number, number];
  dealCount: number;
  lastVerified: string;
}

export interface ParkingPin {
  slug: string;
  name: string;
  latLng: [number, number];
  hourlyRate: number | null;
}

export default async function MapPage() {
  const caller = await createServerCaller();
  const [greenways, deals, parkingLots] = await Promise.all([
    caller.greenway.listWithGeometry(),
    caller.deal.list(),
    caller.parking.list(),
  ]);

  const toLocationSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const locMap = new Map<string, DealLocation>();
  for (const d of deals) {
    const key = d.restaurantLatLng.join(",");
    const existing = locMap.get(key);
    if (existing) {
      existing.dealCount++;
      if (d.lastVerified > existing.lastVerified)
        existing.lastVerified = d.lastVerified;
    } else {
      locMap.set(key, {
        restaurantName: d.restaurantName,
        locationSlug: toLocationSlug(d.restaurantName),
        latLng: d.restaurantLatLng,
        dealCount: 1,
        lastVerified: d.lastVerified,
      });
    }
  }
  const dealLocations = Array.from(locMap.values());

  const parkingPins: ParkingPin[] = parkingLots.map((p) => ({
    slug: p.slug,
    name: p.name,
    latLng: p.latLng as [number, number],
    hourlyRate: p.hourlyRate,
  }));

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
        dealLocations={dealLocations}
        parkingPins={parkingPins}
        mapTilerKey={env.NEXT_PUBLIC_MAPTILER_KEY}
      />
    </main>
  );
}
