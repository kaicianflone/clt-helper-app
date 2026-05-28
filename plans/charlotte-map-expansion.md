# Plan: Charlotte map expansion — new GIS layers + photo uploads + add-deal

Aggregated by /autoplan on 2026-05-28 (via /consensus-autopilot).
Source design doc: `~/.gstack/projects/kaicianflone-clt-helper-app/kaicianflone-main-design-20260528-140628.md`
Reviews: ENG CLEARED (plan-eng-review), DESIGN CLEARED (plan-design-review).
Approach: **A** — few flexible `ENTITY_REGISTRY` kinds + one shared `import-gis.ts` pipeline with source adapters, phased by data-source confidence.

## Pre-implementation blockers — RESOLVED 2026-05-28

All three cleared during the continuation run. Confirmed against live endpoints:

1. ✅ **Meck FeatureServer layer IDs confirmed** on `meckgis.mecklenburgcountync.gov/server/rest/services/`
   (same host as GreenwayTrails, NOT `data.mecknc.gov`). All point geometry, layer `0`:
   - Parks: `ParkLocations/FeatureServer/0` (point) + optional boundary `ParkBoundaries/FeatureServer/0` (polygon)
   - Recycling/solid-waste: `SolidWasteFacility/FeatureServer/0` (fields: `facility`, `faclty_typ`, `staff_typ`)
   - Landfills: `Landfills/FeatureServer/0` (fields: `name`, `status_1`, `code`, `landfill`)
   - **Query contract:** pass `outSR=4326` and read the `geometry` object (lng/lat). The raw
     `x`/`y` attributes are State Plane feet — do NOT use them.
   - **Bonus (changes scope — see below):** `ParkLocations` carries boolean amenity flags
     (`tennis`, `pickleball`, `discgolf`, `skatepark`, `dogpark`, `basketball`, `golf`, …),
     `numparking`, `parkurl`, and a `picture` attachment URL. Official Meck feeds also exist for
     disc golf (`DiscGolfCourse{Baskets,Fairways,Tees}`), `GolfCourses`, and light-rail stations
     (`CATSLynx{Blue,Gold,Red,Silver}LineStations`). Several "OSM-only" candidate layers can be
     derived from official Meck data instead.
2. ✅ **NREL endpoint verified live** (DEMO_KEY, 2026-05-28): 2,063 NC EV stations.
   Canonical domain is **`developer.nrel.gov`** (HTTP 200, no redirect) — the earlier
   `developer.nlr.gov` "migration" note was WRONG; corrected throughout this plan.
   Endpoint: `https://developer.nrel.gov/api/alt-fuel-stations/v1.geojson?api_key=KEY&fuel_type=ELEC&state=NC`
   `DEMO_KEY` unblocks all development now (rate-limited). A personal production key still
   requires user signup at `developer.nrel.gov/signup` → add to `.env.example` + `docs/operations/secrets.md`. (T6)
3. ✅ **Map marker tokens signed off + added to DESIGN.md** `/* Map */` block:
   `--map-park-marker #3a7a4f`, `--map-recycling #2e7d80`, `--map-ev-charging #2f5fa0`,
   `--map-transit-parking #5b4b9c`, `--map-amenity #9c6b3f`. (D1 partially done — token defs landed;
   icon/legend wiring still in T8/D2/D4.)

## Execution waves

