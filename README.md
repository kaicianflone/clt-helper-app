# clt-app

An open-source iOS, Android, and web app for Charlotte, NC.

Three things it does:
1. **Greenways** — every Charlotte-area greenway trail with maps, length, surface, and trailhead info (63 trails, ~146 miles from Mecklenburg County GIS).
2. **Daily deals** — recurring restaurant deals indexed by day of week.
3. **Parking** — published rates and hours for the lots people actually use.

**The differentiator:** every piece of data is a JSON file in this repo, and the app has a "Suggest edit" button on everything. Tapping it opens a pull request against this repo. Maintainers review and merge; merged data ships to the live app within ~2 minutes.

## Live
- Web: https://clt-app.com (when deployed)
- iOS: pending App Store submission (EAS Build configured)
- Android: pending Play Store submission (EAS Build configured)

## Monorepo structure

```
apps/
  nextjs/        Next.js 15 web app (Vercel)
  expo/          Expo (React Native) mobile app

packages/
  api/           tRPC routers + server utilities (GitHub bot, content filter, rate limiter)
  data-schema/   Zod schemas for greenway, deal, parking + entity registry
  ui/            Shared UI components (shadcn/ui)

data/
  greenways/     63 trail JSON files + _index.json (imported from Meck GIS)
  deals/         Restaurant deal JSON files
  parking/       Parking lot JSON files

scripts/         Data pipeline: import, validate, build bundles
tooling/         Shared ESLint, Prettier, Tailwind, TypeScript configs
docs/operations/ Runbooks: tiles, secrets, rollback, GitHub App, Meck GIS
```

## Stack
- Turborepo + pnpm 10 + Node 22 (monorepo orchestration)
- Next.js 15 (web) + Expo / React Native (mobile)
- tRPC 11 (type-safe API layer)
- Zod 4 for schemas, Vitest for tests
- MapLibre GL JS (web) + MapLibre React Native (mobile) with MapTiler vector tiles
- Upstash Redis (rate limiting only — no content database)
- GitHub App for community-submission PRs (content-filtered, auto-merge for verify-only changes)
- EAS Build for iOS/Android builds
- Sentry (when configured)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). You can either edit JSON directly on GitHub, or use the app's "Suggest edit" flow — they produce the same kind of PR.

## Design

See [DESIGN.md](./DESIGN.md). PRs that change visual style should update DESIGN.md alongside.

## Developing

Requires pnpm 10+ and Node 22+ (see `.nvmrc`):
```bash
pnpm install
cp apps/nextjs/.env.example apps/nextjs/.env.local  # fill in dev values
pnpm --filter @clt/nextjs dev   # web at http://localhost:3000
pnpm --filter @clt/expo dev     # mobile (needs dev client; see expo docs)
```

Run checks before opening a PR:
```bash
pnpm typecheck && pnpm lint && pnpm test
```

## Data pipeline

Greenway data is imported from Mecklenburg County GIS:
```bash
pnpm import-greenways --source=meck-rest   # fetch from ArcGIS REST
pnpm validate:data                          # validate all JSON against Zod schemas
pnpm build:data                             # build versioned bundles
```

See [docs/operations/meck-gis.md](./docs/operations/meck-gis.md) for source details.

## License

MIT
