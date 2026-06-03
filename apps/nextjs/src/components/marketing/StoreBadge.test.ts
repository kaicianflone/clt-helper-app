// apps/nextjs/src/components/marketing/StoreBadge.test.ts
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../../public/badges");

describe("StoreBadge assets", () => {
  it("ships the official App Store badge", () => {
    expect(existsSync(resolve(root, "app-store.svg"))).toBe(true);
  });

  it("ships the official Google Play badge", () => {
    expect(existsSync(resolve(root, "google-play.png"))).toBe(true);
  });
});
