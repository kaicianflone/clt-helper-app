# Plan: Apple App Store Deployment

## Overview

Prepare clt-app (Expo React Native) for Apple App Store submission via EAS Build + EAS Submit with interactive Apple ID auth.

## Tasks

### Task 1: Update eas.json submit configuration
**Files:** `apps/expo/eas.json`
**Changes:**
- Remove TBD placeholders from submit.production.ios
- Configure for Apple ID interactive auth (remove ascAppId/appleTeamId, EAS will prompt)
- Keep the production build profile as-is (already correct)

### Task 2: Update app.config.ts for production
**Files:** `apps/expo/app.config.ts`
**Changes:**
- Bump version from "0.1.0" to "1.0.0"
- Add `buildNumber: "1"` to ios config
- Add `privacyManifests` for iOS 17+ requirements (NSPrivacyTracking: false, NSPrivacyCollectedDataTypes for location)
- Add privacy policy URL to infoPlist: `NSPrivacyPolicyURL`

### Task 3: Fix privacy policy GitHub link
**Files:** `apps/nextjs/src/app/privacy/page.tsx`
**Changes:**
- Replace "CHANGE-ME" placeholder in GitHub URL with actual repo URL "kaicianflone/charlotte-greenways-and-stuff-app"

### Task 4: Create store.config.json for App Store metadata
**Files:** `apps/expo/store.config.json`
**Changes:**
- Create new file with App Store metadata:
  - App name: "CLT - Charlotte Guide"
  - Subtitle: "Greenways, Deals & Parking"
  - Description covering all three domains
  - Keywords: charlotte, greenways, trails, deals, parking, happy hour, CLT, north carolina, queen city
  - Primary category: NAVIGATION
  - Secondary category: FOOD_AND_DRINK
  - Privacy URL: https://clt-app.com/privacy
  - Copyright

### Task 5: Add App Store description and promotional text
**Files:** `apps/expo/store.config.json` (same as Task 4, included in that file)
**Changes:**
- Full description (4000 chars max)
- Promotional text (170 chars max)
- What's New text for v1.0.0

### Task 6: Create EAS submit documentation
**Files:** `docs/operations/apple-submit.md`
**Changes:**
- Document the build + submit workflow
- Document required manual steps (Apple Developer account, App Store Connect)
- Document screenshot requirements
- Document App Review notes (demo credentials not needed since no auth)
