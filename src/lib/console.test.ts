import { describe, expect, it } from "vitest";
import { buildConsole, timeConsole, type ConsoleInput } from "./console";

const input: ConsoleInput = {
  roles: ["Cloud Engineer", "DevOps Engineer"],
  pitch: "I help teams ship faster.",
  skills: ["Terraform", "Kubernetes", "AWS", "GCP", "Go"],
  status: "Open for projects",
};

const text = (lines: ReturnType<typeof buildConsole>) =>
  lines.map((l) => (l.kind === "cmd" ? `$ ${l.text}` : l.kind === "role" ? `role: ${l.words.join("|")}` : l.text));

describe("buildConsole", () => {
  it("answers whoami with the roles and cat with the pitch, then plans the skills, then runs the status script", () => {
    expect(text(buildConsole(input))).toEqual([
      "$ whoami --role",
      "role: Cloud Engineer|DevOps Engineer",
      "$ cat pitch.txt",
      "I help teams ship faster.",
      "$ terraform plan",
      "Terraform will perform these actions:",
      '+ skill "Terraform"',
      '+ skill "Kubernetes"',
      '+ skill "AWS"',
      "# ... 2 more",
      "Plan: 5 to add, 0 to destroy.",
      "$ ./status.sh",
      "● Open for projects",
    ]);
  });

  it("does not apply the plan", () => {
    expect(text(buildConsole(input)).join("\n")).not.toContain("apply");
  });

  it("counts every skill in the plan, not only the ones listed", () => {
    const skills = Array.from({ length: 50 }, (_, i) => `s${i}`);
    expect(text(buildConsole({ ...input, skills }))).toContain("Plan: 50 to add, 0 to destroy.");
  });

  it("has no 'more' line when every skill is listed", () => {
    expect(text(buildConsole({ ...input, skills: ["A", "B"] })).some((t) => t.includes("more"))).toBe(false);
  });

  it("shows the role and the pitch at once as real content, and animates the rest", () => {
    const lines = buildConsole(input);
    const still = lines.filter((l) => l.still);
    expect(still.map((l) => l.kind)).toEqual(["cmd", "role", "cmd", "out"]);
    expect(lines.filter((l) => l.kind === "role" || (l.kind === "out" && l.real))).toHaveLength(2);
    expect(lines.slice(4).some((l) => l.still)).toBe(false);
  });

  it("marks added resources, the plan and the status line as green", () => {
    const lines = buildConsole(input);
    expect(lines).toContainEqual({ kind: "out", text: '+ skill "Terraform"', tone: "add" });
    expect(lines).toContainEqual({ kind: "out", text: "Plan: 5 to add, 0 to destroy.", tone: "ok" });
    expect(lines.at(-1)).toEqual({ kind: "out", text: "● Open for projects", tone: "ok" });
  });

  it("leaves out each part that has no data", () => {
    expect(text(buildConsole({ roles: [], pitch: "", skills: [], status: "Open" }))).toEqual(["$ ./status.sh", "● Open"]);
    expect(text(buildConsole({ ...input, pitch: "  ", status: " " })).join("\n")).not.toMatch(/pitch|status/);
  });

  it("is empty for an empty profile", () => {
    expect(buildConsole({ roles: [], pitch: "", skills: [], status: "" })).toEqual([]);
  });
});

describe("timeConsole", () => {
  const lines = buildConsole(input);
  const { timings, end } = timeConsole(lines);

  it("gives still lines no delay and no typing", () => {
    lines.forEach((l, i) => {
      if (l.still) expect(timings[i]).toEqual({ start: 0, typing: 0 });
    });
  });

  it("starts the animated lines in order, one after another, after the given delay", () => {
    const animated = timings.filter((_, i) => !lines[i].still);
    expect(animated[0].start).toBe(0.6);
    for (let i = 1; i < animated.length; i++) expect(animated[i].start).toBeGreaterThan(animated[i - 1].start);
    expect(end).toBeGreaterThan(animated.at(-1)!.start);
    expect(timeConsole(lines, 2).timings[4].start).toBe(2);
  });

  it("types commands (longer commands take longer), and prints output at once", () => {
    const cmd = (t: string) => lines.findIndex((l) => l.kind === "cmd" && l.text === t);
    expect(timings[cmd("terraform plan")].typing).toBeGreaterThan(timings[cmd("./status.sh")].typing);
    expect(timings[cmd("./status.sh") + 1].typing).toBe(0);
  });
});
