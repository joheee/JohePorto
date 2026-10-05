import { describe, expect, it } from "vitest";
import { navLinks, publicNavLinks, siteSectionLinks } from "./content";

describe("publicNavLinks", () => {
  it("is the normal list when there are no reviews, so no link points at a missing section", () => {
    expect(publicNavLinks(false).map((l) => l.label)).toEqual(["About", "Projects", "Experience", "Contact"]);
    expect(publicNavLinks(false)).toBe(navLinks);
  });
  it("puts Reviews before Contact when the section exists", () => {
    expect(publicNavLinks(true).map((l) => l.label)).toEqual(["About", "Projects", "Experience", "Reviews", "Contact"]);
    expect(publicNavLinks(true).find((l) => l.label === "Reviews")?.href).toBe("/#reviews");
  });
});

describe("siteSectionLinks (the editor always has the Reviews section)", () => {
  it("lists Reviews before Contact", () => {
    expect(siteSectionLinks.map((l) => l.label)).toEqual(["About", "Projects", "Experience", "Reviews", "Contact"]);
  });
});
