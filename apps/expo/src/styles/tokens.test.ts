import { describe, expect, it } from "vitest";

import { fonts, type } from "./tokens";

describe("font tokens", () => {
  it("display font uses Barlow Condensed", () => {
    expect(fonts.display).toBe("BarlowCondensed_700Bold");
  });

  it("body font uses Source Serif 4 regular", () => {
    expect(fonts.body).toBe("SourceSerif4_400Regular");
  });

  it("body medium uses Source Serif 4 medium", () => {
    expect(fonts.bodyMed).toBe("SourceSerif4_500Medium");
  });

  it("body bold uses Source Serif 4 semibold", () => {
    expect(fonts.bodyBold).toBe("SourceSerif4_600SemiBold");
  });

  it("does not reference Antonio or Inter", () => {
    const allFonts = Object.values(fonts).join(" ");
    expect(allFonts).not.toContain("Antonio");
    expect(allFonts).not.toContain("Inter");
  });
});

describe("type ramp", () => {
  it("display tokens use the display font family", () => {
    expect(type.displayLg.fontFamily).toBe(fonts.display);
    expect(type.displayMd.fontFamily).toBe(fonts.display);
  });

  it("heading tokens use the bold body font", () => {
    expect(type.headingLg.fontFamily).toBe(fonts.bodyBold);
    expect(type.headingMd.fontFamily).toBe(fonts.bodyBold);
  });

  it("body tokens use the regular body font", () => {
    expect(type.bodyLg.fontFamily).toBe(fonts.body);
    expect(type.bodyMd.fontFamily).toBe(fonts.body);
    expect(type.bodySm.fontFamily).toBe(fonts.body);
  });

  it("body-xs uses medium weight for labels", () => {
    expect(type.bodyXs.fontFamily).toBe(fonts.bodyMed);
  });

  it("all font sizes are at least 12px", () => {
    const sizes = Object.values(type).map((t) => t.fontSize);
    sizes.forEach((size) => {
      expect(size).toBeGreaterThanOrEqual(12);
    });
  });
});
