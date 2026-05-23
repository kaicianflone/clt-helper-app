import { describe, expect, it } from "vitest";

import { computeBounds } from "./bounds";

describe("computeBounds", () => {
  it("returns the tight bbox for a single segment", () => {
    const geom: GeoJSON.MultiLineString = {
      type: "MultiLineString",
      coordinates: [
        [
          [-80.8, 35.2],
          [-80.7, 35.3],
          [-80.6, 35.25],
        ],
      ],
    };
    expect(computeBounds(geom)).toEqual([
      [-80.8, 35.2],
      [-80.6, 35.3],
    ]);
  });

  it("unions across multiple disjoint segments", () => {
    const geom: GeoJSON.MultiLineString = {
      type: "MultiLineString",
      coordinates: [
        [
          [-80.9, 35.0],
          [-80.8, 35.1],
        ],
        [
          [-80.5, 35.4],
          [-80.4, 35.5],
        ],
      ],
    };
    expect(computeBounds(geom)).toEqual([
      [-80.9, 35.0],
      [-80.4, 35.5],
    ]);
  });

  it("collapses to a point when all coords are identical", () => {
    const geom: GeoJSON.MultiLineString = {
      type: "MultiLineString",
      coordinates: [
        [
          [-80.84, 35.22],
          [-80.84, 35.22],
        ],
      ],
    };
    expect(computeBounds(geom)).toEqual([
      [-80.84, 35.22],
      [-80.84, 35.22],
    ]);
  });

  it("returns lng before lat in each tuple (maplibre order)", () => {
    const geom: GeoJSON.MultiLineString = {
      type: "MultiLineString",
      coordinates: [
        [
          [-80.0, 35.0],
          [-79.0, 36.0],
        ],
      ],
    };
    const [[minLng, minLat], [maxLng, maxLat]] = computeBounds(geom);
    expect(minLng).toBe(-80.0);
    expect(minLat).toBe(35.0);
    expect(maxLng).toBe(-79.0);
    expect(maxLat).toBe(36.0);
  });
});
