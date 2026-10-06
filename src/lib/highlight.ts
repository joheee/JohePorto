import "server-only";
import { createCssVariablesTheme, createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { hasPrompt, plainLines, type CodeLine, type CodeToken } from "./markdown";

// Syntax highlighting for the code blocks of a post, done on the server: the page sends finished coloured text and
// no highlighter code to the browser. The colours are CSS variables (--shiki-token-*, set in globals.css), so
// one palette serves every theme. Only a handful of languages are loaded, each the first time it is needed.

const LANGUAGES: Record<string, () => Promise<unknown>> = {
  bash: () => import("shiki/langs/bash.mjs"),
  hcl: () => import("shiki/langs/hcl.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  dockerfile: () => import("shiki/langs/dockerfile.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  ini: () => import("shiki/langs/ini.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  nginx: () => import("shiki/langs/nginx.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  css: () => import("shiki/langs/css.mjs"),
};

const ALIASES: Record<string, string> = {
  sh: "bash", shell: "bash", zsh: "bash", console: "bash", terminal: "bash",
  terraform: "hcl", tf: "hcl", yml: "yaml", ts: "typescript", js: "javascript", py: "python", md: "markdown", conf: "nginx",
};

export const resolveLanguage = (lang: string): string | null => {
  const l = ALIASES[lang.toLowerCase()] ?? lang.toLowerCase();
  return l in LANGUAGES ? l : null;
};

const THEME = "css-variables";
let highlighter: Promise<HighlighterCore> | undefined;
const loaded = new Set<string>();

function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [createCssVariablesTheme({ name: THEME, variablePrefix: "--shiki-", variableDefaults: {}, fontStyle: true })],
    langs: [],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

const ITALIC = 1;

// The block as coloured lines, or plain lines when the language is unknown or highlighting fails (a block never
// breaks the post). In a shell block with "$ " prompts only the commands are coloured; output stays plain.
export async function highlight(code: string, lang: string): Promise<CodeLine[]> {
  const name = resolveLanguage(lang);
  if (!name) return plainLines(code, lang);
  try {
    const h = await getHighlighter();
    if (!loaded.has(name)) {
      await h.loadLanguage(LANGUAGES[name]() as Parameters<HighlighterCore["loadLanguage"]>[0]);
      loaded.add(name);
    }
    const tokenize = (src: string): CodeToken[][] =>
      h.codeToTokens(src, { lang: name, theme: THEME }).tokens.map((line) => line.map((t) => ({ text: t.content, color: t.color, italic: ((t.fontStyle ?? 0) & ITALIC) !== 0 })));

    const text = code.replace(/\n$/, "");
    if (!hasPrompt(code, lang)) return tokenize(text).map((tokens) => ({ tokens }));
    return text.split("\n").map((l) => (l.startsWith("$ ") ? { prompt: true, tokens: tokenize(l.slice(2))[0] ?? [] } : { out: true, tokens: [{ text: l }] }));
  } catch (e) {
    console.warn(`Highlighting "${lang}" failed:`, e instanceof Error ? e.message : e);
    return plainLines(code, lang);
  }
}
