import { describe, expect, it } from "vitest";

import { escapeMd, isVerifyOnlyChange, renderDiff } from "./diff";

describe("renderDiff", () => {
  it("renders changed primitives as before → after", () => {
    expect(renderDiff({ lengthMiles: 16.4 }, { lengthMiles: 19.3 })).toContain(
      "`lengthMiles`: 16.4 → 19.3",
    );
  });
  it("returns (no changes) when nothing changed", () => {
    expect(renderDiff({ a: 1 }, { a: 1 })).toBe("(no changes)");
  });
  it("identifies added object-array entries by name", () => {
    const before = { pointsOfInterest: [{ name: "Restroom", lat: 0, lng: 0 }] };
    const after = {
      pointsOfInterest: [
        { name: "Restroom", lat: 0, lng: 0 },
        { name: "Water", lat: 1, lng: 1 },
      ],
    };
    expect(renderDiff(before, after)).toMatch(
      /pointsOfInterest.*added \[Water\]/,
    );
  });
  it("identifies removed object-array entries", () => {
    const before = {
      trailheads: [
        { name: "A", lat: 0, lng: 0 },
        { name: "B", lat: 1, lng: 1 },
      ],
    };
    const after = { trailheads: [{ name: "A", lat: 0, lng: 0 }] };
    expect(renderDiff(before, after)).toMatch(/trailheads.*removed \[B\]/);
  });
  it("identifies modified object-array entries", () => {
    const before = {
      photos: [{ url: "https://x", caption: "old", attribution: "u" }],
    };
    const after = {
      photos: [{ url: "https://x", caption: "new", attribution: "u" }],
    };
    expect(renderDiff(before, after)).toMatch(
      /photos.*modified \[https:\/\/x\]/,
    );
  });
  it("falls back to length-only diff for arrays of primitives", () => {
    expect(renderDiff({ tags: ["a"] }, { tags: ["a", "b"] })).toMatch(
      /added 1 entr/,
    );
  });
});

describe("escapeMd", () => {
  it("escapes markdown-significant characters", () => {
    expect(escapeMd("hello [world](evil)")).toContain("\\[");
    expect(escapeMd("**bold**")).toContain("\\*");
  });
  it("returns empty string for empty input", () => {
    expect(escapeMd("")).toBe("");
  });
});

describe("isVerifyOnlyChange", () => {
  it("returns true when only lastVerified changes", () => {
    expect(
      isVerifyOnlyChange(
        { name: "X", lastVerified: "2026-01-01" },
        { name: "X", lastVerified: "2026-05-20" },
      ),
    ).toBe(true);
  });
  it("returns false when name also changes", () => {
    expect(
      isVerifyOnlyChange(
        { name: "X", lastVerified: "2026-01-01" },
        { name: "Y", lastVerified: "2026-05-20" },
      ),
    ).toBe(false);
  });
  it("returns false when lastVerified doesn't change", () => {
    expect(
      isVerifyOnlyChange(
        { name: "X", lastVerified: "2026-05-20" },
        { name: "X", lastVerified: "2026-05-20" },
      ),
    ).toBe(false);
  });
  it("returns false when adding a new field", () => {
    expect(
      isVerifyOnlyChange(
        { lastVerified: "2026-01-01" },
        { lastVerified: "2026-05-20", description: "added" },
      ),
    ).toBe(false);
  });
});
