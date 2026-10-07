import { THEMES } from "@/lib/themes";

// The typeable part of the hero terminal. Pure: `runCommand` turns what was typed into lines of output and an
// optional effect (change theme, scroll, open a link, clear the screen) that the component carries out, so
// every command can be tested without a browser. Output lines are at most about 44 characters wide, which is
// what fits the 24rem terminal column in the 13px mono font.

export type TerminalData = {
  user: string; // shell user, e.g. "johevin-blesstowi"
  name: string;
  email: string;
  location: string;
  status: string;
  roles: string[];
  pitch: string;
  bio: string[];
  skillGroups: { name: string; items: string[] }[];
  socials: { label: string; href: string }[];
  experience: { role: string; company: string; period: string }[]; // newest first
  projects: { slug: string; title: string; year: number }[];
};

export type TermTone = "ok" | "dim" | "text" | "err" | "add";
export type TermLine = { text: string; tone?: TermTone };
export type TermEffect =
  | { kind: "theme"; id: string }
  | { kind: "scroll"; id: string }
  | { kind: "open"; href: string }
  | { kind: "clear" };
export type TermResult = { lines: TermLine[]; effect?: TermEffect };
export type TermContext = { theme: string; history: string[]; now: Date };

const FILES = ["about.md", "pitch.txt", "skills.yaml", "contact.txt", "status.txt", "resume.pdf"];
const SECTIONS = ["about", "projects", "experience", "reviews", "blog", "contact"];

export const COMMANDS = [
  "help", "whoami", "ls", "cat", "pwd", "cd", "open", "skills", "projects", "kubectl", "git", "theme",
  "contact", "email", "date", "echo", "history", "clear", "sudo", "exit",
];

const line = (text: string, tone?: TermTone): TermLine => ({ text, tone });
const ok = (...lines: TermLine[]): TermResult => ({ lines });
const err = (text: string): TermResult => ok(line(text, "err"));
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const HELP: [string, string][] = [
  ["help", "this list"],
  ["whoami", "who is this?"],
  ["ls, cat <file>", "look around"],
  ["cd <section>", "jump to a section"],
  ["kubectl get skills", "what I work with"],
  ["kubectl get projects", "what I have built"],
  ["git log --oneline", "where I have worked"],
  ["theme [name]", "change colour theme"],
  ["open resume|github", "open a link"],
  ["contact", "get in touch"],
  ["clear, history", "tidy up"],
];

function help(): TermResult {
  return ok(
    line("Available commands:", "dim"),
    ...HELP.map(([cmd, what]) => line(`  ${cmd.padEnd(21)}${what}`)),
    line("Tab completes, ↑ ↓ browse history.", "dim"),
  );
}

function ls(args: string[], d: TerminalData): TermResult {
  const target = args.find((a) => !a.startsWith("-"))?.replace(/\/$/, "");
  if (!target || target === "." || target === "~") return ok(line(`${FILES.join("  ")}  projects/`));
  if (target === "projects") {
    return d.projects.length ? ok(...d.projects.map((p) => line(cut(p.slug, 44)))) : ok(line("(empty)", "dim"));
  }
  return err(`ls: cannot access '${cut(target, 30)}': No such file or directory`);
}

function cat(args: string[], d: TerminalData): TermResult {
  const file = args[0];
  if (!file) return err("cat: missing file operand");
  switch (file) {
    case "pitch.txt":
      return ok(line(d.pitch || "(empty)", d.pitch ? "text" : "dim"));
    case "about.md":
      return d.bio.length ? ok(...d.bio.flatMap((p, i) => (i ? [line(""), line(p, "text")] : [line(p, "text")]))) : ok(line("(empty)", "dim"));
    case "skills.yaml":
      return d.skillGroups.length
        ? ok(...d.skillGroups.flatMap((g) => [line(`${g.name.toLowerCase().replace(/\s+/g, "_")}:`, "ok"), ...g.items.map((s) => line(`  - ${s}`))]))
        : ok(line("(empty)", "dim"));
    case "contact.txt":
      return ok(
        line(`email: ${d.email || "-"}`),
        line(`location: ${d.location || "-"}`),
        ...d.socials.map((s) => line(`${s.label.toLowerCase()}: ${s.href}`)),
      );
    case "status.txt":
      return ok(line(d.status ? `● ${d.status}` : "(empty)", d.status ? "ok" : "dim"));
    case "resume.pdf":
      return err("cat: resume.pdf: binary file (try `open resume`)");
    default:
      return err(`cat: ${cut(file, 30)}: No such file or directory`);
  }
}

