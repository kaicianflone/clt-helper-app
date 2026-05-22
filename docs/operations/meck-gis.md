# Meck GIS: Greenway Dataset

Source metadata for the Mecklenburg County greenways dataset consumed by the importer in `scripts/import-greenways.ts`.

## Sources (verified 2026-05-21)

| Field | Value |
|---|---|
| Primary (REST, paged) | `https://meckgis.mecklenburgcountync.gov/server/rest/services/GreenwayTrails/FeatureServer/0/query` |
| Fallback (item-ID download) | `https://data.charlottenc.gov/api/download/v1/items/9a147a92a6694158bbc162aa879ca7a3/geojson?layers=0` |
| Publisher | Mecklenburg County GIS / Charlotte Open Data |
| License | Charlotte Open Data Portal (verify per dataset, generally permissive for derivative work) |
| Update frequency | Not contractually defined; refresh on-demand via the importer |

The REST endpoint is the primary source because its URL is keyed on the service name (`GreenwayTrails`), which is stable. The Charlotte Open Data download URL uses an item ID (`9a147a92...`) which changes when the dataset is republished, so it serves as a fallback only.

## Importer usage

```bash
# REST endpoint (default)
pnpm import-greenways --source=meck-rest

# Open-data item-ID GeoJSON download
pnpm import-greenways --source=meck-opendata

# Legacy Overpass code path (non-Meck regions / hand-crafted fixtures)
pnpm import-greenways --source=overpass

# From a local GeoJSON file
pnpm import-greenways path/to/file.geojson
```

The script writes one JSON per greenway to `data/greenways/<slug>.json` plus an `_index.json` listing all entries. Re-running wipes the directory before writing.

## Schema (lowercase, verified live)

| Field name | Type | Description |
|---|---|---|
| `objectid` | integer | ArcGIS feature ID (per-segment, not per-trail) |
| `trail_name` | string | Trail name; not normalized — importer trims + collapses whitespace |
| `trail_surf` | string | Free-text surface label (e.g. "Asphalt") |
| `surfgen` | string | Canonical surface class: `Paved` / `Natural` / `Unpaved` |
| `miles` | float | Length of this segment in miles |
| `length` | float | Length in feet (unused by importer) |
| `trl_status` | string | `Active` / `Planned` / `Removed` — importer filters to `Active` |
| `memo` | string | Free-text segment description |
| `completion` | ISO 8601 | Date the segment opened |
| `descripton` | string | `Trail` or `Entrance` (the field name is misspelled at source) |
| `z_min`, `z_max`, `z_mean` | float | Elevation stats (unused) |
| `slength` | float | Surface length (3D) |
| `avg_slope` | float | Average slope, ratio (unused) |
| `ada_comp` | string | ADA compliance flag |

## Geometry

| Property | Value |
|---|---|
| Geometry types observed | `LineString` (per segment) |
| CRS | WGS84 / EPSG:4326 (REST endpoint returns `outSR=4326`) |
| Feature count | ~2,783 segments → 63 unique active trails (~145.7 total miles) |

## Importer behavior

- Filters server-side (REST) or client-side (Open Data) to `trl_status === 'Active'`.
- Groups segments by normalized `trail_name` (trim + collapse-whitespace) and emits one Greenway per name with `geometry.type = "MultiLineString"`. Each segment is preserved as its own coordinate array — **we do not concatenate**, which would (a) inflate `computeLengthMiles` and (b) cause MapLibre to draw visual joins between disconnected trail ends.
- Drops duplicate vertices at segment boundaries (skipped when the earlier segment is 2 coords; slicing would leave a 1-coord LineString, which fails the schema's min(2) constraint).
- Rejects per-segment coordinates outside the Mecklenburg bbox (`-81.5 < lng < -80 && 34.9 < lat < 35.6`) and segments with > 10,000 vertices.
- Picks the geographically northernmost segment's start coord as the single trailhead (placeholder until a real POI dataset is integrated).
- Length per trail = sum of per-segment `miles` (haversine fallback when `miles` is missing).

## Known gotchas

- Charlotte Open Data has been observed returning HTTP 200 with a JSON error body (no `features` array). The importer asserts `features.length > 10` and exits non-zero on failure.
- The REST endpoint paginates at 2,000 records per response. The importer loops until it gets a short page.
