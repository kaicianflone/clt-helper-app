import { describe, expect, it } from "vitest";
import { haversineMiles } from "./distance";

describe("haversineMiles", () => {
  it("returns 0 for same point", () => {
    expect(haversineMiles([35.22, -80.84], [35.22, -80.84])).toBeCloseTo(0, 3);
  });
  it("computes ~1 mile correctly (~0.0145° lat ≈ 1 mile)", () => {
    expect(haversineMiles([35.22, -80.84], [35.2345, -80.84])).toBeCloseTo(1, 1);
  });
  it("is symmetric", () => {
    const a: [number, number] = [35.22, -80.84];
    const b: [number, number] = [35.30, -80.90];
    expect(haversineMiles(a, b)).toBeCloseTo(haversineMiles(b, a), 6);
  });
});
