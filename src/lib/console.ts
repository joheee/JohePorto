// The text of the hero's "infra console": who you are (the rotating role and the pitch), then a Terraform
// plan written from the profile (each skill is a resource to add), then the status script. Pure: the
// component only draws and animates it.
//   still: shown at once, with no typing, so the role and the pitch are there from the first paint.
//   real:  actual page content (screen readers read it); every other line is decoration.
export type ConsoleLine =
  | { kind: "cmd"; text: string; still?: true } // what is "typed" after the prompt
  | { kind: "out"; text: string; tone?: "ok" | "add" | "dim" | "text"; still?: true; real?: true } // what a command prints
  | { kind: "role"; words: string[]; still: true; real: true }; // the rotating role, typed and deleted in turn

export type ConsoleInput = {
  roles: string[];
  pitch: string;
  skills: string[];
  status: string;
};

const SHOWN_SKILLS = 3;

export function buildConsole({ roles, pitch, skills, status }: ConsoleInput): ConsoleLine[] {
  const lines: ConsoleLine[] = [];
  const out = (text: string, tone?: "ok" | "add" | "dim") => lines.push({ kind: "out", text, tone });

  if (roles.length > 0) {
    lines.push({ kind: "cmd", text: "whoami --role", still: true });
    lines.push({ kind: "role", words: roles, still: true, real: true });
  }
  if (pitch.trim()) {
    lines.push({ kind: "cmd", text: "cat pitch.txt", still: true });
    lines.push({ kind: "out", text: pitch.trim(), tone: "text", still: true, real: true });
  }
  if (skills.length > 0) {
    const n = skills.length;
    lines.push({ kind: "cmd", text: "terraform plan" });
    out("Terraform will perform these actions:", "dim");
    for (const skill of skills.slice(0, SHOWN_SKILLS)) out(`+ skill "${skill.trim()}"`, "add");
    if (n > SHOWN_SKILLS) out(`# ... ${n - SHOWN_SKILLS} more`, "dim");
    out(`Plan: ${n} to add, 0 to destroy.`, "ok");
  }
  if (status.trim()) {
    lines.push({ kind: "cmd", text: "./status.sh" });
    out(`● ${status.trim()}`, "ok");
  }
  return lines;
}

// When each line starts, in seconds, so the animated lines appear one after another: a command is typed
// (about 45ms a character), then its output appears. Still lines are there from the start and take no time.
// `end` is when the cursor starts to blink.
export type ConsoleTiming = { start: number; typing: number };

export function timeConsole(lines: ConsoleLine[], begin = 0.6): { timings: ConsoleTiming[]; end: number } {
  let t = begin;
  const timings = lines.map((line): ConsoleTiming => {
    if (line.still) return { start: 0, typing: 0 };
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
