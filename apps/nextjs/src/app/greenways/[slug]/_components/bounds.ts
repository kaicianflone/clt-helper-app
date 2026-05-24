// Returns [[minLng, minLat], [maxLng, maxLat]] from a MultiLineString.
// Matches maplibre's LngLatBoundsLike tuple-of-tuples form so callers can pass
// the result directly into `new maplibregl.Map({ bounds })`.
export function computeBounds(
  geometry: GeoJSON.MultiLineString
): [[number, number], [number, number]] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const segment of geometry.coordinates) {
    for (const point of segment) {
      const lng = point[0];
      const lat = point[1];
      if (lng === undefined || lat === undefined) continue;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
