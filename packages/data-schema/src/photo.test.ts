import { describe, expect, it } from "vitest";
import { PhotoSchema } from "./photo";

const validPhoto = {
  url: "https://example.com/photo.jpg",
  caption: "Trail in spring",
  attribution: "Jane Doe",
};

describe("PhotoSchema", () => {
  it("accepts a valid photo", () => {
    const result = PhotoSchema.safeParse(validPhoto);
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL", () => {
    const result = PhotoSchema.safeParse({ ...validPhoto, url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects missing caption", () => {
    const { caption: _c, ...withoutCaption } = validPhoto;
    const result = PhotoSchema.safeParse(withoutCaption);
    expect(result.success).toBe(false);
  });

  it("rejects missing attribution", () => {
    const { attribution: _a, ...withoutAttribution } = validPhoto;
    const result = PhotoSchema.safeParse(withoutAttribution);
    expect(result.success).toBe(false);
  });
});
