import TypedText from "@/components/motion/TypedText";
import { timeConsole, type ConsoleLine } from "@/lib/console";
import type { TerminalData } from "@/lib/terminal";
import TerminalPrompt from "./TerminalPrompt";

const TONE = { ok: "text-emerald-400", add: "text-emerald-400", dim: "text-zinc-400", text: "text-zinc-200", plain: "text-zinc-300" };

const seconds = (n: number) => `${n.toFixed(2)}s`;

// The hero's terminal card. It is always dark, whatever the theme, so every colour in it is a fixed one that
// passes 4.5:1 against #0b0d12. The role and the pitch are there from the first paint and are real text for
// screen readers; the Terraform run and the status script type and print one after another in pure CSS (see
// .term-* in globals.css, no JavaScript needed) and are hidden from screen readers, because they only decorate. The last line is a live prompt (TerminalPrompt): visitors can type commands.
// With reduced motion everything is simply shown.
export default function InfraConsole({ lines, data }: { lines: ConsoleLine[]; data: TerminalData }) {
  if (lines.length === 0) return null;
  const { timings, end } = timeConsole(lines);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0d12] shadow-2xl shadow-black/20 ring-1 ring-black/5">
      <div aria-hidden className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 font-mono text-xs text-zinc-400">infra ~ zsh</span>
      </div>
      {/* The whole body scrolls when typed output makes it taller than this (data-term-body: TerminalPrompt keeps the newest line in view) */}
      <div data-term-body data-lenis-prevent className="term-scroll max-h-[32rem] space-y-0.5 overflow-y-auto px-4 py-4 font-mono text-[13px] leading-6 text-zinc-200">
        {lines.map((line, i) => {
          const { start, typing } = timings[i];
          const anim = line.kind !== "role" && line.still ? "" : "term-line ";
          const at = { "--s": seconds(start) } as React.CSSProperties;
          if (line.kind === "role") {
            return (
              <p key={i} className="pl-4">
                <TypedText words={line.words} className="h-6 leading-6 text-violet-300" cursorClassName="bg-violet-300" />
              </p>
            );
          }
          return line.kind === "cmd" ? (
            <p key={i} aria-hidden className={`${i > 0 ? "pt-2 " : ""}${anim}whitespace-nowrap`} style={at}>
              <span className="text-emerald-400">$</span>{" "}
              {line.still ? (
                line.text
              ) : (
                <span className="term-type" style={{ "--n": line.text.length, "--d": seconds(typing) } as React.CSSProperties}>
                  {line.text}
                </span>
              )}
            </p>
          ) : (
            <p
              key={i}
              aria-hidden={line.real ? undefined : true}
              className={`${anim}break-words pl-4 ${TONE[line.tone ?? "plain"]}`}
              style={at}
            >
              {line.text}
            </p>
          );
        })}
        <TerminalPrompt data={data} delay={end} />
      </div>
    </div>
  );
}
