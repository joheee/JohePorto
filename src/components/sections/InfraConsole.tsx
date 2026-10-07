import TypedText from "@/components/motion/TypedText";
import { timeConsole, type ConsoleLine } from "@/lib/console";
import type { TerminalData } from "@/lib/terminal";
import TerminalPrompt from "./TerminalPrompt";

const TONE = { ok: "text-term-ok", add: "text-term-ok", dim: "text-term-dim", text: "text-term-fg", plain: "text-term-fg" };

const seconds = (n: number) => `${n.toFixed(2)}s`;

// The hero's terminal card. It follows the active theme: its colours are the --term-* tokens in globals.css
// (theme surface, text, muted and accent; green/red per mode), all >= 4.5:1 against the card. The role and the pitch are there from the first paint and are real text for
// screen readers; the Terraform run and the status script type and print one after another in pure CSS (see
// .term-* in globals.css, no JavaScript needed) and are hidden from screen readers, because they only decorate. The last line is a live prompt (TerminalPrompt): visitors can type commands.
// With reduced motion everything is simply shown.
export default function InfraConsole({ lines, data }: { lines: ConsoleLine[]; data: TerminalData }) {
  if (lines.length === 0) return null;
  const { timings, end } = timeConsole(lines);

  return (
    <div className="overflow-hidden rounded-xl border border-term-edge bg-term-bg shadow-2xl shadow-black/20 ring-1 ring-black/5">
      <div aria-hidden className="flex items-center gap-2 border-b border-term-edge bg-term-bar px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 font-mono text-xs text-term-dim">infra ~ zsh</span>
      </div>
      {/* The whole body scrolls when typed output makes it taller than this (data-term-body: TerminalPrompt keeps the newest line in view) */}
      <div data-term-body data-lenis-prevent className="term-scroll max-h-[32rem] space-y-0.5 overflow-y-auto px-4 py-4 font-mono text-[13px] leading-6 text-term-fg">
        {lines.map((line, i) => {
          const { start, typing } = timings[i];
          const anim = line.kind !== "role" && line.still ? "" : "term-line ";
          const at = { "--s": seconds(start) } as React.CSSProperties;
          if (line.kind === "role") {
            return (
              <p key={i} className="pl-4">
                <TypedText words={line.words} className="h-6 leading-6 text-term-role" cursorClassName="bg-term-role" />
              </p>
            );
          }
          return line.kind === "cmd" ? (
            <p key={i} aria-hidden className={`${i > 0 ? "pt-2 " : ""}${anim}whitespace-nowrap`} style={at}>
              <span className="text-term-ok">$</span>{" "}
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
