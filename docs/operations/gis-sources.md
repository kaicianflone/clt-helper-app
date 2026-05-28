# GIS Data Sources

Source metadata for the additional GIS datasets consumed by the importer in `scripts/import-gis.ts`.

For the original greenway dataset (Meck County GIS trails) see `docs/operations/meck-gis.md`.

## Base URL

All Mecklenburg County ArcGIS REST endpoints share the same host:

```
https://meckgis.mecklenburgcountync.gov/server/rest/services
```

## Coordinate System Contract

**Always pass `outSR=4326` on every ArcGIS query.**

The ArcGIS REST API defaults to returning geometries in the layer's native CRS, which for Mecklenburg services is **NC State Plane (feet)** — a projected coordinate system whose `x`/`y` values look like `1,500,000 / 500,000`. These are NOT longitude/latitude. Consuming the raw `attributes.x` / `attributes.y` fields (or any ArcGIS `geometry` object without forcing the output CRS) will produce features placed in the South Atlantic Ocean.

The `geometry` object returned when `outSR=4326` is set contains decimal-degree coordinates:

```json
{
  "geometry": { "x": -80.8431, "y": 35.2271 }
}
```

Always read from `feature.geometry`, never from `feature.attributes.x` / `.y`.

## Sources (verified 2026-05-28)

### Mecklenburg County Parks (`ParkLocations/FeatureServer/0`)

| Field | Value |
|---|---|
| Endpoint | `https://meckgis.mecklenburgcountync.gov/server/rest/services/ParkLocations/FeatureServer/0/query` |
| Publisher | Mecklenburg County GIS |
| License | Charlotte Open Data Portal (verify per dataset, generally permissive for derivative work) |
| Geometry | Point (`x`/`y` in WGS84 when `outSR=4326`) |
| Update frequency | Not contractually defined; refresh on-demand via the importer |

**Amenity flags** — each record carries boolean attributes (returned as `0`/`1` integers or `"Yes"`/`"No"` strings depending on the layer version). The importer treats any truthy value as present:

| Attribute | Derived amenity type |
|---|---|
| `tennis` | Tennis courts |
| `pickleball` | Pickleball courts |
| `disc_golf` | Disc golf course |
| `skatepark` | Skate park |
| `dog_park` | Dog park |
| `basketball` | Basketball courts |

Additional numeric/text attributes used by the importer:

| Attribute | Type | Description |
|---|---|---|
| `numparking` | integer | Number of parking spaces at the park |
| `parkurl` | string | URL to the park's official page (may be empty) |

**Derivation pattern — one fetch, multiple output records:**

The importer makes a single query for all ParkLocations features and emits:

1. One **park** record per feature (name, location, parking count, URL).
2. One **amenity point** per truthy amenity flag on that feature, co-located at the park's coordinate, with `amenityType` set to the corresponding type from the table above.

This means a park with `tennis=1`, `dog_park=1` produces the park record plus two amenity points — all from a single ArcGIS feature.

### Solid Waste / Recycling (`SolidWasteFacility/FeatureServer/0`)

| Field | Value |
|---|---|
| Endpoint | `https://meckgis.mecklenburgcountync.gov/server/rest/services/SolidWasteFacility/FeatureServer/0/query` |
| Publisher | Mecklenburg County GIS |
| License | Charlotte Open Data Portal |
| Geometry | Point (`x`/`y` in WGS84 when `outSR=4326`) |

Provides locations of convenience centers and drop-off recycling facilities in Mecklenburg County.

### Landfills (`Landfills/FeatureServer/0`)

| Field | Value |
|---|---|
| Endpoint | `https://meckgis.mecklenburgcountync.gov/server/rest/services/Landfills/FeatureServer/0/query` |
| Publisher | Mecklenburg County GIS |
| License | Charlotte Open Data Portal |
| Geometry | Point or Polygon (`outSR=4326` required) |

Active and closed landfill locations within Mecklenburg County.

### Charlotte Open Data — CATS Park-and-Ride

| Field | Value |
|---|---|
| Source | Charlotte Open Data Portal |
| Publisher | Charlotte Area Transit System (CATS) |
| License | Charlotte Open Data Portal (permissive) |
| Geometry | Point (WGS84) |

Park-and-ride lots operated by CATS for transit access. These are transit-oriented parking facilities and are kept separate from general parking lots in `data/parking/`.

### NREL Alternative Fuel Stations (EV Charging)

| Field | Value |
|---|---|
| Endpoint | `https://developer.nrel.gov/api/alt-fuel-stations/v1.geojson` |
| Publisher | National Renewable Energy Laboratory (NREL), U.S. Department of Energy |
| License | Government open data; see https://developer.nrel.gov/docs/transportation/alt-fuel-stations-v1/ |
| Geometry | GeoJSON Point (WGS84, no CRS conversion needed) |
| Filter used | `fuel_type=ELEC&state=NC` |

**API key handling:**

NREL requires an API key passed as the `api_key` query parameter.

- **Development:** `DEMO_KEY` works without signup and is sufficient for local development and ad-hoc imports. It is rate-limited to 30 requests/hour and 50 requests/day per IP.
- **Production / CI:** A personal key with higher rate limits (1,000 requests/hour) is required. Sign up at https://developer.nrel.gov/signup — registration is free, approval is instant, and the key is emailed within minutes.

Store the production key as `NREL_API_KEY` in the environment (see `docs/operations/secrets.md`). When `NREL_API_KEY` is unset the importer falls back to `DEMO_KEY` automatically, logging a warning.

Example request (DEMO_KEY):

```bash
curl "https://developer.nrel.gov/api/alt-fuel-stations/v1.geojson?api_key=DEMO_KEY&fuel_type=ELEC&state=NC"
```

## Importer Usage

```bash
# Import all GIS sources
pnpm import-gis

# Import a single source
pnpm import-gis --source=parks
pnpm import-gis --source=recycling
pnpm import-gis --source=landfills
pnpm import-gis --source=cats-park-and-ride
pnpm import-gis --source=ev-charging

# Dry run — print what would be written without touching data/
pnpm import-gis --dry-run
```

The script writes JSON files to the appropriate `data/` subdirectory (e.g. `data/parking/` for park-and-ride, `data/amenities/` for park amenity points) and updates the corresponding `_index.json` listing. Re-running overwrites existing files for the same source.

After importing, validate and rebuild bundles:

```bash
pnpm validate:data   # verify all data/ files against Zod schemas
pnpm build:data      # rebuild versioned data bundles in public/data/v1/
```

## Known Gotchas

- **State Plane coordinates:** If imported features appear in the ocean, `outSR=4326` was not passed or was overridden. Always verify `geometry.x` is in the range `-82` to `-80` for Charlotte-area data.
- **ParkLocations amenity flag formats:** The boolean attributes have been observed as both integer `0`/`1` and string `"Yes"`/`"No"` across different ArcGIS versions. The importer normalizes both; do not assume one format.
- **NREL DEMO_KEY rate limiting:** If the import fails with HTTP 429, you have exhausted DEMO_KEY's hourly quota. Wait an hour or set `NREL_API_KEY` to a personal production key.
- **CATS Park-and-Ride data freshness:** The Charlotte Open Data Portal does not expose a reliable `Last-Modified` header for this dataset. Treat all imports as full refreshes.
