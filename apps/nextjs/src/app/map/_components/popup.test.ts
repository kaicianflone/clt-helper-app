import { describe, expect, it } from "vitest";

import { buildPopupHtml, escapeHtml } from "./popup";

describe("escapeHtml", () => {
  it("escapes the five XSS-relevant characters", () => {
    expect(escapeHtml("<script>alert('x')</script>")).toBe(
      "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;"
    );
  });

  it("escapes ampersand first to avoid double-encoding", () => {
    expect(escapeHtml("A & B < C")).toBe("A &amp; B &lt; C");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hi"')).toBe("say &quot;hi&quot;");
  });

  it("returns plain strings unchanged", () => {
    expect(escapeHtml("Antiquity Greenway")).toBe("Antiquity Greenway");
  });
});

describe("buildPopupHtml", () => {
  it("renders all fields when present", () => {
    const html = buildPopupHtml({
      slug: "antiquity-greenway",
      name: "Antiquity Greenway",
      lengthMiles: 0.7,
      surface: "paved",
      trailheadCount: 2,
      lastVerified: "2026-05-20",
    });
    expect(html).toContain("Antiquity Greenway");
    expect(html).toContain("0.7 mi");
    expect(html).toContain("paved");
    expect(html).toContain("2 trailheads");
    expect(html).toContain('href="/greenways/antiquity-greenway"');
    expect(html).toContain("View details");
  });

  it("uses singular trailhead when count is 1", () => {
    const html = buildPopupHtml({
      slug: "x",
      name: "X",
      trailheadCount: 1,
    });
    expect(html).toContain("1 trailhead");
    expect(html).not.toContain("1 trailheads");
  });

  it("omits length·surface line when both are missing", () => {
    const html = buildPopupHtml({ slug: "x", name: "X" });
    expect(html).not.toContain(" mi");
    expect(html).not.toContain('class="text-sm mt-1"');
  });

  it("omits trailhead line when count is missing", () => {
    const html = buildPopupHtml({
      slug: "x",
      name: "X",
      lengthMiles: 1,
      surface: "paved",
    });
    expect(html).not.toContain("trailhead");
  });

  it("escapes XSS in name field", () => {
    const html = buildPopupHtml({
      slug: "x",
      name: "<img src=x onerror=alert(1)>",
    });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("escapes XSS in slug field (URL path)", () => {
    const html = buildPopupHtml({
      slug: '"><script>alert(1)</script>',
      name: "X",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
  });

  it("escapes XSS in surface field", () => {
    const html = buildPopupHtml({
      slug: "x",
      name: "X",
      surface: "<b>paved</b>",
    });
    expect(html).not.toContain("<b>paved</b>");
    expect(html).toContain("&lt;b&gt;paved&lt;/b&gt;");
  });

  it("falls back to 'Greenway' when name is missing", () => {
    const html = buildPopupHtml({ slug: "x" });
    expect(html).toContain(">Greenway<");
  });
});
