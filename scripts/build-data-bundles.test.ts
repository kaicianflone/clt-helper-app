import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildBundle } from "./build-data-bundles";

let workDir: string;

beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-"));
});
afterEach(() => fs.rmSync(workDir, { recursive: true, force: true }));

describe("buildBundle", () => {
  it("concatenates entries excluding _index.json", () => {
    fs.writeFileSync(path.join(workDir, "a.json"), JSON.stringify({ slug: "a" }));
    fs.writeFileSync(path.join(workDir, "b.json"), JSON.stringify({ slug: "b" }));
    fs.writeFileSync(path.join(workDir, "_index.json"), "{}");
    const bundle = buildBundle(workDir, 1);
    expect(bundle.entries).toHaveLength(2);
    expect(bundle.entries.map((e: { slug: string }) => e.slug).sort()).toEqual(["a", "b"]);
    expect(bundle.schemaVersion).toBe(1);
    expect(bundle.builtAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns empty entries for empty dir", () => {
    const bundle = buildBundle(workDir, 1);
    expect(bundle.entries).toEqual([]);
  });

  // P2-3: missing input dir must throw, not silently return empty
  it("throws an error when the input directory does not exist", () => {
    const missingDir = path.join(workDir, "does-not-exist");
    expect(() => buildBundle(missingDir, 1)).toThrow(/does not exist/i);
  });
});
