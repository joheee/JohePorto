import { describe, expect, it } from "vitest";
import { buildConsole, timeConsole, type ConsoleInput } from "./console";

const input: ConsoleInput = {
  name: "Jo Doe",
  roles: ["DevOps Engineer", "Cloud Engineer"],
  current: { role: "DevOps Engineer", company: "Acme" },
  skills: ["Terraform", "Kubernetes", "AWS", "GCP", "Go", "Python", "Bash", "Docker"],
  stats: [
    { value: "7+", label: "years of experience" },
    { value: "4", label: "companies" },
  ],
  status: "Open for projects",
};

const text = (lines: ReturnType<typeof buildConsole>) => lines.map((l) => (l.kind === "cmd" ? `$ ${l.text}` : l.text));

describe("buildConsole", () => {
  it("writes each command and its output from the profile", () => {
    expect(text(buildConsole(input))).toEqual([
      "$ whoami",
      "Jo Doe",
      "$ cat now.txt",
      "DevOps Engineer @ Acme",
      "$ ls ~/stack",
      "terraform  kubernetes  aws  gcp  go  python",
      "$ uptime",
      "up 7+ years of experience, 4 companies",
      "$ ./status.sh",
      "● Open for projects",
    ]);
  });

  it("lists multi-word skills like file names, so each reads as one item", () => {
    const lines = buildConsole({ ...input, skills: ["Bash Script", "Helm Chart", "Go"] });
    expect(text(lines)).toContain("bash-script  helm-chart  go");
  });

  it("marks the status line as ok", () => {
    expect(buildConsole(input).at(-1)).toEqual({ kind: "out", text: "● Open for projects", tone: "ok" });
  });

  it("falls back to the first role when no job is current", () => {
    const lines = buildConsole({ ...input, current: undefined });
    expect(text(lines)).toContain("DevOps Engineer");
  });

  it("leaves out a command whose output would be empty", () => {
    const lines = buildConsole({ ...input, skills: [], stats: [], status: "", roles: [], current: undefined });
    expect(text(lines)).toEqual(["$ whoami", "Jo Doe"]);
  });

  it("is empty for an empty profile", () => {
    expect(buildConsole({ name: "", roles: [], skills: [], stats: [], status: "" })).toEqual([]);
  });
});

describe("timeConsole", () => {
  const lines = buildConsole(input);
  const { timings, end } = timeConsole(lines);

  it("starts lines in order, one after another", () => {
    expect(timings).toHaveLength(lines.length);
    for (let i = 1; i < timings.length; i++) expect(timings[i].start).toBeGreaterThan(timings[i - 1].start);
    expect(end).toBeGreaterThan(timings.at(-1)!.start);
  });

  it("types commands (longer commands take longer), and prints output at once", () => {
    const cmd = (text: string) => lines.findIndex((l) => l.kind === "cmd" && l.text === text);
    expect(timings[cmd("./status.sh")].typing).toBeGreaterThan(timings[cmd("whoami")].typing);
    expect(timings[cmd("whoami") + 1].typing).toBe(0);
  });

  it("starts after the given delay", () => {
    expect(timeConsole(lines, 2).timings[0].start).toBe(2);
  });
});
