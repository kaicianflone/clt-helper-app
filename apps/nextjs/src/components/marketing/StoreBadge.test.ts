// apps/nextjs/src/components/marketing/StoreBadge.test.ts
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const root = resolve(__dirname, "../../../public/badges");

describe("StoreBadge", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function render() {
    const { StoreBadge } = await import("./StoreBadge");
    return renderToStaticMarkup(createElement(StoreBadge));
  }

  it("ships the official App Store badge", () => {
    expect(existsSync(resolve(root, "app-store.svg"))).toBe(true);
  });

  it("shows Coming soon by default", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_STORE_URL", "");
    const html = await render();
    expect(html).toContain("Coming soon to the App Store");
    expect(html).not.toContain("<a ");
  });

  it("switches to the App Store badge link when the URL is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_STORE_URL", "https://apps.apple.com/app/id1");
    const html = await render();
    expect(html).toContain('href="https://apps.apple.com/app/id1"');
    expect(html).toContain("Download on the App Store");
    expect(html).not.toContain("Coming soon");
  });
});
