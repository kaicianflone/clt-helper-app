import { describe, expect, it } from "vitest";

import {
  buildDefaultVisibility,
  getKindConfig,
  MAP_KIND_CONFIGS,
  toggleKindVisibility,
} from "./kinds";

// ---------------------------------------------------------------------------
// MAP_KIND_CONFIGS structure
// ---------------------------------------------------------------------------

describe("MAP_KIND_CONFIGS", () => {
  it("includes greenway and parking (existing kinds)", () => {
    const kinds = MAP_KIND_CONFIGS.map((c) => c.kind);
    expect(kinds).toContain("greenway");
    expect(kinds).toContain("parking");
  });

  it("includes all new GIS kinds", () => {
    const kinds = MAP_KIND_CONFIGS.map((c) => c.kind);
    expect(kinds).toContain("park");
    expect(kinds).toContain("recycling");
    expect(kinds).toContain("ev-charging");
    expect(kinds).toContain("transit-parking");
    expect(kinds).toContain("landfill");
    expect(kinds).toContain("amenity");
  });

  it("has no duplicate kind identifiers", () => {
    const kinds = MAP_KIND_CONFIGS.map((c) => c.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it("has no duplicate source ids", () => {
    const ids = MAP_KIND_CONFIGS.map((c) => c.sourceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate layer ids", () => {
    const ids = MAP_KIND_CONFIGS.map((c) => c.layerId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every config has a non-empty label", () => {
    MAP_KIND_CONFIGS.forEach((c) => {
      expect(c.label.length).toBeGreaterThan(0);
    });
  });

  it("every config has a valid hex color", () => {
    MAP_KIND_CONFIGS.forEach((c) => {
      expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it("every config specifies a valid layer type", () => {
    MAP_KIND_CONFIGS.forEach((c) => {
      expect(["line", "circle"]).toContain(c.layerType);
    });
  });

  it("greenway uses line layer type", () => {
    const gw = MAP_KIND_CONFIGS.find((c) => c.kind === "greenway");
    expect(gw?.layerType).toBe("line");
  });

  it("point-based kinds use circle layer type", () => {
    const pointKinds = [
      "parking",
      "park",
      "recycling",
      "ev-charging",
      "transit-parking",
      "landfill",
      "amenity",
    ];
    pointKinds.forEach((kind) => {
      const config = MAP_KIND_CONFIGS.find((c) => c.kind === kind);
      expect(config?.layerType).toBe("circle");
    });
  });
});

// ---------------------------------------------------------------------------
// Color token correctness (mirrors DESIGN.md --map-* values)
// ---------------------------------------------------------------------------

describe("kind→color mapping", () => {
  const colorByKind = Object.fromEntries(
    MAP_KIND_CONFIGS.map((c) => [c.kind, c.color]),
  );

  it("park marker color matches --map-park-marker token", () => {
    expect(colorByKind.park).toBe("#3A7A4F");
  });

  it("recycling marker color matches --map-recycling token", () => {
    expect(colorByKind.recycling).toBe("#2E7D80");
  });

  it("ev-charging marker color matches --map-ev-charging token", () => {
    expect(colorByKind["ev-charging"]).toBe("#2F5FA0");
  });

  it("transit-parking marker color matches --map-transit-parking token", () => {
    expect(colorByKind["transit-parking"]).toBe("#5B4B9C");
  });

  it("amenity marker color matches --map-amenity token", () => {
    expect(colorByKind.amenity).toBe("#9C6B3F");
  });
});

// ---------------------------------------------------------------------------
// buildDefaultVisibility
// ---------------------------------------------------------------------------

describe("buildDefaultVisibility", () => {
  it("enables only greenways/deals by default; all other kinds hidden", () => {
    const vis = buildDefaultVisibility(MAP_KIND_CONFIGS);
    MAP_KIND_CONFIGS.forEach((c) => {
      expect(vis[c.kind]).toBe(c.kind === "greenway" || c.kind === "deal");
    });
    // greenway is in MAP_KIND_CONFIGS and must default on
    expect(vis.greenway).toBe(true);
  });

  it("contains exactly one key per config entry", () => {
    const vis = buildDefaultVisibility(MAP_KIND_CONFIGS);
    expect(Object.keys(vis).length).toBe(MAP_KIND_CONFIGS.length);
  });
});

// ---------------------------------------------------------------------------
// toggleKindVisibility
// ---------------------------------------------------------------------------

describe("toggleKindVisibility", () => {
  it("toggles a visible kind to hidden", () => {
    const vis = buildDefaultVisibility(MAP_KIND_CONFIGS);
    // greenway is visible by default
    const next = toggleKindVisibility(vis, "greenway");
    expect(next.greenway).toBe(false);
  });

  it("toggles a hidden kind back to visible", () => {
    const vis = { ...buildDefaultVisibility(MAP_KIND_CONFIGS), park: false };
    const next = toggleKindVisibility(vis, "park");
    expect(next.park).toBe(true);
  });

  it("does not mutate the input state", () => {
    const vis = buildDefaultVisibility(MAP_KIND_CONFIGS);
    const copy = { ...vis };
    toggleKindVisibility(vis, "park");
    expect(vis).toEqual(copy);
  });

  it("only changes the targeted kind", () => {
    const vis = buildDefaultVisibility(MAP_KIND_CONFIGS);
    const next = toggleKindVisibility(vis, "greenway");
    const unchanged = MAP_KIND_CONFIGS.filter((c) => c.kind !== "greenway");
    unchanged.forEach((c) => {
      expect(next[c.kind]).toBe(vis[c.kind]);
    });
  });
});

// ---------------------------------------------------------------------------
// getKindConfig
// ---------------------------------------------------------------------------

describe("getKindConfig", () => {
  it("returns the config for a known kind", () => {
    const config = getKindConfig("park");
    expect(config).toBeDefined();
    expect(config?.kind).toBe("park");
  });

  it("returns undefined for an unknown kind", () => {
    expect(getKindConfig("does-not-exist")).toBeUndefined();
  });

  it("returns the greenway config correctly", () => {
    const config = getKindConfig("greenway");
    expect(config?.layerType).toBe("line");
    expect(config?.label).toBe("Greenways");
  });
});
