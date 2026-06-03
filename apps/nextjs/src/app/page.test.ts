// apps/nextjs/src/app/page.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "page.tsx"), "utf-8");

describe("marketing landing /", () => {
  it("composes all five landing sections", () => {
    for (const section of [
      "MarketingHeader",
      "Hero",
      "DomainColumns",
      "CommunityStory",
      "DownloadFooter",
    ]) {
      expect(src).toContain(section);
    }
  });

  it("wraps scrolled sections in Reveal", () => {
    expect(src).toContain("<Reveal>");
  });

  it("loads the marketing motion stylesheet", () => {
    expect(src).toContain('"~/styles/marketing.css"');
  });

  it("no longer renders the app activity feed at /", () => {
    expect(src).not.toContain("activity.recent()");
  });
});
