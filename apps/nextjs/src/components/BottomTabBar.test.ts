import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "BottomTabBar.tsx"), "utf-8");

describe("BottomTabBar", () => {
  it("uses min-h-16 so safe-area padding can grow the bar", () => {
    expect(src).toContain("min-h-16");
    expect(src).not.toMatch(/(?<!min-)h-16/);
  });

  it("applies safe-area bottom padding for notch devices", () => {
    expect(src).toContain("pb-[env(safe-area-inset-bottom)]");
  });

  it("has aria-label on the nav element", () => {
    expect(src).toContain('aria-label="Mobile navigation"');
  });

  it("hides on desktop with md:hidden", () => {
    expect(src).toContain("md:hidden");
  });

  it("crown home link exists with href='/'", () => {
    expect(src).toContain('href="/"');
  });

  it("crown link has aria-label='Home'", () => {
    expect(src).toContain('aria-label="Home"');
  });

  it("CrownIcon is imported and used", () => {
    expect(src).toContain('from "~/components/CrownIcon"');
    expect(src).toContain("<CrownIcon");
  });
});
