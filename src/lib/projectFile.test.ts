import { describe, expect, it } from "vitest";
import { cloneCommand, projectFileName } from "./projectFile";

describe("projectFileName", () => {
  it("uses the extension of the first known technology in the stack", () => {
    expect(projectFileName("aws-base", ["AWS", "Terraform"])).toBe("aws-base.tf"); // AWS is not a file type: skipped
    expect(projectFileName("k8s-delivery", ["K3s", "Helm Chart", "Terraform"])).toBe("k8s-delivery.yaml");
    expect(projectFileName("backup", ["Bash Script", "PostgreSQL"])).toBe("backup.sh");
  });
  it("matches spellings the way the skill catalog does", () => {
    expect(projectFileName("x", ["Golang"])).toBe("x.go");
    expect(projectFileName("x", ["Type-Script"])).toBe("x.ts"); // punctuation and case do not matter
    expect(projectFileName("x", ["TypeScript"])).toBe("x.ts");
    expect(projectFileName("x", ["PostgreSQL"])).toBe("x.sql");
  });
  it("falls back to a README", () => {
    expect(projectFileName("notes", [])).toBe("notes.md");
    expect(projectFileName("notes", ["Zabbix"])).toBe("notes.md");
  });
});

describe("cloneCommand", () => {
  it("builds the command for a GitHub, GitLab or Bitbucket repository", () => {
    expect(cloneCommand([{ href: "https://github.com/joheee/aws-base" }])).toBe("git clone https://github.com/joheee/aws-base.git");
    expect(cloneCommand([{ href: "https://www.gitlab.com/team/repo/" }])).toBe("git clone https://gitlab.com/team/repo.git");
    expect(cloneCommand([{ href: "https://bitbucket.org/a/b.git" }])).toBe("git clone https://bitbucket.org/a/b.git");
  });
  it("uses the first link that is a repository", () => {
    expect(cloneCommand([{ href: "https://demo.example.com" }, { href: "https://github.com/a/b" }, { href: "https://github.com/c/d" }])).toBe(
      "git clone https://github.com/a/b.git",
    );
  });
  it("returns null for anything that is not an owner/repo page", () => {
    expect(cloneCommand([])).toBeNull();
    expect(cloneCommand([{ href: "https://example.com/a/b" }])).toBeNull();
    expect(cloneCommand([{ href: "https://github.com/joheee" }])).toBeNull(); // a profile
    expect(cloneCommand([{ href: "https://github.com/a/b/tree/main" }])).toBeNull(); // deeper than the repository
    expect(cloneCommand([{ href: "not a url" }])).toBeNull();
  });
});
