import { describe, expect, it } from "vitest";
import { complete, runCommand, type TerminalData } from "./terminal";

const data: TerminalData = {
  user: "jo-doe",
  name: "Jo Doe",
  email: "jo@example.com",
  location: "Jakarta",
  status: "Open for projects",
  roles: ["DevOps Engineer", "Cloud Engineer"],
  pitch: "I ship things.",
  bio: ["First.", "Second."],
  skillGroups: [{ name: "DevOps Tools", items: ["Terraform", "Docker"] }],
  socials: [{ label: "GitHub", href: "https://github.com/jo" }],
  experience: [{ role: "SRE", company: "Acme", period: "Jan 2024 – Present" }],
  projects: [{ slug: "aws-base", title: "AWS Base", year: 2026 }],
};
const ctx = { theme: "aura-soft-dark", history: ["help"], now: new Date("2026-10-07T10:00:00") };
const run = (s: string) => runCommand(s, data, ctx);
const text = (s: string) => run(s).lines.map((l) => l.text).join("\n");

describe("runCommand", () => {
  it("prints nothing for an empty line", () => expect(run("   ").lines).toEqual([]));
  it("lists commands in help", () => expect(text("help")).toContain("kubectl get skills"));
  it("whoami shows the user, and the roles with --role", () => {
    expect(text("whoami")).toContain("jo-doe");
    expect(text("whoami --role")).toBe("DevOps Engineer | Cloud Engineer");
  });
  it("cat reads the profile files", () => {
    expect(text("cat pitch.txt")).toBe("I ship things.");
    expect(text("cat about.md")).toBe("First.\n\nSecond.");
    expect(text("cat skills.yaml")).toContain("devops_tools:\n  - Terraform");
    expect(text("cat contact.txt")).toContain("github: https://github.com/jo");
  });
  it("cat reports a missing file or operand", () => {
    expect(run("cat nope").lines[0].tone).toBe("err");
    expect(text("cat")).toContain("missing file operand");
  });
  it("lists files and projects", () => {
    expect(text("ls")).toContain("pitch.txt");
    expect(text("ls projects")).toBe("aws-base");
  });
  it("prints skills and projects tables", () => {
    expect(text("kubectl get skills")).toMatch(/Terraform\s+DevOps Tools/);
    expect(text("kubectl get projects")).toMatch(/aws-base\s+2026/);
    expect(text("kubectl get pods")).toContain("No resources found");
    expect(run("kubectl get nope").lines[0].tone).toBe("err");
  });
  it("shows where you worked with git log", () => expect(text("git log --oneline")).toContain("SRE @ Acme"));
  it("keeps every output line within the terminal width", () => {
    for (const c of ["help", "kubectl get skills", "kubectl get projects", "theme"]) {
      for (const l of run(c).lines) expect(l.text.length).toBeLessThanOrEqual(44);
    }
  });
  it("switches theme by id or name, marks the current one in the list", () => {
    expect(run("theme dracula").effect).toEqual({ kind: "theme", id: "dracula" });
    expect(run("theme Tokyo Night").effect).toEqual({ kind: "theme", id: "tokyo-night" });
    expect(text("theme")).toContain("* aura-soft-dark");
    expect(run("theme nope").lines[0].tone).toBe("err");
  });
  it("cd scrolls to a section, and refuses unknown ones", () => {
    expect(run("cd projects").effect).toEqual({ kind: "scroll", id: "projects" });
    expect(run("cd ~").effect).toEqual({ kind: "scroll", id: "hero" });
    expect(run("cd nowhere").lines[0].tone).toBe("err");
  });
  it("open handles the resume and social links", () => {
    expect(run("open resume").effect).toEqual({ kind: "open", href: "/resume.pdf" });
    expect(run("open github").effect).toEqual({ kind: "open", href: "https://github.com/jo" });
    expect(run("open nope").lines[0].tone).toBe("err");
  });
  it("sudo hire me opens contact; other sudo is refused", () => {
    expect(run("sudo hire me").effect).toEqual({ kind: "scroll", id: "contact" });
    expect(text("sudo rm")).toContain("not in the sudoers file");
  });
  it("clear, history, date, echo", () => {
    expect(run("clear").effect).toEqual({ kind: "clear" });
    expect(text("history")).toMatch(/1\s+help/);
    expect(text("date")).toContain("2026");
    expect(text("echo hi  there")).toBe("hi there");
  });
  it("suggests a command for a typo and never runs unknown input", () => {
    const r = run("hepl");
    expect(r.lines[0].text).toBe("zsh: command not found: hepl");
    expect(r.lines[1].text).toContain("'help'");
    expect(r.effect).toBeUndefined();
  });
  it("cuts very long input in error messages", () => {
    expect(run("x".repeat(500)).lines[0].text.length).toBeLessThan(60);
  });
});

describe("complete", () => {
  it("completes a command, with a trailing space when unique", () => {
    expect(complete("hel", data)).toBe("help ");
    expect(complete("kub", data)).toBe("kubectl ");
  });
  it("completes the shared part when several match", () => expect(complete("c", data)).toBe("c"));
  it("completes arguments", () => {
    expect(complete("cat pi", data)).toBe("cat pitch.txt ");
    expect(complete("cd proj", data)).toBe("cd projects ");
    expect(complete("theme drac", data)).toBe("theme dracula ");
    expect(complete("open git", data)).toBe("open github ");
    expect(complete("kubectl ", data)).toBe("kubectl get ");
    expect(complete("kubectl get sk", data)).toBe("kubectl get skills ");
  });
  it("leaves input alone when nothing matches", () => {
    expect(complete("zzz", data)).toBe("zzz");
    expect(complete("cat zzz", data)).toBe("cat zzz");
  });
});
