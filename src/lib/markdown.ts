import { Lexer, type Token, type Tokens } from "marked";

// Markdown for the blog. It is parsed into tokens and drawn as React elements (components/blog/Markdown.tsx), never
// turned into an HTML string: raw HTML in a post is ignored, so a post can't put a script on the page.
// Pure, so the admin preview can run it in the browser too.

export function lex(source: string): Token[] {
  return new Lexer({ gfm: true, breaks: false }).lex(source.replace(/\r\n?/g, "\n"));
}

// "Why pgBackRest?" -> "why-pgbackrest". Ids for the headings (links and the outline).
export function headingSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "section"
  );
}

// The plain text of tokens (no formatting marks): for heading ids and the outline.
export function plainText(tokens: Token[] | undefined, fallback = ""): string {
  if (!tokens) return fallback;
  return tokens.map((t) => ("tokens" in t && t.tokens ? plainText(t.tokens as Token[], t.raw) : "text" in t ? String(t.text) : t.raw)).join("");
}

export type Heading = { id: string; text: string; depth: 2 | 3 };

// Gives every heading its id: the same text twice gets -2, -3, ... so ids stay unique.
export function headingIds(tokens: Token[]): Map<Tokens.Heading, string> {
  const used = new Map<string, number>();
  const ids = new Map<Tokens.Heading, string>();
  for (const t of tokens) {
    if (t.type !== "heading") continue;
    const base = headingSlug(plainText(t.tokens, t.text));
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    ids.set(t as Tokens.Heading, n === 1 ? base : `${base}-${n}`);
  }
  return ids;
}

// The ## and ### headings, for the outline next to a post.
export function extractHeadings(tokens: Token[]): Heading[] {
  const ids = headingIds(tokens);
  const out: Heading[] = [];
  // A "#" heading inside a post is drawn like "##" (the page's own title is the only h1).
  for (const [t, id] of ids) if (t.depth <= 3) out.push({ id, text: plainText(t.tokens, t.text), depth: t.depth === 3 ? 3 : 2 });
  return out;
}

export type CalloutKind = "note" | "tip" | "important" | "warning" | "caution";
const CALLOUT = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n?/i;

// A blockquote that starts with [!NOTE], [!TIP], [!IMPORTANT], [!WARNING] or [!CAUTION] (the GitHub way) is a
// callout. Returns its kind and the text that follows the marker, or null for an ordinary quote.
export function parseCallout(quote: Tokens.Blockquote): { kind: CalloutKind; tokens: Token[] } | null {
  const first = quote.tokens[0];
  if (!first || first.type !== "paragraph") return null;
  const m = CALLOUT.exec(first.text);
  if (!m) return null;
  const rest = first.text.slice(m[0].length);
  const body = new Lexer({ gfm: true }).inlineTokens(rest);
  const tokens: Token[] = [...(rest.trim() ? [{ ...first, text: rest, raw: rest, tokens: body } as Token] : []), ...quote.tokens.slice(1)];
  return { kind: m[1].toLowerCase() as CalloutKind, tokens };
}

// Links that are safe to follow: web addresses, mail, and addresses on this site. Anything else (javascript:,
// data:) is drawn as plain text.
export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^(https?:\/\/|mailto:)/i.test(h)) return h;
  if (h.startsWith("/") && !h.startsWith("//")) return h;
  if (h.startsWith("#")) return h;
  return null;
}

const SHELL = new Set(["bash", "sh", "shell", "zsh", "console", "terminal"]);

// A shell block that shows commands with a "$ " prompt: the prompt is not part of the command, so the copy
// button copies only the commands (lines that start with "$ "). Other blocks copy everything.
export function copyText(code: string, lang: string): string {
  if (!SHELL.has(lang.toLowerCase())) return code;
  const lines = code.split("\n");
  const commands = lines.filter((l) => l.startsWith("$ "));
  return commands.length > 0 ? commands.map((l) => l.slice(2)).join("\n") : code;
}

export const hasPrompt = (code: string, lang: string) => SHELL.has(lang.toLowerCase()) && code.split("\n").some((l) => l.startsWith("$ "));

// The text fence "```hcl title=main.tf" -> language "hcl" and a file name. `title=` is optional.
export function fenceInfo(info: string | undefined): { lang: string; title: string } {
  const parts = (info ?? "").trim().split(/\s+/).filter(Boolean);
  const lang = (parts[0] ?? "").toLowerCase();
  const title = parts.map((p) => /^title=(.+)$/.exec(p)?.[1]).find(Boolean) ?? "";
  return { lang: lang.startsWith("title=") ? "" : lang, title };
}

// One coloured piece of a code line, and one line of a code block. `prompt`: a command typed after a "$ " prompt
// (the prompt itself is drawn separately). `out`: output of a command, shown plain and dimmed.
export type CodeToken = { text: string; color?: string; italic?: boolean };
export type CodeLine = { prompt?: boolean; out?: boolean; tokens: CodeToken[] };

// The block as lines without any colours: what the admin preview shows, and the fallback for a language that
// is not highlighted. In a shell block with prompts the lines are told apart (command or output).
export function plainLines(code: string, lang: string): CodeLine[] {
  const lines = code.replace(/\n$/, "").split("\n");
  if (!hasPrompt(code, lang)) return lines.map((text) => ({ tokens: [{ text }] }));
  return lines.map((l) => (l.startsWith("$ ") ? { prompt: true, tokens: [{ text: l.slice(2) }] } : { out: true, tokens: [{ text: l }] }));
}
