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

  it("filters items by query using useMemo", () => {
    expect(src).toContain("query.toLowerCase()");
    expect(src).toContain(".includes(q)");
  });

  it("shows result count when filtering is active", () => {
    expect(src).toContain("filtered.length");
  });

  it("renders the filtered list, not the unfiltered items", () => {
    expect(src).toContain("filtered.map");
  });
});
