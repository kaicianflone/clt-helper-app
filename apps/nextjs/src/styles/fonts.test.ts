import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const tokensCSS = readFileSync(resolve(__dirname, "tokens.css"), "utf-8");
const stylesCSS = readFileSync(
  resolve(__dirname, "../app/styles.css"),
  "utf-8",
);
const fontsTS = readFileSync(resolve(__dirname, "fonts.ts"), "utf-8");

describe("web font configuration", () => {
  it("tokens.css references Barlow Condensed for display", () => {
    expect(tokensCSS).toContain('"Barlow Condensed"');
  });

  it("tokens.css references Source Serif 4 for body", () => {
    expect(tokensCSS).toContain('"Source Serif 4"');
  });

  it("tokens.css does not reference Antonio", () => {
    expect(tokensCSS).not.toContain('"Antonio"');
  });

  it("tokens.css does not reference Inter as body font", () => {
    expect(tokensCSS).not.toMatch(/--font-body:.*"Inter"/);
  });

  it("styles.css Tailwind theme uses barlow-condensed variable for display", () => {
    expect(stylesCSS).toContain("--font-barlow-condensed");
  });

  it("styles.css Tailwind theme uses source-serif variable for sans", () => {
    expect(stylesCSS).toContain("--font-source-serif");
  });

  it("fonts.ts imports Barlow_Condensed from next/font/google", () => {
    expect(fontsTS).toContain("Barlow_Condensed");
  });

  it("fonts.ts imports Source_Serif_4 from next/font/google", () => {
    expect(fontsTS).toContain("Source_Serif_4");
  });

  it("body font falls back to Georgia serif, not system-ui sans", () => {
    expect(tokensCSS).toMatch(/--font-body:.*Georgia.*serif/);
  });
});
