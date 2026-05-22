import { describe, expect, it } from "vitest";

import { containsObjectionableContent } from "./content-filter";

describe("containsObjectionableContent", () => {
  it("returns no violation for clean input", () => {
    const r = containsObjectionableContent({
      displayName: "Kai",
      note: "Updated trail length after walking it",
      patch: { description: "A scenic greenway through the city" },
    });
    expect(r.violation).toBe(false);
  });
  it("flags profanity in note", () => {
    const r = containsObjectionableContent({
      displayName: "Kai",
      note: "this is fucking great",
      patch: {},
    });
    expect(r.violation).toBe(true);
    expect(r.reason).toBe("profanity");
  });
  it("flags SSN-shaped strings", () => {
    const r = containsObjectionableContent({
      displayName: "Kai",
      note: "owner phone 123-45-6789",
      patch: {},
    });
    expect(r.violation).toBe(true);
    expect(r.reason).toMatch(/identif/i);
  });
  it("flags email addresses", () => {
    const r = containsObjectionableContent({
      displayName: "Kai",
      note: "contact kai@example.com",
      patch: {},
    });
    expect(r.violation).toBe(true);
  });
  it("flags US phone numbers", () => {
    const r = containsObjectionableContent({
      displayName: "Kai",
      note: "call 555-123-4567",
      patch: {},
    });
    expect(r.violation).toBe(true);
  });
  it("checks all string fields of the patch", () => {
    const r = containsObjectionableContent({
      displayName: "Kai",
      note: "",
      patch: { description: "this trail is awesome", note: "fuck you" },
    });
    expect(r.violation).toBe(true);
  });
  it("ignores non-string patch fields", () => {
    const r = containsObjectionableContent({
      displayName: "Kai",
      note: "",
      patch: { lengthMiles: 5.2, surface: "paved" },
    });
    expect(r.violation).toBe(false);
  });
  // P2-4: recurse into nested objects and arrays
  it("flags PII nested inside an array of objects (trailheads)", () => {
    const r = containsObjectionableContent({
      displayName: "Kai",
      note: "",
      patch: {
        trailheads: [{ name: "555-123-4567 entrance" }],
      },
    });
    expect(r.violation).toBe(true);
  });
  it("flags PII nested in a deeply nested object", () => {
    const r = containsObjectionableContent({
      displayName: "Kai",
      note: "",
      patch: {
        info: { contact: { email: "owner@private.com" } },
      },
    });
    expect(r.violation).toBe(true);
  });
  it("returns clean for nested object with clean strings", () => {
    const r = containsObjectionableContent({
      displayName: "Kai",
      note: "",
      patch: {
        trailheads: [{ name: "Main Entrance", lat: 35.2, lng: -80.84 }],
      },
    });
    expect(r.violation).toBe(false);
  });
});
