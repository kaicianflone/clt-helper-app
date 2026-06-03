// apps/nextjs/src/app/today/page.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "page.tsx"), "utf-8");

describe("/today (app home)", () => {
  it("renders the recently-updated activity feed", () => {
    expect(src).toContain("Recently updated");
    expect(src).toContain("activity.recent()");
  });

  it("fires the first-visit onboarding redirect", () => {
    expect(src).toContain("OnboardingRedirect");
  });
});
