import { describe, expect, it } from "vitest";
import { classifyLink } from "./classify";

const own = "www.johe.my.id";

describe("classifyLink", () => {
  it("counts a click on the resume, wherever it is linked from", () => {
    expect(classifyLink({ href: "/resume.pdf", ownHost: own })).toBe("resume");
    expect(classifyLink({ href: "https://www.johe.my.id/resume.pdf", ownHost: own })).toBe("resume");
    expect(classifyLink({ href: "https://johe.my.id/resume.pdf", ownHost: own })).toBe("resume"); // with or without www
  });

  it("ignores links inside the site", () => {
    expect(classifyLink({ href: "/#about", ownHost: own })).toBeNull();
    expect(classifyLink({ href: "https://www.johe.my.id/admin", ownHost: own })).toBeNull();
  });

  it("names the social links by site", () => {
    expect(classifyLink({ href: "https://github.com/joheee", ownHost: own })).toBe("social.github");
    expect(classifyLink({ href: "http://www.linkedin.com/in/jo/", ownHost: own })).toBe("social.linkedin");
    expect(classifyLink({ href: "https://www.upwork.com/freelancers/~01", ownHost: own })).toBe("social.upwork");
    expect(classifyLink({ href: "https://dev.to/jo", ownHost: own })).toBe("social.other");
  });

  it("counts a link inside a project card for that project, even when it points at GitHub", () => {
    expect(classifyLink({ href: "https://github.com/joheee/AwsBaseInfra", ownHost: own, projectSlug: "aws-base" })).toBe("project.aws-base");
  });

  it("does not count the 'view on linkedin.com' link under a review as a click on your profile", () => {
    expect(classifyLink({ href: "https://www.linkedin.com/in/jane/", ownHost: own, inReviews: true })).toBeNull();
  });

  it("ignores mailto and other non-web links, and links it cannot read", () => {
    expect(classifyLink({ href: "mailto:jo@example.com", ownHost: own })).toBeNull();
    expect(classifyLink({ href: "tel:+62123", ownHost: own })).toBeNull();
    expect(classifyLink({ href: "http://[bad", ownHost: own })).toBeNull();
  });
});
