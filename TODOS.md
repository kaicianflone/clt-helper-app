# TODOs

## Pre-launch (manual steps)

- [ ] Create OpenAI API key + configure (for gstack/design work)
- [ ] Create GitHub App "clt-app-bot" (see docs/operations/github-app-setup.md)
- [ ] Create Cloudflare R2 bucket "clt-app-prod" + custom domain
- [ ] Create Upstash Redis database
- [ ] Generate REVALIDATION_SECRET: `openssl rand -hex 32`
- [ ] Set up Vercel project + production env vars (see docs/operations/secrets.md)
- [ ] Create Sentry project for web + separate for mobile
- [ ] Apple Developer account + App Store Connect "clt-app" app
- [ ] Google Play Developer account + Play Console "clt-app" app
- [ ] Design real splash + icon assets (cream/brick per DESIGN.md)
- [ ] Take screenshots on simulator after first build for App Store / Play Store
- [ ] Update `apps/nextjs/public/.well-known/apple-app-site-association` with actual Team ID
- [ ] Update `apps/nextjs/public/.well-known/assetlinks.json` with actual SHA-256 cert fingerprint after first Play Store upload
- [ ] Run first EAS build: `pnpm --filter @clt/expo dlx eas-cli build --profile preview --platform ios`

## Post-v1 enhancements (deferred from reviews)

- [ ] GPX export on greenway detail pages
- [ ] Search bar across all entities
- [ ] Restaurant page consolidation (multiple deals → one page per restaurant)
- [ ] iOS widget / Android home shortcut for today's deals
- [ ] Photo uploads via Cloudinary or R2
- [ ] Map clustering for parking lots at low zoom
- [ ] Multi-city framework refactor (`data/{city}/{category}/*.json`)
- [ ] Real-time parking availability
- [ ] User accounts (Sign in with Apple)
- [ ] Push notifications
- [ ] Email design (transactional or marketing)
- [ ] Voice & tone guide
- [ ] Illustrations or graphic device beyond typography
- [ ] Dark mode

## V2 operational

- [ ] Upstash failure detection + admin alert
- [ ] Bundle size optimization: split greenway geometry into separate file
- [ ] Tile-egress monitoring on R2 bandwidth dashboard
- [ ] Public art map (Charlotte open data)
- [ ] Events feature (farmers markets, free concerts)
- [ ] Detox iOS + Android e2e tests
- [ ] Visual regression testing
- [ ] Real-device a11y testing (VoiceOver, TalkBack)
