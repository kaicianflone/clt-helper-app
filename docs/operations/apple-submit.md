# Apple App Store Submission

## Prerequisites

- Apple Developer Program membership ($99/year) at https://developer.apple.com
- EAS CLI installed: `npm install -g eas-cli@latest`
- Logged into EAS: `eas login`
- Logged into Apple Developer: `eas credentials` (follow prompts)

## Build

```bash
cd apps/expo
eas build --platform ios --profile production
```

This runs on EAS Build servers (M-medium resource class). Takes ~15-20 minutes.

The `autoIncrement` flag in eas.json bumps the build number automatically on each build.

## Submit

```bash
eas submit --platform ios --profile production
```

EAS Submit will prompt for:
1. Apple ID password (or App Store Connect API key)
2. If no app exists in App Store Connect, it offers to create one

The submit config in `eas.json` uses the email `kaicianflone@gmail.com`.

## App Store Connect setup

After the first `eas submit`, go to https://appstoreconnect.apple.com:

1. **Screenshots** -- required sizes:
   - iPhone 6.7" display (1290 x 2796px) -- iPhone 15 Pro Max
   - iPhone 6.1" display (1179 x 2556px) -- iPhone 15 Pro
   - iPad Pro 12.9" (2048 x 2732px) -- if targeting iPad

   Take screenshots from Simulator:
   ```bash
   xcrun simctl io booted screenshot screenshot.png
   ```

2. **App Review Information**:
   - No demo account needed (no auth system)
   - Review notes: "This app requires no login. All data is bundled with the app. Location permission is optional -- tap 'Near me' on any list to sort by distance."

3. **Age Rating**: 4+ (no objectionable content)

4. **Pricing**: Free

## App Store metadata

Metadata is managed in `apps/expo/store.config.json`. EAS Submit reads this file automatically.

To update metadata without a new build:
```bash
eas metadata:push --platform ios
```

## Privacy declarations (App Store Connect)

When prompted in App Store Connect for privacy declarations:
- **Data Not Collected** -- check this box
- Location data is processed on-device only and never sent to a server
- Device ID is a random anonymous identifier for rate limiting only (not linked to identity)

## OTA updates (after initial submission)

For JavaScript-only changes, use EAS Update instead of a full rebuild:
```bash
eas update --branch production --message "description of change"
```

Native changes (new native modules, config changes) require a new build + submit.

## Troubleshooting

- **"Missing compliance" error**: `ITSAppUsesNonExemptEncryption` is already set to `false` in app.config.ts
- **Build fails on MapLibre**: ensure the iOS native project builds locally first with `npx expo run:ios`
- **Provisioning errors**: run `eas credentials` to reconfigure certificates
