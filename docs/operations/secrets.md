# Required Secrets

All secrets are stored in GitHub repository secrets (`Settings > Secrets and variables > Actions`). Environment-specific secrets (e.g., staging vs. production) can be set at the environment level.

## Secret Reference Table

| Secret | Used By | Purpose | How to Generate |
|---|---|---|---|
| `R2_ACCOUNT_ID` | `release-data`, `release-tiles` | Cloudflare account ID for R2 | Find in Cloudflare dashboard > right sidebar |
| `R2_ACCESS_KEY_ID` | `release-data`, `release-tiles` | R2 API key ID | Cloudflare R2 > Manage R2 API Tokens > Create Token |
| `R2_SECRET_ACCESS_KEY` | `release-data`, `release-tiles` | R2 API secret | Shown once on token creation; store immediately |
| `R2_BUCKET` | `release-data`, `release-tiles` | R2 bucket name (e.g. `clt-app-prod`) | Name chosen when creating the bucket |
| `REVALIDATION_SECRET` | `release-data` | Bearer token for Next.js on-demand revalidation | See generation example below |
| `GH_APP_ID` | `import-meck-greenways` (future) | GitHub App numeric ID | Shown on the App settings page |
| `GH_APP_PRIVATE_KEY` | `import-meck-greenways` (future) | GitHub App private key PEM | See generation example below |
| `GH_APP_INSTALLATION_ID` | `import-meck-greenways` (future) | Installation ID for the repo | `gh api /repos/{owner}/{repo}/installation --jq .id` |
| `UPSTASH_REDIS_REST_URL` | API (future) | Upstash Redis REST endpoint | Upstash console > Database > REST API |
| `UPSTASH_REDIS_REST_TOKEN` | API (future) | Upstash Redis auth token | Upstash console > Database > REST API |
| `SENTRY_DSN` | Web + mobile (future) | Sentry error reporting DSN | Sentry project > Settings > Client Keys |
| `EXPO_PUBLIC_API_URL` | Expo app | Public base URL for the tRPC API | Set to production API URL, e.g. `https://clt-app.com/api/trpc` |
| `NREL_API_KEY` | `import-gis` (EV charging source) | NREL Alt-Fuel Stations API key | Sign up at https://developer.nrel.gov/signup (free). Leave unset to use `DEMO_KEY` in dev (rate-limited). See `docs/operations/gis-sources.md`. |

## Universal Links / App Association

### Apple App Site Association — TEAMID placeholder

`apps/nextjs/public/.well-known/apple-app-site-association` contains a placeholder `TEAMID` in the `appID` field:

```json
{ "appID": "TEAMID.com.cltapp.mobile" }
```

Replace `TEAMID` with your 10-character Apple Developer Team ID (found in the Apple Developer portal under Membership > Team ID) during Plan 4 manual App Store setup. The file is served at `/.well-known/apple-app-site-association` by Vercel with `Content-Type: application/json` (configured in `vercel.json`).

### Android Asset Links — SHA-256 fingerprint placeholder

`apps/nextjs/public/.well-known/assetlinks.json` contains a placeholder `TBD-DURING-PLAY-STORE-UPLOAD` for the `sha256_cert_fingerprints` field. Replace it with the actual SHA-256 fingerprint of your Android signing certificate after the first Play Store upload during Plan 4.

## Generation Examples

### REVALIDATION_SECRET

Generate a cryptographically random token:

```bash
openssl rand -base64 32
# Example output: 4Kz9mXpQrVtY2wNsLjEaHgFdCuBoI7On1eRkMv8=
```

Store this value in:
- GitHub secret `REVALIDATION_SECRET`
- Vercel environment variable `REVALIDATION_SECRET` (for the Next.js app to validate incoming requests)

### GH_APP_PRIVATE_KEY

After creating the GitHub App (see `docs/operations/github-app-setup.md`):

1. Go to GitHub App settings > General > Private keys
2. Click "Generate a private key"
3. Download the `.pem` file
4. Store the full PEM contents (including `-----BEGIN RSA PRIVATE KEY-----` header/footer) as the `GH_APP_PRIVATE_KEY` secret

```bash
# Verify the key format
cat clt-app-bot.YYYY-MM-DD.private-key.pem | head -3
# Should show: -----BEGIN RSA PRIVATE KEY-----
```
