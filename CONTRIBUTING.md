# Contributing

The clt-app data layer lives in JSON files in this repo. Anyone can submit corrections or new entries.

## Edit via the app (easiest)

1. Open the app (web or mobile).
2. Find the page you want to edit.
3. Tap **Suggest an edit**.
4. Make your changes, agree to the EULA, and submit.
5. A pull request opens automatically. A maintainer reviews + merges.
6. The change ships to live within ~2 minutes.

## Edit via GitHub directly

1. Find the file in [`data/`](./data) — schemas live in [`packages/data-schema/src`](./packages/data-schema/src).
2. Edit the JSON.
3. Open a PR. CI validates the schema; a maintainer reviews + merges.

## Developing locally

1. Install pnpm 9+ and Node 20+.
2. `pnpm install`
3. `pnpm typecheck && pnpm lint && pnpm test` should pass on a fresh clone.
4. For web: `pnpm --filter @clt/nextjs dev`
5. For mobile (needs dev client): `pnpm --filter @clt/expo expo prebuild --clean && pnpm --filter @clt/expo dev`

## Code style

- TypeScript strict everywhere.
- Tests required for `scripts/`, `packages/api/src/server/`, `packages/data-schema/src/`.
- Run `pnpm test && pnpm typecheck && pnpm lint` before opening a PR.

## What goes in `data/`

- Real, verifiable Charlotte information.
- Updated, not stale (the app surfaces a "verified N days ago" badge to help).
- No personal information about private individuals.
- No promotional content.