```
Wave 1 (schema foundation — sequential within, all in packages/data-schema)
  T1  Extract shared PhotoSchema + point-entity base from GreenwaySchema
  T2  Add ParkSchema (center + optional boundary), Recycling/TransitParking/EvCharging/Amenity{category}
  T3  Register all kinds in ENTITY_REGISTRY
        │
Wave 2 (pipeline + data + tokens — parallel lanes after Wave 1)
  Lane A (scripts):   T4 derive bundle categories from registry → T5 import-gis.ts adapters → T6 NREL adapter
  Lane B (data):      T7 data/ dirs + _index.json + data-client wiring   (needs T3)
  Lane C (design):    D1 map marker tokens   (independent, needs DESIGN.md sign-off)
        │
Wave 3 (map UI — after Wave 2; web + mobile parity)
  T8  per-kind map layers (MapLibre GL JS + RN)
  D2  legend/key panel: swatch+icon+toggle per kind (reuse collapse-on-tap pattern)
        │
Tests (alongside each wave)
  T9  import-gis.test.ts: pagination, dedup, coordinate-order, empty/short-response per adapter
  T10 docs/operations runbook for new GIS sources

Phase 2 (separate run — needs blob-store decision)
  D3  photo-upload UI (4 states, shared vs platform-split, swipe-dismiss) + EXIF/PII strip in content-filter
  amenity importer via Overpass (disc golf, tennis, pickleball, skatepark, farmers markets, landfills, POI)
  Add-deal button on deals screen → existing submit flow (kind=deal)
```

## Parallelization (for /parallel-orchestrate)

| Lane | Tasks | Modules | Depends on |
|---|---|---|---|
| A | T4, T5, T6, T9 | scripts/ | T3 (registry) |
| B | T7 | data/, packages/api (data-client) | T3 |
| C | D1, D4 | DESIGN.md, packages/ui | — (design sign-off) |
| (merge) | T8, D2 | apps/nextjs, apps/expo | A+B+C |

