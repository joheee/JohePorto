import { timeConsole, type ConsoleLine } from "@/lib/console";

const seconds = (n: number) => `${n.toFixed(2)}s`;

// A small terminal card for the hero. The lines type and print one after another in pure CSS (see .term-*
// in globals.css), so it starts on first paint with no JavaScript, and everything is simply there when
// the visitor prefers reduced motion. It is decoration: the same facts are on the page as normal text.
export default function InfraConsole({ lines }: { lines: ConsoleLine[] }) {
  if (lines.length === 0) return null;
  const { timings, end } = timeConsole(lines);

  return (
    <div aria-hidden className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0d12] shadow-2xl shadow-black/20 ring-1 ring-black/5">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 font-mono text-xs text-zinc-400">infra ~ zsh</span>
      </div>
      <div className="space-y-0.5 px-4 py-4 font-mono text-[13px] leading-6 text-zinc-200">
        {lines.map((line, i) => {
          const { start, typing } = timings[i];
          const at = { "--s": seconds(start) } as React.CSSProperties;
          return line.kind === "cmd" ? (
            <p key={i} className="term-line whitespace-nowrap" style={at}>
              <span className="text-emerald-400">$</span>{" "}
              <span className="term-type" style={{ "--n": line.text.length, "--d": seconds(typing) } as React.CSSProperties}>
                {line.text}
              </span>
            </p>
          ) : (
            <p key={i} className={`term-line break-words pl-4 ${line.tone === "ok" ? "text-emerald-400" : "text-zinc-400"}`} style={at}>
              {line.text}
            </p>
          );
        })}
        <p className="term-line" style={{ "--s": seconds(end) } as React.CSSProperties}>
          <span className="text-emerald-400">$</span> <span className="term-cursor inline-block h-4 w-2 translate-y-0.5 bg-zinc-300" />
        </p>
      </div>
    </div>
  );
}
