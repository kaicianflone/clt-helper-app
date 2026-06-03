import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "page.tsx"), "utf-8");

describe("onboarding redirects", () => {
  it("sends finished/returning users to the app home at /today", () => {
    expect(src).toContain('router.replace("/today")');
    expect(src).not.toContain('router.replace("/")');
  });
});
