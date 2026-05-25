import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "clt-app",
  slug: "clt-app",
  scheme: "cltapp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon-light.png",
  userInterfaceStyle: "automatic",
  updates: {
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/d2421d0b-d42b-4347-980a-16bf0ed80f51",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  newArchEnabled: true,
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "com.cltapp.mobile",
    buildNumber: "1",
    supportsTablet: true,
    icon: {
      light: "./assets/icon-light.png",
      dark: "./assets/icon-dark.png",
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        "Used to sort greenways, deals, and parking by distance from you. Your location never leaves your device.",
    },
    associatedDomains: ["applinks:clt-app.com"],
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType:
            "NSPrivacyAccessedAPICategoryDiskSpace",
          NSPrivacyAccessedAPITypeReasons: ["E174.1"],
        },
        {
          NSPrivacyAccessedAPIType:
            "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
      ],
    },
  },
  android: {
    package: "com.cltapp.mobile",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/icon-light.png",
      backgroundColor: "#B23A1F",
    },
    edgeToEdgeEnabled: true,
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "clt-app.com",
            pathPrefix: "/",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  extra: {
    eas: {
      projectId: "d2421d0b-d42b-4347-980a-16bf0ed80f51",
    },
  },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
    reactCanary: true,
    reactCompiler: true,
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    "expo-location",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#F5EFE6",
        image: "./assets/icon-light.png",
        dark: {
          backgroundColor: "#F5EFE6",
          image: "./assets/icon-dark.png",
        },
      },
    ],
    "@maplibre/maplibre-react-native",
  ],
});
