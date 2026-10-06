import CopyButton from "@/components/CopyButton";
import { copyText, type CodeLine } from "@/lib/markdown";

// A code block of a post, drawn as a terminal window: the three dots, the file name (or the language) and an
// icon-only copy button, then numbered lines. Like the hero terminal it is dark in every theme, so the token
// colours (--shiki-* in globals.css) are chosen for one background. Line numbers are a CSS counter (.code-ln),
// so they are not selected or copied; in a shell block the "$ " prompt is not copied either.
export default function CodeBlock({ code, lang, title, lines }: { code: string; lang: string; title: string; lines: CodeLine[] }) {
  const label = title || lang || "text";
  return (
    <figure className="not-prose overflow-hidden rounded-xl border border-white/10 bg-[#0b0d12] text-zinc-200">
      <figcaption className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] py-1.5 pl-4 pr-2">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 min-w-0 flex-1 truncate font-mono text-xs text-zinc-400">{label}</span>
        <CopyButton dark text={copyText(code, lang)} label="Copy code" copiedLabel="Code copied" />
      </figcaption>
      {/* tabIndex: a scrollable region must be reachable with the keyboard. */}
      <pre tabIndex={0} className="code overflow-x-auto py-3 font-mono text-[13px] leading-6" aria-label={`${label} code`}>
        <code className="block min-w-full w-max">
          {lines.map((line, i) => (
            <span key={i} className="code-ln block pr-4">
              {line.prompt && (
                <span aria-hidden className="select-none text-emerald-400">
                  ${" "}
                </span>
              )}
              {line.tokens.length === 0 || (line.tokens.length === 1 && line.tokens[0].text === "") ? (
                " "
              ) : (
                line.tokens.map((t, j) => (
                  <span key={j} className={line.out ? "text-zinc-400" : undefined} style={t.color || t.italic ? { color: t.color, fontStyle: t.italic ? "italic" : undefined } : undefined}>
                    {t.text}
                  </span>
                ))
              )}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
