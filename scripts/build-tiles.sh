#!/usr/bin/env bash
set -euo pipefail

CLT_BBOX="${CLT_BBOX:--81.05,35.05,-80.55,35.45}"
OUT_DIR="${OUT_DIR:-tiles}"
mkdir -p "$OUT_DIR"

NC_PBF="/tmp/north-carolina-latest.osm.pbf"
CLIPPED="/tmp/charlotte.osm.pbf"

echo "-> Downloading NC OSM extract..."
curl -fsSL -o "$NC_PBF" \
  "https://download.geofabrik.de/north-america/us/north-carolina-latest.osm.pbf"

echo "-> Clipping to Charlotte bbox: $CLT_BBOX"
osmium extract --bbox="$CLT_BBOX" --output="$CLIPPED" --overwrite "$NC_PBF"

echo "-> Building MBTiles..."
tippecanoe \
  --output="$OUT_DIR/charlotte.mbtiles" \
  --force \
  --layer=osm \
  --maximum-zoom=13 \
  --minimum-zoom=8 \
  --drop-densest-as-needed \
  "$CLIPPED"

echo "-> Converting to pmtiles..."
pmtiles convert "$OUT_DIR/charlotte.mbtiles" "$OUT_DIR/charlotte-latest.pmtiles"

ls -lh "$OUT_DIR/charlotte-latest.pmtiles"
echo "Done."
