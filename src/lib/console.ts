// The text of the hero's "infra console": a few shell commands and their output, written from the profile
// so it stays true when the profile is edited. Pure: the component only draws and animates it.
export type ConsoleLine =
  | { kind: "cmd"; text: string } // what is "typed" after the prompt
  | { kind: "out"; text: string; tone?: "ok" }; // what the command prints

export type ConsoleInput = {
  name: string;
  roles: string[];
  current?: { role: string; company: string }; // the newest role you are still in
  skills: string[];
  stats: { value: string; label: string }[]; // experienceStats()
  status: string;
};

const TOP_SKILLS = 6;

// Skills listed like files in `ls`: "Bash Script" -> bash-script, so a multi-word name reads as one item.
const asFile = (skill: string) => skill.trim().toLowerCase().replace(/\s+/g, "-");

export function buildConsole({ name, roles, current, skills, stats, status }: ConsoleInput): ConsoleLine[] {
  const lines: ConsoleLine[] = [];
  const add = (cmd: string, out: string, tone?: "ok") => {
    if (out.trim()) lines.push({ kind: "cmd", text: cmd }, { kind: "out", text: out.trim(), tone });
  };

  add("whoami", name);
  add("cat now.txt", current ? `${current.role} @ ${current.company}` : (roles[0] ?? ""));
  add("ls ~/stack", skills.slice(0, TOP_SKILLS).map(asFile).join("  "));
  add("uptime", stats.length > 0 ? `up ${stats.map((s) => `${s.value} ${s.label}`).join(", ")}` : "");
  add("./status.sh", status ? `● ${status}` : "", "ok");
  return lines;
}

// When each line starts, in seconds, so the lines appear one after another: a command is typed (about
// 45ms a character), then its output appears. `end` is when the cursor starts to blink.
export type ConsoleTiming = { start: number; typing: number };

export function timeConsole(lines: ConsoleLine[], begin = 0.9): { timings: ConsoleTiming[]; end: number } {
  let t = begin;
  const timings = lines.map((line): ConsoleTiming => {
    const start = t;
    if (line.kind === "cmd") {
      const typing = Math.max(0.3, line.text.length * 0.045);
      t += typing + 0.25;
      return { start, typing };
    }
    t += 0.35;
    return { start, typing: 0 };
  });
  return { timings, end: t };
}
