"use client";

import { useRef, useState } from "react";
import { complete, runCommand, type TermEffect, type TermLine, type TerminalData } from "@/lib/terminal";
import { applyTheme } from "@/lib/themes";
import { track } from "@/lib/track";

const TONE = { ok: "text-emerald-400", add: "text-emerald-400", dim: "text-zinc-400", text: "text-zinc-200", err: "text-red-400" };
const MAX_LINES = 300;

type Entry = { id: number; command: string; lines: TermLine[] };

// The live prompt at the end of the hero terminal: the visitor can type commands (`help` lists them). The
// animated part above is server-rendered and unchanged; this is the last "$" line, which used to be only a
// blinking cursor. The whole terminal body scrolls (see InfraConsole) once it passes its maximum height, so a long answer never pushes the hero around.
export default function TerminalPrompt({ data, delay }: { data: TerminalData; delay: number }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const cursor = useRef(-1); // position while browsing history with the arrow keys; -1 = the line being typed
  const draft = useRef("");
  const nextId = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const used = useRef(false);

  function applyEffect(effect: TermEffect): TermLine[] {
    switch (effect.kind) {
      case "clear":
        setEntries([]);
        return [];
      case "theme":
        applyTheme(effect.id);
        try {
          localStorage.setItem("theme", effect.id);
        } catch {}
        return [];
      case "open":
        window.open(effect.href, "_blank", "noopener,noreferrer");
        return [];
      case "scroll": {
        const el = document.getElementById(effect.id);
        if (!el) return [{ text: `cd: ${effect.id}: no such section on this page`, tone: "err" }];
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        return [];
      }
    }
  }

  function submit(raw: string) {
    const command = raw.trim();
    setValue("");
    cursor.current = -1;
    if (!command) {
      setEntries((e) => [...e, { id: nextId.current++, command: "", lines: [] }].slice(-MAX_LINES));
      return;
    }
    if (!used.current) {
      used.current = true;
      track("terminal.used");
    }
    if (history.current.at(-1) !== command) history.current.push(command);
    const theme = document.documentElement.dataset.theme ?? "";
    const result = runCommand(command, data, { theme, history: history.current, now: new Date() });
    const extra = result.effect ? applyEffect(result.effect) : [];
    if (result.effect?.kind === "clear") return;
    setEntries((e) => [...e, { id: nextId.current++, command, lines: [...result.lines, ...extra] }].slice(-MAX_LINES));
    // after the new lines are drawn, keep the newest in view (inside the output area only)
    requestAnimationFrame(() => {
      const body = input.current?.closest<HTMLElement>("[data-term-body]");
      if (body) body.scrollTop = body.scrollHeight;
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit(value);
    } else if (e.key === "Tab") {
      e.preventDefault();
      setValue((v) => complete(v, data));
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current;
      if (h.length === 0) return;
      if (cursor.current === -1) draft.current = value;
      const next = e.key === "ArrowUp" ? (cursor.current === -1 ? h.length - 1 : Math.max(0, cursor.current - 1)) : cursor.current + 1;
      if (next >= h.length || next < 0) {
        cursor.current = -1;
        setValue(draft.current);
      } else {
        cursor.current = next;
        setValue(h[next]);
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setEntries([]);
    } else if (e.ctrlKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      setEntries((list) => [...list, { id: nextId.current++, command: `${value}^C`, lines: [] }].slice(-MAX_LINES));
      setValue("");
    } else if (e.key === "Escape") {
      input.current?.blur();
    }
  }

  return (
    // Clicking anywhere on the prompt area focuses the input, like a real terminal.
    <div className="term-line pt-2" style={{ "--s": `${delay.toFixed(2)}s` } as React.CSSProperties} onClick={() => input.current?.focus()}>
      {entries.length > 0 && (
        <div
          role="log"
          aria-label="Terminal output"
          className="mb-1 space-y-0.5"
        >
          {entries.map((entry) => (
            <div key={entry.id}>
              <p className="whitespace-pre-wrap break-words">
                <span aria-hidden className="text-emerald-400">$</span> {entry.command}
              </p>
              {entry.lines.map((l, i) => (
                <p key={i} className={`min-h-6 whitespace-pre-wrap break-words pl-4 ${TONE[l.tone ?? "text"]}`}>
                  {l.text}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
      <label className="relative flex items-center gap-2 whitespace-nowrap">
        <span aria-hidden className="text-emerald-400">$</span>
        <span className="sr-only">Terminal command. Type help for the list of commands.</span>
        <input
          ref={input}
          value={value}
          onChange={(e) => {
            cursor.current = -1;
            setValue(e.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder=" "
          type="text"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="send"
          className="peer min-w-0 flex-1 bg-transparent font-mono text-[13px] leading-6 text-zinc-100 caret-zinc-200 outline-none"
        />
        {/* The blinking block while nobody has focused or typed (the same cursor as before); decoration */}
        <span aria-hidden className="term-cursor pointer-events-none absolute left-4 inline-block h-4 w-2 bg-zinc-300 peer-focus:hidden peer-[:not(:placeholder-shown)]:hidden" />
        <span aria-hidden className="pointer-events-none absolute left-8 text-zinc-400 peer-focus:hidden peer-[:not(:placeholder-shown)]:hidden max-sm:hidden">
          type <span className="text-zinc-300">help</span>
        </span>
      </label>
    </div>
  );
}
