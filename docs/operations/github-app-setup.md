# GitHub App Setup: clt-app-bot

The `clt-app-bot` GitHub App is used by CI workflows that need to open pull requests with write access to the repository (e.g., the quarterly Meck GIS re-import).

## Step 1: Create the App

1. Go to GitHub > Settings > Developer settings > GitHub Apps > "New GitHub App"
2. Fill in:
   - **GitHub App name:** `clt-app-bot`
   - **Homepage URL:** `https://clt-app.com` (or any placeholder)
   - **Webhook:** Uncheck "Active" (not needed)
3. Set permissions:
   - **Repository permissions > Contents:** Read and write
   - **Repository permissions > Pull requests:** Read and write
   - **Repository permissions > Metadata:** Read-only (required, auto-selected)
4. Under "Where can this GitHub App be installed?", choose "Only on this account"
5. Click "Create GitHub App"

## Step 2: Capture the App ID

After creation you'll land on the app settings page. Note the **App ID** (numeric, shown near the top).

Store it as GitHub secret `GH_APP_ID`.

## Step 3: Generate a Private Key

1. Scroll to "Private keys" on the app settings page
2. Click "Generate a private key"
3. A `.pem` file downloads automatically
4. Store the full PEM contents as GitHub secret `GH_APP_PRIVATE_KEY` (see `docs/operations/secrets.md`)

## Step 4: Install the App on the Repository

1. On the app settings page, click "Install App" in the left sidebar
2. Choose your organization/account
3. Select "Only select repositories" and choose `charlotte-greenways-and-stuff-app`
4. Click "Install"

## Step 5: Capture the Installation ID

After installing, run:

```bash
gh api /repos/{owner}/charlotte-greenways-and-stuff-app/installation --jq .id
```

Store the returned numeric ID as GitHub secret `GH_APP_INSTALLATION_ID`.

## Step 6: Verify

In a workflow that uses the app, add:

```yaml
- uses: actions/create-github-app-token@v1
  id: app-token
  with:
    app-id: ${{ secrets.GH_APP_ID }}
    private-key: ${{ secrets.GH_APP_PRIVATE_KEY }}
- run: gh pr list
  env:
    GH_TOKEN: ${{ steps.app-token.outputs.token }}
```

The workflow should list open PRs without permission errors.
