# Meck GIS: Greenway Dataset

This document tracks source metadata for the Mecklenburg County greenways dataset.

## Source

| Field | Value |
|---|---|
| Source URL | https://opendata.charlottenc.gov/datasets/CharlotteNC::greenway-trails.geojson |
| Dataset name | Greenway Trails |
| Publisher | Mecklenburg County GIS / Charlotte Open Data |
| License | TBD — confirm on opendata.charlottenc.gov |
| Update frequency | TBD |

## Pre-flight Verification Status (Task 6.5)

**Attempted:** 2026-05-21
**Result:** UNREACHABLE

URLs attempted:
1. `https://opendata.charlottenc.gov/datasets/CharlotteNC::greenway-trails.geojson` — DNS resolution failure (`Could not resolve host`)
2. `https://opendata.arcgis.com/datasets/CharlotteNC::greenway-trails.geojson` — HTTP 500
3. `https://opendata.arcgis.com/api/v3/datasets/CharlotteNC::greenway-trails/downloads/data?format=geojson&spatialRefId=4326` — HTTP 403
4. `https://services.arcgis.com/62OhDRV1EbgAtFhX/arcgis/rest/services/Greenway_Trails/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson` — HTTP 400

**Fallback:** Source URL needs manual verification. The domain `opendata.charlottenc.gov` may be temporarily down or the dataset path has changed. Pivoted to OSM Overpass as greenway data source.

## OSM Overpass Status (A3, 2026-05-21)

OSM Overpass was attempted as the fallback source. All three mirrors failed from the build environment:

| Endpoint | Status |
|---|---|
| `https://overpass.kumi.systems/api/interpreter` | 429 Too Many Requests |
| `https://overpass-api.de/api/interpreter` | 406 Not Acceptable |
| `https://overpass.openstreetmap.ru/api/interpreter` | Connection timeout |

**Current state:** `data/greenways/` contains a manual seed of 5 known Charlotte greenways (approximate geometry). Re-seed when Overpass is accessible:

```bash
pnpm import-greenways
```

The importer (`scripts/import-greenways.ts`) queries Overpass for `highway=cycleway`, `highway=footway + bicycle=designated`, `route=hiking`, and `route=bicycle` ways/relations within Charlotte bbox (35.05,-81.05,35.45,-80.55).

**Action required:** Before running `scripts/import-greenways.ts`, manually confirm the working URL at https://opendata.charlottenc.gov/ by searching "Greenway Trails" and update this document with the confirmed URL, property field names, geometry types, and feature count.

## Schema

| Field name | Type | Description |
|---|---|---|
| TBD | TBD | TBD — populate after successful download (see pre-flight status above) |

Assumed field names (to be verified):
- `TRAIL_NAME` — trail name string
- `LENGTH_MI` — length in miles (float)
- `SURFACE` — surface type string (e.g. paved/natural/mixed)

If actual field names differ from above, update `transformMeckFeature` in `scripts/import-greenways.ts` accordingly.

## Geometry

| Property | Value |
|---|---|
| Geometry types observed | TBD — expected LineString and possibly MultiLineString |
| CRS | TBD — expected WGS84 / EPSG:4326 |
| Feature count | TBD |

## Notes

- Property field names, geometry types, and feature count will be populated after the first successful importer run (Task 6.5).
- Any field name mismatches between this doc and the live dataset should be treated as a breaking change requiring a data-schema update.
- The `GreenwayGeometry` Zod schema (in `packages/data-schema/src/greenway.ts`) already supports both `LineString` and `MultiLineString` per the eng review addendum Task 6 amendment.
