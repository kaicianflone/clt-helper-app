# Map Tiles

Charlotte map basemap tiles are served by [MapTiler](https://www.maptiler.com/), via their hosted vector tile API. Both the Next.js web app and the Expo mobile app load tiles from the same `streets-v2` style.

## Setup (one-time, per developer)

1. Sign up for a free MapTiler account at https://cloud.maptiler.com/account/keys/ (no credit card required, free tier is 100,000 tile loads/month).
2. Create an API key. For production, restrict it to your domains via the MapTiler dashboard ("Allowed origins").
3. Add the key to your environment files:
   - `apps/nextjs/.env.example` and your local `apps/nextjs/.env`: set `NEXT_PUBLIC_MAPTILER_KEY=<your key>` (and optionally `MAPTILER_KEY=<your key>` server-side).
   - `apps/expo/.env`: set `EXPO_PUBLIC_MAPTILER_KEY=<your key>`.
4. Run `pnpm --filter @clt/nextjs dev` and visit `/map` — you should see a vector basemap with greenway lines drawn on top.

## How it works

The Next.js map component (`apps/nextjs/src/app/map/_components/map.tsx`) builds the style URL inline:

```
https://api.maptiler.com/maps/streets-v2/style.json?key=${NEXT_PUBLIC_MAPTILER_KEY}
```

MapLibre GL fetches that JSON, then loads vector tile chunks (PBF format) from MapTiler's CDN. The greenway overlay is drawn as a GeoJSON layer on top, sourced from the tRPC `greenway.listWithGeometry` query.

On tile fetch errors (e.g. MapTiler is down, key revoked), `map.on("error")` flips the page to a plain-background fallback so greenways are still visible.

## Health check

`GET /api/tiles/health` returns:

```json
{
  "source": "maptiler",
  "keyConfigured": true,
  "error": null
}
```

`error: "no_key"` means `NEXT_PUBLIC_MAPTILER_KEY` is empty. Useful as an uptime probe — does not expose the key value.

## Deferred to v2 — self-hosted PMTiles via Cloudflare R2

The repository still contains the original tile pipeline (`scripts/build-tiles.sh`, `.github/workflows/release-tiles.yml`) that builds a Charlotte-clipped PMTiles archive from OpenStreetMap and uploads it to Cloudflare R2. We are not running this pipeline in v1 — MapTiler's free tier is cheaper, faster to set up, and adequate for pre-launch traffic.

If MapTiler bandwidth or cost ever becomes a problem (telemetry showing >50k tile loads/day, or the free tier ceiling getting hit), the steps to revive the R2 path are:

1. Create the R2 bucket (`clt-app-prod`) and a public custom domain.
2. Add `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` to GitHub repository secrets.
3. `gh workflow run release-tiles.yml` to build + upload the first PMTiles archive.
4. Swap the map component back to fetching from `${R2_PUBLIC_BASE_URL}/tiles/manifest.json` (see git history for the pre-MapTiler implementation).

Required tooling for local PMTiles builds: `osmium-tool`, `tippecanoe`, `pmtiles`.
