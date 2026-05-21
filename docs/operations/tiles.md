# Tile Pipeline

## Overview

Charlotte map tiles are built from OpenStreetMap data via a three-stage pipeline:

1. Download NC OSM extract from Geofabrik
2. Clip to Charlotte bounding box with `osmium`
3. Build vector tiles with `tippecanoe`, convert to PMTiles format with `pmtiles`

The final `.pmtiles` file is uploaded to Cloudflare R2 with an immutable cache header and a short-lived manifest pointing at the current file.

## Required Tools

| Tool | Install | Purpose |
|---|---|---|
| `osmium` | `apt-get install osmium-tool` or `brew install osmium-tool` | Clip OSM extract to bbox |
| `tippecanoe` | See [felt/tippecanoe releases](https://github.com/felt/tippecanoe/releases) | Build vector MBTiles |
| `pmtiles` | See [go-pmtiles releases](https://github.com/protomaps/go-pmtiles/releases) | Convert MBTiles to PMTiles |
| `wrangler` | `npx wrangler` (no install needed) | Upload to Cloudflare R2 |

## Build Instructions

### Local build

```bash
# Optional: override bbox or output directory
export CLT_BBOX="-81.05,35.05,-80.55,35.45"
export OUT_DIR="tiles"

./scripts/build-tiles.sh
```

Output: `tiles/charlotte-latest.pmtiles`

### CI build

The `release-tiles` workflow (`.github/workflows/release-tiles.yml`) runs automatically every Monday at 06:00 UTC and can also be triggered manually via `workflow_dispatch`.

## Bounding Box

The default bbox `-81.05,35.05,-80.55,35.45` covers the Charlotte metro area (Mecklenburg County plus a small buffer). Format is `west,south,east,north` in WGS84 decimal degrees.

To adjust the bbox for a wider or narrower area, set `CLT_BBOX` before running the script or update the default in `scripts/build-tiles.sh`.

## Versioning

Tiles are versioned by content hash. The upload step computes a 12-character SHA-256 prefix of the `.pmtiles` file and uploads to:

```
R2_BUCKET/tiles/charlotte-<SHA>.pmtiles   # immutable, max-age=31536000
R2_BUCKET/tiles/manifest.json             # short-lived, max-age=60
```

The manifest contains:

```json
{
  "current": "tiles/charlotte-<SHA>.pmtiles",
  "builtAt": "2026-05-21T06:00:00Z"
}
```

The app reads `manifest.json` at startup to resolve the current tile URL. Old versions remain in R2 until manually pruned.

## Rollback

To roll back to a previous tile version, update `manifest.json` to point at the previous hash. See `docs/operations/rollback.md` for the full procedure.