function skills(d: TerminalData): TermResult {
  const rows = d.skillGroups.flatMap((g) => g.items.map((s) => ({ name: s, group: g.name })));
  if (!rows.length) return ok(line("No resources found.", "dim"));
  return ok(line(`${"NAME".padEnd(22)}GROUP`, "dim"), ...rows.map((r) => line(`${cut(r.name, 21).padEnd(22)}${cut(r.group, 21)}`)));
}

function projects(d: TerminalData): TermResult {
  if (!d.projects.length) return ok(line("No resources found.", "dim"));
  return ok(line(`${"NAME".padEnd(37)}YEAR`, "dim"), ...d.projects.map((p) => line(`${cut(p.slug, 36).padEnd(37)}${p.year}`)));
}

function kubectl(args: string[], d: TerminalData): TermResult {
  const [verb, what] = args;
  if (verb !== "get" || !what) return ok(line("Usage: kubectl get skills|projects", "dim"));
  if (what === "skills" || what === "skill") return skills(d);
  if (what === "projects" || what === "project") return projects(d);
  if (what === "pods" || what === "po") return ok(line("No resources found in portfolio namespace.", "dim"));
  return err(`error: the server doesn't have a resource type "${cut(what, 20)}"`);
}

function gitCmd(args: string[], d: TerminalData): TermResult {
  if (args[0] !== "log") return ok(line("Usage: git log --oneline", "dim"));
  if (!d.experience.length) return ok(line("fatal: your current branch has no commits yet", "dim"));
  return ok(...d.experience.flatMap((e) => [line(`${e.role} @ ${e.company}`, "text"), line(`  ${e.period}`, "dim")]));
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function theme(args: string[], ctx: TermContext): TermResult {
  const wanted = args.join(" ");
  if (!wanted || wanted === "list" || wanted === "ls") {
    return ok(
      line("Themes (theme <name> to switch):", "dim"),
      ...THEMES.map((t) => line(`${t.id === ctx.theme ? "*" : " "} ${t.id}`, t.id === ctx.theme ? "ok" : undefined)),
    );
  }
  const key = normalize(wanted);
  const found = THEMES.find((t) => normalize(t.id) === key || normalize(t.label) === key) ?? THEMES.find((t) => normalize(t.id).startsWith(key));
  if (!found) return err(`theme: unknown theme '${cut(wanted, 24)}' (try \`theme list\`)`);
  return { lines: [line(`theme set to ${found.label}`, "ok")], effect: { kind: "theme", id: found.id } };
}

function cd(args: string[]): TermResult {
  const target = (args[0] ?? "~").replace(/^~?\//, "").replace(/\/$/, "");
  if (target === "" || target === "~" || target === "..") return { lines: [], effect: { kind: "scroll", id: "hero" } };
  if (SECTIONS.includes(target)) return { lines: [], effect: { kind: "scroll", id: target } };
  return err(`cd: no such file or directory: ${cut(target, 30)}`);
}

function open(args: string[], d: TerminalData): TermResult {
  const what = (args[0] ?? "").toLowerCase().replace(/^\.\//, "").replace(/\.pdf$/, "");
  if (!what) return ok(line("Usage: open resume|github|linkedin...", "dim"));
  if (what === "resume") return { lines: [line("opening resume.pdf ...", "ok")], effect: { kind: "open", href: "/resume.pdf" } };
  const social = d.socials.find((s) => s.label.toLowerCase() === what);
  if (social) return { lines: [line(`opening ${social.href} ...`, "ok")], effect: { kind: "open", href: social.href } };
  if (SECTIONS.includes(what)) return cd([what]);
  return err(`open: ${cut(what, 30)}: nothing to open`);
}

function sudo(args: string[], d: TerminalData): TermResult {
  if (args.length === 0) return ok(line("usage: sudo <command>", "dim"));
  if (args.join(" ").toLowerCase().replace(/[!.]/g, "") === "hire me") {
    return {
      lines: [line("[sudo] password for recruiter: ********", "dim"), line("Permission granted.", "ok"), line(`Opening ~/contact — ${d.name || "I"} would love to hear from you.`, "ok")],
      effect: { kind: "scroll", id: "contact" },
    };
  }
  return err(`${d.user} is not in the sudoers file. This incident will be reported.`);
}

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length];
}

function unknown(cmd: string): TermResult {
  const near = COMMANDS.find((c) => levenshtein(c, cmd.toLowerCase()) <= (cmd.length >= 4 ? 2 : 1) || (cmd.length >= 3 && c.startsWith(cmd.toLowerCase())));
  return ok(line(`zsh: command not found: ${cut(cmd, 30)}`, "err"), ...(near ? [line(`Did you mean '${near}'?`, "dim")] : [line("Type `help` to see what works here.", "dim")]));
}

export function runCommand(input: string, d: TerminalData, ctx: TermContext): TermResult {
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ok();
  const [cmd, ...args] = words;

  switch (cmd) {
    case "help":
    case "?":
      return help();
    case "whoami":
      if (args.includes("--role")) return ok(line(d.roles.join(" | ") || "-", "text"));
      return ok(line(d.user), line(d.name, "dim"));
    case "ls":
    case "ll":
      return ls(args, d);
    case "cat":
      return cat(args, d);
    case "pwd":
      return ok(line(`/home/${d.user}`));
    case "cd":
      return cd(args);
    case "open":
    case "xdg-open":
      return open(args, d);
    case "skills":
      return skills(d);
    case "projects":
      return projects(d);
    case "kubectl":
    case "k":
      return kubectl(args, d);
    case "git":
      return gitCmd(args, d);
    case "theme":
      return theme(args, ctx);
    case "contact":
    case "./contact.sh":
      return { lines: [line(`email: ${d.email || "-"}`), line("Opening ~/contact ...", "ok")], effect: { kind: "scroll", id: "contact" } };
    case "email":
      return ok(line(d.email || "-"));
    case "date":
      return ok(line(ctx.now.toString().replace(/ GMT.*$/, "")));
    case "echo":
      return ok(line(args.join(" ")));
    case "history":
      return ok(...ctx.history.map((h, i) => line(`${String(i + 1).padStart(4)}  ${h}`)));
    case "clear":
    case "cls":
      return { lines: [], effect: { kind: "clear" } };
    case "sudo":
      return sudo(args, d);
    case "rm":
      return err("rm: refusing to delete a portfolio. Nice try.");
    case "vim":
    case "vi":
    case "nano":
    case "emacs":
      return ok(line("Read-only portfolio. Try `cat about.md`.", "dim"));
    case "exit":
    case "logout":
      return ok(line("logout: this is a website, not a shell. Try `help`.", "dim"));
    default:
      return unknown(cmd);
  }
}

// Tab completion: the command word, or the argument of cat / cd / open / ls / theme / kubectl / git. Returns
// the new input (unchanged when nothing matches). With several matches it completes the part they share.
export function complete(input: string, d: TerminalData): string {
  const at = input.lastIndexOf(" ") + 1;
  const head = input.slice(0, at);
  const word = input.slice(at);
  const before = head.trim().split(/\s+/).filter(Boolean);
  if (before.length === 0) return pick(word, COMMANDS, head);

  const pool: Record<string, string[]> = {
    cat: FILES,
    ls: ["projects/"],
    cd: SECTIONS,
    open: ["resume", ...SECTIONS, ...d.socials.map((s) => s.label.toLowerCase())],
    theme: ["list", ...THEMES.map((t) => t.id)],
    kubectl: before.length === 1 ? ["get"] : ["skills", "projects"],
    git: ["log"],
  };
  return pick(word, pool[before[0]] ?? [], head);
}

function pick(word: string, options: string[], head: string): string {
  const matches = options.filter((o) => o.startsWith(word));
  if (matches.length === 0) return `${head}${word}`;
  const shared = matches.reduce((a, b) => {
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    return a.slice(0, i);
  });
  const done = matches.length === 1 && !shared.endsWith("/");
  return `${head}${shared}${done ? " " : ""}`;
}
