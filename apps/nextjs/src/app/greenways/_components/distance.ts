export interface GreenwayLike {
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
}

const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Items without coords land at the end, sorted A-Z. Items with coords sort by
// distance ascending. Used by the greenways list when geolocation is granted.
export function sortByDistance<T extends GreenwayLike>(
  items: T[],
  origin: { lat: number; lng: number },
): (T & { distanceMi: number | null })[] {
  return items
    .map((g) => ({
      ...g,
      distanceMi:
        g.lat != null && g.lng != null
          ? haversineMiles(origin.lat, origin.lng, g.lat, g.lng)
          : null,
    }))
    .sort((a, b) => {
      if (a.distanceMi == null && b.distanceMi == null)
        return a.name.localeCompare(b.name);
      if (a.distanceMi == null) return 1;
      if (b.distanceMi == null) return -1;
      return a.distanceMi - b.distanceMi;
    });
}

export function sortAlphabetical<T extends GreenwayLike>(
  items: T[],
): (T & { distanceMi: null })[] {
  return [...items]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((g) => ({ ...g, distanceMi: null }));
}