Launch A + B + C in parallel worktrees after Wave 1 lands. Merge, then T8/D2 (shared map UI) sequentially. T8 and D2 both touch apps/* — same lane, coordinate.

## Source map (REVISED 2026-05-28 — official Meck feeds replace OSM where available)

The original plan routed courts/disc-golf/skatepark/landfill through OSM/Overpass. Live
inspection of `meckgis.mecklenburgcountync.gov` found authoritative county feeds. Revised
source-of-truth per kind:

| Map kind | Source (revised) | How |
|---|---|---|
| park | `ParkLocations/0` (+ optional `ParkBoundaries/0`) | meck-arcgis adapter |
| recycling | `SolidWasteFacility/0` filtered on `faclty_typ` | meck-arcgis |
| landfill | `Landfills/0` (official — was OSM) | meck-arcgis; surface `status_1` (many Closed) |
| ev-charging | NREL `developer.nrel.gov` (DEMO_KEY → prod key) | nrel |
| transit-parking | Charlotte OD CATS Park-and-Ride lots | charlotte-od |
| amenity: tennis / pickleball / disc-golf / skatepark / dog-park / basketball | **DERIVED from `ParkLocations` boolean flags** (was Overpass) | one ParkLocations fetch → fan out a point per truthy flag |
| amenity: farmers-market | OSM/Overpass (no Meck feed found) | overpass — stays Phase 2 |
| disc-golf (course geometry, optional) | `DiscGolfCourse{Tees,Baskets,Fairways}` | meck-arcgis — Phase 2 enhancement over the derived flag |

**Net effect:** the Overpass adapter is no longer on the Wave-2 critical path. Courts/disc-golf/
skatepark/dog-park ship from the same `ParkLocations` fetch that powers `park` — one source, many
derived amenity points. Overpass is deferred to Phase 2 (farmers markets + any non-park POI).

## Task detail

### Wave 1 — schema (P1)
- **T1** packages/data-schema — extract shared `PhotoSchema` + point-entity base from `GreenwaySchema.photos`. Verify: existing greenway tests still pass.
- **T2** packages/data-schema — `ParkSchema` (required `center: LatLng` + optional `boundary: Polygon|MultiPolygon`; carry through `numparking`, `parkurl`, and the amenity flags), `RecyclingSchema`, `TransitParkingSchema`, `EvChargingSchema`, `LandfillSchema` (incl. `status`), `AmenitySchema{ category: enum }` where the category enum covers the ParkLocations-derived set (tennis, pickleball, disc-golf, skatepark, dog-park, basketball) plus farmers-market. Verify: schema unit tests.
- **T3** packages/data-schema/src/registry.ts — register all new kinds (kind, schema, patchSchema, dataPath, displayLabel, branchPrefix). Verify: ENTITY_REGISTRY snapshot test; generic submit flow picks them up.

### Wave 2 — pipeline + data + tokens (P1)
- **T4** scripts/build-data-bundles.ts — derive `categories` from `ENTITY_REGISTRY` (fixes the 2-spot hardcoded drift; validate-data.ts already does this). Verify: bundle build includes new kinds with no manual list edit.
- **T5** scripts/import-gis.ts — shared pipeline + adapters (meck-arcgis, charlotte-od, nrel; overpass deferred to Phase 2); preserve `resultOffset` paging + objectid dedup + MIN_EXPECTED_FEATURES from import-greenways. meck-arcgis adapter MUST request `outSR=4326` and read the `geometry` object (not the State-Plane `x`/`y` attributes). Add a ParkLocations→amenity derivation step: one fetch yields `park` records plus a fanned-out `amenity` point per truthy flag. Verify: T9.
- **T6** scripts/import-gis.ts + env/secrets — NREL adapter (`?fuel_type=ELEC&state=NC`, api_key from env, build-time only). Verify: integration fetch returns NC EV stations.
- **T7** data/{parks,recycling,transit-parking,ev-charging}/ + `_index.json`; wire data-client. Verify: `pnpm validate:data` + `pnpm build:data` pass.
- **D1** DESIGN.md + token files — new map marker tokens. Verify: design sign-off; tokens referenced by map layers.
- **T9 (P2)** scripts/import-gis.test.ts — per-adapter pagination/dedup/coordinate-order/empty-guard. **Regression-critical** for the ArcGIS pagination contract.
- **T10 (P2)** docs/operations — runbook mirroring import-greenways; confirm Meck layer IDs.

### Wave 3 — map UI (P1)
- **T8** apps/nextjs + apps/expo — per-kind layer + key swatch/icon + toggle; web (GL JS) + mobile (RN) parity. Verify: layers render + toggle on both; `/qa`.
- **D2** legend/key panel — collapsible per-kind toggle list. Verify: parity + DESIGN.md token usage.
- **D4 (P3, follow-up)** packages/ui + apps/nextjs/public — on-brand monochrome marker icons per kind (signage-grotesque feel). Non-blocking: T8/D2 ship first with the D1 color swatches as placeholder markers; D4 swaps in custom icons after. Verify: icons render on both platforms, fall back to swatch if missing.

### Phase 2 (deferred — own run)
- **D3** photo-upload UI: loading/empty/error/partial states, shared-vs-split component, mobile swipe-dismiss; content-filter EXIF-GPS strip + PII; rate-limiter on uploads; trusted-device gate. Needs blob-store decision (R2 recommended). Note: `ParkLocations.picture` already exposes a county attachment URL — a read-only park photo can ship before user uploads.
- Overpass `amenity` importer — now scoped to **farmers-markets + non-park POI only** (courts/disc-golf/skatepark moved to Wave 2 via ParkLocations flags). + "Add deal" button.
- `DiscGolfCourse{Tees,Baskets,Fairways}` geometry enhancement over the derived disc-golf flag.

## NOT in scope (this plan)
- Photo blob store provider wiring (Phase 2; provider TBD).
- Park boundary rendering (optional field now).
- Farmers-market feed (OSM, Phase 2 — no Meck feed found).
- Disc-golf course-geometry layer (Phase 2; Wave 2 ships the derived point flag).

## Failure modes flagged
- ArcGIS pagination contract drift → silent short response. Guard: MIN_EXPECTED_FEATURES + T9. Critical.
- NREL api_key missing/invalid → build fails loudly (env validation), not silent.
