import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "map.tsx"), "utf-8");

describe("greenway hit area layer", () => {
  it("defines an invisible hit area layer with >= 44px width", () => {
    const hitAreaMatch = src.match(
      /id:\s*["']greenway-hit-area["'][\s\S]*?"line-width":\s*(\d+)/,
    );
    expect(hitAreaMatch).not.toBeNull();
    expect(Number(hitAreaMatch![1])).toBeGreaterThanOrEqual(44);
  });

  it("hit area layer has zero opacity so it is invisible", () => {
    const opacityMatch = src.match(
      /id:\s*["']greenway-hit-area["'][\s\S]*?"line-opacity":\s*([\d.]+)/,
    );
    expect(opacityMatch).not.toBeNull();
    expect(Number(opacityMatch![1])).toBe(0);
  });

  it("hit area layer is added before the visible greenway-lines layer", () => {
    const hitIdx = src.indexOf('"greenway-hit-area"');
    const lineIdx = src.indexOf('"greenway-lines"');
    expect(hitIdx).toBeGreaterThan(-1);
    expect(lineIdx).toBeGreaterThan(-1);
    expect(hitIdx).toBeLessThan(lineIdx);
  });

  it("visible greenway-lines layer stays at 3px width", () => {
    const lineBlock = src.slice(src.indexOf('"greenway-lines"'));
    const widthMatch = lineBlock.match(/"line-width":\s*(\d+)/);
    expect(widthMatch).not.toBeNull();
    expect(Number(widthMatch![1])).toBe(3);
  });

  it("click handler targets hit area layer, not visible line", () => {
    expect(src).toContain('on("click", "greenway-hit-area"');
    expect(src).not.toContain('on("click", "greenway-lines"');
  });

  it("mouseenter/mouseleave target hit area layer, not visible line", () => {
    expect(src).toContain('on("mouseenter", "greenway-hit-area"');
    expect(src).toContain('on("mouseleave", "greenway-hit-area"');
    expect(src).not.toContain('on("mouseenter", "greenway-lines"');
    expect(src).not.toContain('on("mouseleave", "greenway-lines"');
  });
});
