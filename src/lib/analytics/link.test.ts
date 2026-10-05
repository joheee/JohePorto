import { describe, expect, it } from "vitest";
import { buildTrackedLink, LINK_PRESETS } from "./link";

const base = "https://www.johe.my.id";

describe("buildTrackedLink", () => {
  it("adds the tags to the home page address", () => {
    expect(buildTrackedLink(base, { source: "linkedin", medium: "social", campaign: "cv-2026" })).toBe("https://www.johe.my.id/?utm_source=linkedin&utm_medium=social&utm_campaign=cv-2026");
  });
  it("leaves out the tags that are empty", () => {
    expect(buildTrackedLink(base, { source: "upwork" })).toBe("https://www.johe.my.id/?utm_source=upwork");
    expect(buildTrackedLink(base, { source: "upwork", medium: "  ", campaign: "" })).toBe("https://www.johe.my.id/?utm_source=upwork");
  });
  it("cleans the tags the way the server does, so what you type is what is counted", () => {
    expect(buildTrackedLink(base, { source: "LinkedIn CV!", medium: "Social" })).toBe("https://www.johe.my.id/?utm_source=linkedin-cv&utm_medium=social");
  });
  it("is just the address when there is no source (the other tags mean nothing alone)", () => {
    expect(buildTrackedLink(base, { source: "", medium: "social", campaign: "x" })).toBe("https://www.johe.my.id/");
  });
  it("replaces anything after the host, and copes with a local address and a bad one", () => {
    expect(buildTrackedLink("https://www.johe.my.id/some/path?x=1", { source: "a" })).toBe("https://www.johe.my.id/?utm_source=a");
    expect(buildTrackedLink("http://localhost:3000", { source: "a" })).toBe("http://localhost:3000/?utm_source=a");
    expect(buildTrackedLink("not a url", { source: "a" })).toBe("not a url");
  });
});

describe("LINK_PRESETS", () => {
  it("only uses tags the cleaner would keep as they are", () => {
    for (const p of LINK_PRESETS) expect(buildTrackedLink(base, { source: p.source, medium: p.medium })).toContain(`utm_source=${p.source}&utm_medium=${p.medium}`);
  });
});
