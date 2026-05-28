import { describe, expect, it } from "vitest";

import {
  GIS_KIND_KEYS,
  GIS_KIND_MAP,
  GIS_KINDS,
} from "./map-kinds";

const EXPECTED_KINDS = [
  "park",
  "recycling",
  "ev-charging",
  "transit-parking",
  "landfill",
  "amenity",
] as const;

describe("GIS_KINDS config", () => {
  it("contains all expected entity kinds", () => {
    const kinds = GIS_KINDS.map((k) => k.kind);
    for (const expected of EXPECTED_KINDS) {
      expect(kinds).toContain(expected);
    }
  });

  it("every entry has a non-empty label", () => {
    for (const k of GIS_KINDS) {
      expect(k.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("every entry has a valid hex color", () => {
    const hexRe = /^#[0-9a-fA-F]{6}$/;
    for (const k of GIS_KINDS) {
      expect(hexRe.test(k.color)).toBe(true);
    }
  });

  it("every entry has a CSS var name starting with --map-", () => {
    for (const k of GIS_KINDS) {
      expect(k.cssVar.startsWith("--map-")).toBe(true);
    }
  });

  it("kind strings are unique", () => {
    const kinds = GIS_KINDS.map((k) => k.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });
});

describe("GIS_KIND_MAP", () => {
  it("is a lookup map with the same entries as GIS_KINDS", () => {
    expect(Object.keys(GIS_KIND_MAP).sort()).toEqual(
      GIS_KINDS.map((k) => k.kind).sort(),
    );
  });

  it("returns the correct config for a known kind", () => {
    expect(GIS_KIND_MAP.park?.color).toBe("#3a7a4f");
    expect(GIS_KIND_MAP.recycling?.color).toBe("#2e7d80");
    expect(GIS_KIND_MAP["ev-charging"]?.color).toBe("#2f5fa0");
    expect(GIS_KIND_MAP["transit-parking"]?.color).toBe("#5b4b9c");
    expect(GIS_KIND_MAP.amenity?.color).toBe("#9c6b3f");
  });

  it("returns undefined for an unknown kind", () => {
    expect(GIS_KIND_MAP["unknown-kind"]).toBeUndefined();
  });
});

describe("GIS_KIND_KEYS", () => {
  it("matches the order of GIS_KINDS", () => {
    expect(GIS_KIND_KEYS).toEqual(GIS_KINDS.map((k) => k.kind));
  });

  it("has the expected count", () => {
    expect(GIS_KIND_KEYS.length).toBe(EXPECTED_KINDS.length);
  });
});
