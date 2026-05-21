import * as Application from "expo-application";
import { Platform } from "react-native";

/**
 * Returns a stable device identifier.
 * - iOS: vendor UUID from `getIosIdForVendorAsync` (resets on uninstall).
 * - Android: `getAndroidId()` (settable; not guaranteed unique).
 * Falls back to "no-installation-id" on error or unsupported platforms.
 */
export const getDeviceIdAsync = async (): Promise<string> => {
  try {
    if (Platform.OS === "ios") {
      const id = await Application.getIosIdForVendorAsync();
      return id ?? "no-installation-id";
    }
    if (Platform.OS === "android") {
      return Application.getAndroidId();
    }
    return "no-installation-id";
  } catch {
    return "no-installation-id";
  }
};

/** Synchronous shim — prefer `getDeviceIdAsync`. */
export const getDeviceId = (): string => {
  if (Platform.OS === "android") {
    return Application.getAndroidId();
  }
  return "no-installation-id";
};
