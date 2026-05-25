import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "deal-form.tsx"), "utf-8");

describe("deal form address geocoding", () => {
  it("imports env for MapTiler key access", () => {
    expect(src).toContain('from "~/env"');
  });

  it("calls MapTiler geocoding API with Charlotte bbox", () => {
    expect(src).toContain("api.maptiler.com/geocoding/");
    expect(src).toContain("bbox=-81.1,34.9,-80.5,35.5");
  });

  it("has onBlur handler on address input to trigger geocoding", () => {
    expect(src).toContain("onBlur");
    expect(src).toContain("geocodeAddress");
  });

  it("handles all geocode status states", () => {
    expect(src).toContain('"idle"');
    expect(src).toContain('"loading"');
    expect(src).toContain('"found"');
    expect(src).toContain('"error"');
    expect(src).toContain("Looking up coordinates");
    expect(src).toContain("Coordinates found:");
  });

  it("has manual coordinates disclosure toggle", () => {
    expect(src).toContain("showManualCoords");
    expect(src).toContain("Enter coordinates manually");
  });

  it("uses inputMode decimal instead of type number for lat/lng", () => {
    expect(src).toContain('inputMode="decimal"');
    expect(src).not.toContain('type="number"');
  });

  it("resets geocode status when address changes", () => {
    expect(src).toContain('setGeocodeStatus("idle")');
  });
});
