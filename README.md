# clt-app

An open-source iOS, Android, and web app for Charlotte, NC.

Three things it does:
1. **Greenways** — every Charlotte-area greenway trail with maps, length, surface, and trailhead info.
2. **Daily deals** — recurring restaurant deals indexed by day of week.
3. **Parking** — published rates and hours for the lots people actually use.

**The differentiator:** every piece of data is a JSON file in this repo, and the app has a "Suggest edit" button on everything. Tapping it opens a pull request against this repo. Maintainers review and merge; merged data ships to the live app within ~2 minutes.

## Live
- Web: https://clt-app.com (when deployed)
- iOS: pending App Store submission
- Android: pending Play Store submission

## Stack
- create-t3-turbo (Turborepo + pnpm + Expo + Next.js + tRPC)
- Zod for schemas, Vitest for tests, Playwright for web E2E
- MapLibre + Protomaps (self-hosted vector tiles on Cloudflare R2)
- Upstash Redis (rate limiting only — no content database)
- GitHub App for community-submission PRs
- Sentry (when configured)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). You can either edit JSON directly on GitHub, or use the app's "Suggest edit" flow — they produce the same kind of PR.

## Design

See [DESIGN.md](./DESIGN.md). PRs that change visual style should update DESIGN.md alongside.

## Developing

Install pnpm and Node 20+:
```bash
pnpm install
cp apps/nextjs/.env.example apps/nextjs/.env.local  # fill in dev values
pnpm --filter @clt/nextjs dev   # web at http://localhost:3000
pnpm --filter @clt/expo dev     # mobile (needs dev client; see expo docs)
```

## License

MIT
