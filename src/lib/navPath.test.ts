import { describe, expect, it } from "vitest";
import { adminPath, blogPath, sectionPath, shellUser } from "./navPath";

describe("shellUser", () => {
  it("lower-cases the whole name and turns spaces into hyphens", () => {
    expect(shellUser("Johevin Blesstowi")).toBe("johevin-blesstowi");
    expect(shellUser("Ada Lovelace")).toBe("ada-lovelace");
  });
  it("treats any run of spaces, tabs or line breaks as one hyphen, and ignores the ends", () => {
    expect(shellUser("  Ada   Lovelace ")).toBe("ada-lovelace");
    expect(shellUser("Ada\tKing\nLovelace")).toBe("ada-king-lovelace");
  });
  it("leaves other characters as they are", () => {
    expect(shellUser("Zoë-Marie O'Neil")).toBe("zoë-marie-o'neil");
  });
  it("falls back to visitor for a blank name", () => {
    expect(shellUser("")).toBe("visitor");
    expect(shellUser("   ")).toBe("visitor");
  });
});

describe("sectionPath", () => {
  it("is the home directory at the top of the page", () => {
    expect(sectionPath(null)).toBe("~");
    expect(sectionPath("hero")).toBe("~");
  });
  it("is a folder for every other section", () => {
    expect(sectionPath("about")).toBe("~/about");
    expect(sectionPath("experience")).toBe("~/experience");
  });
});

describe("adminPath", () => {
  it("is the page you are on inside the admin", () => {
    expect(adminPath("/admin")).toBe("~/admin");
    expect(adminPath("/admin/messages")).toBe("~/admin/messages");
    expect(adminPath("/admin/messages/")).toBe("~/admin/messages");
  });
  it("leaves /admin/site to the section path, the login page to the public look, and other pages alone", () => {
    expect(adminPath("/admin/site")).toBeNull();
    expect(adminPath("/admin/login")).toBeNull();
    expect(adminPath("/")).toBeNull();
    expect(adminPath("/administrator")).toBeNull(); // not under /admin/
  });
});

describe("blogPath", () => {
  it("is the blog and each post under it", () => {
    expect(blogPath("/blog")).toBe("~/blog");
    expect(blogPath("/blog/")).toBe("~/blog");
    expect(blogPath("/blog/my-post")).toBe("~/blog/my-post");
  });
  it("is null elsewhere", () => {
    expect(blogPath("/")).toBeNull();
    expect(blogPath("/blogger")).toBeNull();
    expect(blogPath("/admin/blogs")).toBeNull();
  });
});
