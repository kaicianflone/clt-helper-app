# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0.0] - 2026-06-03

### Added
- New marketing landing page at `/` — a single-page front door for the app covering the three domains (greenways, deals, parking), the community-maintained-data story, and "coming soon" iOS and Android store badges. Built in the Queen City craft design system with a restrained, reduced-motion-aware animation pass (scroll reveals degrade to visible content when JavaScript is unavailable).

### Changed
- The "Today in Charlotte" app home moved from `/` to `/today`. All in-app home links (site header, mobile tab bar, map, and onboarding redirects) now point to `/today`; the marketing page owns `/`. The sitemap lists both routes.

## [0.2.1.0] - 2026-05-29

### Added
- Greenways list now has sort and filter controls. Sort by Nearest (uses your location when granted), Name (A–Z or Z–A), or trail length (Longest or Shortest first). Filter by surface (paved, natural, mixed) and by length (under 1 mi, 1–3 mi, over 3 mi). A live count shows how many trails match, with a clear empty state when none do.
- The crown logo now shows next to a "CLT" wordmark in the top-left of the full-screen `/map` page, matching the site header instead of a plain "clt" pill.

### Changed
- "Trailheads" is now "Points of Interest" on greenway detail pages (web and mobile) and in the map trail popups. A trailhead can be an entrance, a bench, or any access point, so the broader label fits. The detail page's separate trailhead and points-of-interest lists are now one combined section.

## [0.2.0.3] - 2026-05-29

### Fixed
- Greenway trail lines no longer look jagged when the map is zoomed out. MapLibre was simplifying the trail geometry per map tile (its default behavior), which dropped points and flattened curves at low zoom — they only looked smooth once you zoomed in. Trails now keep their full shape at every zoom level, with rounded line joins and ends for a cleaner look. Applies to both the main `/map` and the individual trail detail maps.

## [0.2.0.2] - 2026-05-29

### Fixed
- The bottom tab bar is back on the `/map` page for mobile. v0.2.0.1 made `/map` full-screen by hiding all site chrome, which also removed the only navigation available on mobile — leaving no way to leave the map. Mobile now keeps the tab bar (with the map sized to sit above it); desktop stays full-screen as before.

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
