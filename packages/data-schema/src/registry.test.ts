import { describe, expect, it } from "vitest";
import { ENTITY_REGISTRY } from "./registry";

describe("ENTITY_REGISTRY", () => {
  it("contains all registered entities", () => {
    expect(Object.keys(ENTITY_REGISTRY)).toEqual([
      "greenway",
      "deal",
      "parking",
      "park",
      "recycling",
      "transit-parking",
      "ev-charging",
      "landfill",
      "amenity",
    ]);
  });
  it("greenway dataPath formats correctly", () => {
    expect(ENTITY_REGISTRY.greenway.dataPath("little-sugar-creek")).toBe("data/greenways/little-sugar-creek.json");
  });
  it("deal branchPrefix formats correctly", () => {
    expect(ENTITY_REGISTRY.deal.branchPrefix("tue-wine")).toBe("community/deal-tue-wine");
  });
  it("parking displayLabel uses lot name", () => {
    const lot = { name: "7th St Deck" } as any;
    expect(ENTITY_REGISTRY.parking.displayLabel(lot)).toBe("7th St Deck");
  });
  it("greenway displayLabel uses name field", () => {
    const greenway = { name: "Little Sugar Creek Greenway" } as any;
    expect(ENTITY_REGISTRY.greenway.displayLabel(greenway)).toBe("Little Sugar Creek Greenway");
  });
  it("deal displayLabel uses restaurantName + ' deal'", () => {
    const deal = { restaurantName: "Common Market" } as any;
    expect(ENTITY_REGISTRY.deal.displayLabel(deal)).toBe("Common Market deal");
  });
  it("greenway branchPrefix formats correctly", () => {
    expect(ENTITY_REGISTRY.greenway.branchPrefix("little-sugar-creek")).toBe("community/greenway-little-sugar-creek");
  });
  it("parking dataPath formats correctly", () => {
    expect(ENTITY_REGISTRY.parking.dataPath("7th-st-station-deck")).toBe("data/parking/7th-st-station-deck.json");
  });
  it("deal dataPath formats correctly", () => {
    expect(ENTITY_REGISTRY.deal.dataPath("tue-wine")).toBe("data/deals/tue-wine.json");
  });
  it("each entity has schema and patchSchema", () => {
    for (const entity of Object.values(ENTITY_REGISTRY)) {
      expect(entity.schema).toBeDefined();
      expect(entity.patchSchema).toBeDefined();
    }
  });
});
