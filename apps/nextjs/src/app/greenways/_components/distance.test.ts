import { describe, expect, it } from "vitest";

import {
  haversineMiles,
  sortAlphabetical,
  sortByDistance,
} from "./distance";

describe("haversineMiles", () => {
  it("returns 0 for identical points", () => {
    expect(haversineMiles(35.227, -80.843, 35.227, -80.843)).toBe(0);
  });

  it("computes Charlotte → NYC at ~540 miles", () => {
    const d = haversineMiles(35.227, -80.843, 40.7128, -74.006);
    expect(d).toBeGreaterThan(530);
    expect(d).toBeLessThan(550);
  });

  it("handles short distances accurately (~1 mi)", () => {
    // 1° latitude ≈ 69 miles → 0.0145° ≈ 1 mi
    const d = haversineMiles(35.0, -80.0, 35.0145, -80.0);
    expect(d).toBeCloseTo(1, 1);
  });

  it("is symmetric", () => {
    const a = haversineMiles(35.2, -80.8, 35.5, -80.5);
    const b = haversineMiles(35.5, -80.5, 35.2, -80.8);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe("sortByDistance", () => {
  const origin = { lat: 35.227, lng: -80.843 };

  it("sorts greenways with coords by distance ascending", () => {
    const items = [
      { slug: "far", name: "Far", lat: 35.5, lng: -80.5 },
      { slug: "near", name: "Near", lat: 35.23, lng: -80.84 },
      { slug: "mid", name: "Mid", lat: 35.3, lng: -80.75 },
    ];
    const sorted = sortByDistance(items, origin);
    expect(sorted.map((g) => g.slug)).toEqual(["near", "mid", "far"]);
    const distances = sorted.map((g) => g.distanceMi);
    expect(distances[0]).toBeLessThan(distances[1] ?? Infinity);
  });

  it("pushes greenways without coords to the end, alphabetized", () => {
    const items = [
      { slug: "no-coord-b", name: "B", lat: null, lng: null },
      { slug: "has-coord", name: "Has", lat: 35.23, lng: -80.84 },
      { slug: "no-coord-a", name: "A", lat: null, lng: null },
    ];
    const sorted = sortByDistance(items, origin);
    expect(sorted.map((g) => g.slug)).toEqual([
      "has-coord",
      "no-coord-a",
      "no-coord-b",
    ]);
    expect(sorted.map((g) => g.distanceMi).slice(1)).toEqual([null, null]);
  });

  it("returns A-Z when no items have coords", () => {
    const items = [
      { slug: "c", name: "Charlie", lat: null, lng: null },
      { slug: "a", name: "Alpha", lat: null, lng: null },
      { slug: "b", name: "Bravo", lat: null, lng: null },
    ];
    const sorted = sortByDistance(items, origin);
    expect(sorted.map((g) => g.slug)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate input array", () => {
    const items = [
      { slug: "b", name: "B", lat: 35.5, lng: -80.5 },
      { slug: "a", name: "A", lat: 35.23, lng: -80.84 },
    ];
    const orig = [...items];
    sortByDistance(items, origin);
    expect(items).toEqual(orig);
  });
});

describe("sortAlphabetical", () => {
  it("sorts by name and sets distanceMi=null", () => {
    const items = [
      { slug: "c", name: "Charlie", lat: 1, lng: 1 },
      { slug: "a", name: "Alpha", lat: 2, lng: 2 },
      { slug: "b", name: "Bravo", lat: null, lng: null },
    ];
    const sorted = sortAlphabetical(items);
    expect(sorted.map((g) => g.slug)).toEqual(["a", "b", "c"]);
    expect(sorted.map((g) => g.distanceMi)).toEqual([null, null, null]);
  });

  it("does not mutate input array", () => {
    const items = [
      { slug: "b", name: "B", lat: null, lng: null },
      { slug: "a", name: "A", lat: null, lng: null },
    ];
    const orig = [...items];
    sortAlphabetical(items);
    expect(items).toEqual(orig);
  });
});
