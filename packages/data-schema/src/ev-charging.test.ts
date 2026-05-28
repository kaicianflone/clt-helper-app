import { describe, expect, it } from "vitest";
import { EvChargingSchema, EvChargingPatchSchema } from "./ev-charging";

const validEvCharging = {
  slug: "uptown-ev-station",
  name: "Uptown EV Charging Station",
  description: "Public EV charging near the NASCAR Hall of Fame.",
  center: { lat: 35.2271, lng: -80.8431 },
  address: "400 E Martin Luther King Jr Blvd, Charlotte, NC 28202",
  photos: [],
  lastVerified: "2026-05-15",
};

describe("EvChargingSchema", () => {
  it("accepts a valid EV charging location", () => {
    const result = EvChargingSchema.safeParse(validEvCharging);
    expect(result.success).toBe(true);
  });

  it("accepts optional numLevel2Ports, numDcFastPorts, networks, freeCharging", () => {
    const result = EvChargingSchema.safeParse({
      ...validEvCharging,
      numLevel2Ports: 4,
      numDcFastPorts: 2,
      networks: ["ChargePoint", "EVgo"],
      freeCharging: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts with photos", () => {
    const result = EvChargingSchema.safeParse({
      ...validEvCharging,
      photos: [
        { url: "https://example.com/ev.jpg", caption: "Charger", attribution: "CLT" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative numLevel2Ports", () => {
    const result = EvChargingSchema.safeParse({ ...validEvCharging, numLevel2Ports: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug (spaces)", () => {
    const result = EvChargingSchema.safeParse({ ...validEvCharging, slug: "uptown ev station" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed lastVerified", () => {
    const result = EvChargingSchema.safeParse({ ...validEvCharging, lastVerified: "15-05-2026" });
    expect(result.success).toBe(false);
  });
});

describe("EvChargingPatchSchema", () => {
  it("accepts partial patch with slug and freeCharging", () => {
    const result = EvChargingPatchSchema.safeParse({
      slug: "uptown-ev-station",
      freeCharging: true,
    });
    expect(result.success).toBe(true);
  });

  it("requires slug", () => {
    const result = EvChargingPatchSchema.safeParse({ freeCharging: true });
    expect(result.success).toBe(false);
  });
});
