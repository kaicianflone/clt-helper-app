# Rollback Procedures

## Bad Data Merge

**Symptoms:** Incorrect greenway, deal, or parking data appears in production after a data PR lands.

**Procedure:**

1. Identify the merge commit SHA:
   ```bash
   git log --oneline data/
   ```
2. Revert the commit:
   ```bash
   git revert <commit-sha> --no-edit
   git push origin main
   ```
3. The `release-data` workflow will trigger automatically on the push to main, rebuilding and re-uploading the previous data bundles.
4. Verify the revalidation step completed — check the workflow run logs for `curl` success output.

## Web Deploy Broken (Vercel)

**Symptoms:** The Next.js app is returning 500 errors or rendering incorrectly after a deploy.

**Procedure:**

1. Open the Vercel dashboard for the project
2. Go to "Deployments"
3. Find the last known-good deployment (green checkmark)
4. Click the "..." menu > "Promote to Production"
5. Confirm. Traffic will shift to the previous deployment within ~30 seconds.

If the issue is in an environment variable, fix it in Vercel > Settings > Environment Variables and redeploy.

## Mobile Pull (App Store / Play Store + EAS OTA)

**Symptoms:** A bad update reached users via OTA (Expo Updates) or a bad app store build was published.

### OTA rollback (Expo Updates)

1. Identify the last good EAS update channel:
   ```bash
   eas update:list --branch production
   ```
2. Republish the last good update:
   ```bash
   eas update --branch production --message "rollback: revert bad OTA"
   ```
   Expo will push the previous bundle; users will receive it on next app launch.

### App store rollback

- **iOS (App Store):** Submit a new build with the previous version code. Apple does not support rollback of published releases; an expedited review request may be needed.
- **Android (Play Store):** Use "Releases > Production > Rollout > Halt rollout" to stop the bad version from reaching more users, then promote the previous release under "Previous releases".

## Tile Broken (Update Manifest Pointer)

**Symptoms:** The map is blank or showing corrupt tiles after a `release-tiles` workflow run.

**Procedure:**

1. Identify the last known-good tile hash from previous workflow run logs or the R2 bucket listing
2. Update the manifest to point at the previous file:
   ```bash
   echo '{"current":"tiles/charlotte-<PREVIOUS_SHA>.pmtiles","builtAt":"<ISO_TIMESTAMP>"}' > /tmp/tiles-manifest.json
   npx wrangler r2 object put "$R2_BUCKET/tiles/manifest.json" \
     --file=/tmp/tiles-manifest.json \
     --content-type=application/json \
     --cache-control="public, max-age=60"
   ```
3. The app will pick up the new manifest within 60 seconds (TTL of the manifest cache header).

## Bot Keys Leaked (GH_APP_PRIVATE_KEY)

**Symptoms:** `GH_APP_PRIVATE_KEY` or other bot credentials appear in logs, a public commit, or a third-party service.

**Procedure:**

1. **Immediately revoke the key:**
   - Go to GitHub App settings > Private keys
   - Delete the compromised key
2. **Generate a new key:**
   - Click "Generate a private key"
   - Download the new `.pem` file
3. **Update the secret:**
   - Go to repo Settings > Secrets > `GH_APP_PRIVATE_KEY`
   - Update with the new PEM contents
4. **Audit recent workflow runs** that used the old key for any unexpected activity
5. **Check R2 API tokens** if `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` were also exposed:
   - Cloudflare dashboard > R2 > Manage R2 API Tokens
   - Revoke the compromised token and create a replacement
   - Update `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` secrets
