import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateEntityDir } from "./validate-data";
import { GreenwayEntity } from "@clt/data-schema";

let workDir: string;
beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), "validate-"));
});
afterEach(() => fs.rmSync(workDir, { recursive: true, force: true }));

describe("validateEntityDir(greenway)", () => {
  it("returns empty error array when valid", () => {
    fs.writeFileSync(
      path.join(workDir, "ok.json"),
      JSON.stringify({
        slug: "ok",
        name: "OK",
        description: "",
        lengthMiles: 1,
        surface: "paved",
        trailheads: [{ name: "x", lat: 0, lng: 0 }],
        geometry: { type: "LineString", coordinates: [[0,0],[1,1]] },
        pointsOfInterest: [],
        photos: [],
        lastVerified: "2026-05-20",
      }),
    );
    expect(validateEntityDir(GreenwayEntity, workDir)).toEqual([]);
  });
  it("returns errors for invalid files", () => {
    fs.writeFileSync(path.join(workDir, "bad.json"), JSON.stringify({ slug: "bad" }));
    const errors = validateEntityDir(GreenwayEntity, workDir);
    expect(errors).toHaveLength(1);
    expect(errors[0].file).toBe("bad.json");
  });
});
