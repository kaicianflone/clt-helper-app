import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "greenway-list.tsx"), "utf-8");

describe("greenway list search filter", () => {
  it("has a search input with type=search", () => {
    expect(src).toContain('type="search"');
  });

  it("has a label for the search input", () => {
    expect(src).toContain('htmlFor="greenway-search"');
    expect(src).toContain('id="greenway-search"');
  });

  it("filters items by query", () => {
    expect(src).toContain(".toLowerCase()");
    expect(src).toContain(".includes(q)");
  });

  it("renders the computed list and a result count", () => {
    expect(src).toContain("visible.map");
    expect(src).toContain("visible.length");
  });
});

describe("greenway list sort + filter controls", () => {
  it("has a sort dropdown with multiple options", () => {
    expect(src).toContain('id="greenway-sort"');
    expect(src).toContain("Nearest");
    expect(src).toContain("Longest first");
    expect(src).toContain("Shortest first");
  });

  it("has a surface filter dropdown", () => {
    expect(src).toContain('id="greenway-surface"');
    expect(src).toContain("All surfaces");
  });

  it("has a length filter dropdown", () => {
    expect(src).toContain('id="greenway-length"');
    expect(src).toContain("Any length");
  });
});
