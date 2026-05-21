/**
 * Tests for device-id.ts (P0-2 regression).
 *
 * We mock the React Native / Expo modules so this file can run under
 * a plain Node vitest environment without a native runtime.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock react-native Platform ---
vi.mock("react-native", () => ({
  Platform: { OS: "web" }, // non-ios, non-android → goes straight to fallback
}));

// --- Mock expo-application ---
vi.mock("expo-application", () => ({
  getIosIdForVendorAsync: vi.fn().mockResolvedValue(null),
  getAndroidId: vi.fn().mockReturnValue(""),
}));

// In-memory AsyncStorage mock
const store: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
  },
}));

describe("getDeviceIdAsync – persistence (P0-2)", () => {
  beforeEach(() => {
    // Clear mock store before each test
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it("returns a non-empty string on first call", async () => {
    const { getDeviceIdAsync } = await import("./device-id");
    const id = await getDeviceIdAsync();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns the SAME value on consecutive calls (persistence)", async () => {
    const { getDeviceIdAsync } = await import("./device-id");
    const id1 = await getDeviceIdAsync();
    const id2 = await getDeviceIdAsync();
    expect(id1).toBe(id2);
    expect(id1).not.toBe("");
  });

  it("never returns the old sentinel value 'no-installation-id'", async () => {
    const { getDeviceIdAsync } = await import("./device-id");
    const id = await getDeviceIdAsync();
    expect(id).not.toBe("no-installation-id");
  });
});
