# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0.1] - 2026-05-29

### Fixed
- Map screen no longer overflows the viewport or shows a page scrollbar on desktop or mobile. The `/map` route now renders full-screen with no site header, footer, or bottom tab bar, so the map fills the whole window. The site header and footer (including the Privacy link) are unchanged on every other page.

## [0.2.0.0] - 2026-05-28

### Added
- New map layers: parks, recycling/solid-waste facilities, landfills, EV charging stations, light-rail park-and-ride lots, and park-derived amenities (tennis, pickleball, disc golf, skatepark, dog park, basketball) — each toggleable from the map legend on web and mobile
- `import-gis` data pipeline with source adapters for Mecklenburg County ArcGIS (ParkLocations, SolidWasteFacility, Landfills), Charlotte Open Data (CATS Park-and-Ride), and NREL EV charging stations
- Six new content types (park, recycling, transit-parking, ev-charging, landfill, amenity) wired into the community submission flow via the entity registry
- Map marker color tokens for the new layer kinds in the design system
- Operations runbook for the new GIS data sources (`docs/operations/gis-sources.md`)

### Changed
- Map data bundles are now derived automatically from the entity registry — adding a new content type no longer requires editing the bundle script

## [0.1.0.0] - 2026-05-23

### Added
- Greenway explorer: browse all 63 Mecklenburg County greenway trails with distance, surface type, trailheads, and GeoJSON geometry
- Interactive map with MapTiler basemap and greenway overlay lines, clickable popups linking to detail pages
- Daily restaurant deals page with day-of-week filter tabs (web + mobile)
- Parking lot directory with rates, hours, payment methods, and covered/uncovered status
- Community contribution flow: "Suggest an edit" on any entity opens a GitHub PR via the GitHub App bot
- Content moderation filter on community submissions
- Rate limiting via Upstash Redis (3 submissions per device per day)
- tRPC API layer with greenway, deal, and parking routers
- Local-disk data fallback when R2/CDN is unavailable (dev mode)
- Expo mobile app with tab navigation for greenways, deals, parking, and map
- MapTiler tile integration for both web (MapLibre GL JS) and mobile (MapLibre React Native)
- Real Mecklenburg County GIS data import pipeline with ArcGIS REST + Open Data support
- Data validation scripts ensuring all JSON files match Zod schemas
- CI/CD: PR validation workflow, data release to R2, weekly tile release
- EAS Build configuration for iOS/Android preview and production builds
- Haversine distance calculation for nearby-greenway sorting
- Map popup with XSS-safe HTML rendering
- Greenway detail page with map snippet and computed bounds

### Changed
- Tile source migrated from self-hosted Protomaps/R2 PMTiles to MapTiler vector tiles

### Removed
- Unused auth and db packages from create-t3-turbo template
- better-auth scaffolding from mobile app
