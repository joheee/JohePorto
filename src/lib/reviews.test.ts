import { describe, expect, it } from "vitest";
import { initials, linkHost } from "./reviews";

describe("initials", () => {
  it("takes the first letter of the first two words, in capitals", () => {
    expect(initials("Jane Doe")).toBe("JD");
    expect(initials("ada king lovelace")).toBe("AK");
    expect(initials("  Jane   Doe ")).toBe("JD");
  });
  it("uses one letter for a single name", () => {
    expect(initials("Madonna")).toBe("M");
  });
  it("handles letters outside plain ASCII, and falls back to ? for nothing", () => {
    expect(initials("élodie Ñandú")).toBe("ÉÑ");
    expect(initials("")).toBe("?");
    expect(initials("   ")).toBe("?");
  });
});

describe("linkHost", () => {
  it("shows the site the link points to, without www", () => {
    expect(linkHost("https://www.linkedin.com/in/jane-doe/")).toBe("linkedin.com");
    expect(linkHost("https://upwork.com/freelancers/~01abc")).toBe("upwork.com");
  });
  it("falls back to source when it is not a URL", () => {
    expect(linkHost("not a url")).toBe("source");
    expect(linkHost("")).toBe("source");
  });
});
