# CLAUDE.md

This file provides context for AI assistants working on this codebase.

## Project overview

clt-app is an open-source iOS, Android, and web app for Charlotte, NC. It covers three domains: greenway trails, daily restaurant deals, and parking lots. All data lives as JSON files in `data/` -- there is no database. Community contributions open GitHub PRs via a GitHub App bot.

## Monorepo layout

- **apps/nextjs/** -- Next.js 15 web app, deployed to Vercel
- **apps/expo/** -- Expo (React Native) mobile app, built with EAS
- **packages/api/** -- tRPC 11 routers (greenway, deal, parking, submit) + server utilities (GitHub bot, content filter, rate limiter, diff renderer)
- **packages/data-schema/** -- Zod 4 schemas for all entities + `ENTITY_REGISTRY` for generic submit flow + `haversineMiles` distance helper
- **packages/ui/** -- Shared UI components (shadcn/ui base)
- **data/greenways/** -- 63 trail JSON files + `_index.json` (from Meck County GIS)
- **data/deals/** -- Restaurant deal JSON files
- **data/parking/** -- Parking lot JSON files
- **scripts/** -- Data pipeline: `import-greenways.ts`, `validate-data.ts`, `build-data-bundles.ts`
- **tooling/** -- Shared ESLint, Prettier, Tailwind, TypeScript configs
- **docs/operations/** -- Runbooks for tiles, secrets, rollback, GitHub App setup, Meck GIS

## Tech stack

- Node 22 (see `.nvmrc`), pnpm 10
- TypeScript strict everywhere
- Turborepo for task orchestration
- tRPC 11 for API, Zod 4 for validation
- MapLibre GL JS (web) + MapLibre React Native (mobile) with MapTiler vector tiles
- Upstash Redis for rate limiting (3 submissions/device/day)
- No database, no auth system -- repo-as-database pattern

## Key patterns

- **Namespace:** `@clt/*` (e.g., `@clt/nextjs`, `@clt/api`, `@clt/data-schema`)
- **Entity registry:** `packages/data-schema/src/registry.ts` -- maps entity types to schemas/directories for the generic submit flow
- **Data client:** `packages/api/src/data-client.ts` -- fetches JSON bundles from CDN or local disk (`public/data/v1/` fallback when `DATA_BASE_URL` is unset)
- **Content filter:** `packages/api/src/server/content-filter.ts` -- blocks profanity + PII in submissions
- **GitHub bot:** `packages/api/src/server/github-bot.ts` -- opens PRs with diff markdown, auto-merges verify-only changes

## Commands

```bash
pnpm install                        # install dependencies
pnpm --filter @clt/nextjs dev       # web dev server at localhost:3000
pnpm --filter @clt/expo dev         # mobile dev (requires dev client)
pnpm typecheck                      # TypeScript check all packages
pnpm lint                           # ESLint all packages
pnpm test                           # Vitest all packages
pnpm import-greenways --source=meck-rest  # import greenways from Meck GIS
pnpm validate:data                  # validate data/ against Zod schemas
pnpm build:data                     # build versioned data bundles
```

## Test setup

- Vitest 3.2 with root config at `vitest.config.ts`
- Test files: `**/*.test.ts` in `packages/`, `apps/nextjs/`, `apps/expo/`, `scripts/`
- Path aliases: `@clt/data-schema` and `~/` (nextjs src) resolved in vitest config

## Environment variables

- See `apps/nextjs/.env.example` for web env vars
- See `apps/expo/.env.example` for mobile env vars
- See `docs/operations/secrets.md` for the full secret reference
- No database connection string needed -- all data is in `data/`

## Design system

See `DESIGN.md` for the "Queen City craft" design system: cream/brick palette, Antonio display font, Inter body font, 8px spacing grid.
