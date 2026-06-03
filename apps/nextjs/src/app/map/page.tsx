import type { Metadata } from "next";
import Link from "next/link";

import { CrownIcon } from "~/components/CrownIcon";
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

/** A generic point-of-interest pin for new GIS entity kinds. */
export interface GisPin {
  name: string;
  /** [lat, lng] — converted to [lng, lat] by the map component */
  latLng: [number, number];
}

export default async function MapPage() {
  const caller = await createServerCaller();
  const [
    greenways,
    deals,
    parkingLots,
    parks,
    recyclingFacilities,
    transitParkingLots,
    evStations,
    landfills,
    amenities,
  ] = await Promise.all([
    caller.greenway.listWithGeometry(),
    caller.deal.list(),
    caller.parking.list(),
    caller.park.list(),
    caller.recycling.list(),
    caller.transitParking.list(),
    caller.evCharging.list(),
    caller.landfill.list(),
    caller.amenity.list(),
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
    latLng: p.latLng,
    hourlyRate: p.hourlyRate,
  }));

  // New GIS kind pins. Each entity has `center: {lat, lng}` and `name`; the map
  // component converts [lat, lng] → [lng, lat] for MapLibre. Empty arrays still
  // register the layer + legend entry and degrade gracefully.
  const toPins = (
    rows: { name: string; center: { lat: number; lng: number } }[],
  ): GisPin[] =>
    rows.map((r) => ({ name: r.name, latLng: [r.center.lat, r.center.lng] }));

  const gisPins: Record<string, GisPin[]> = {
    park: toPins(parks),
    recycling: toPins(recyclingFacilities),
    "ev-charging": toPins(evStations),
    "transit-parking": toPins(transitParkingLots),
    landfill: toPins(landfills),
    amenity: toPins(amenities),
  };

  return (
    <main>
      <Link
        href="/today"
        aria-label="CLT — home"
        className="font-display fixed top-4 left-4 z-50 flex items-center gap-1.5 rounded-full bg-[color:var(--bg-cream)] px-3 py-1.5 text-sm font-bold tracking-wider text-[color:var(--brick)] uppercase shadow-md hover:bg-[color:var(--bg-cream-deep)]"
      >
        <CrownIcon size={18} />
        clt
      </Link>
      <MapLoader
        greenways={greenways}
        dealLocations={dealLocations}
        parkingPins={parkingPins}
        gisPins={gisPins}
        mapTilerKey={env.NEXT_PUBLIC_MAPTILER_KEY}
      />
    </main>
  );
}
