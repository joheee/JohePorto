import type { CalloutKind } from "@/lib/markdown";

// A note inside a post, drawn like a log level: [NOTE] [TIP] [IMPORTANT] [WARN] [ERROR]. Written in Markdown as a
// blockquote that starts with [!NOTE], [!TIP], [!IMPORTANT], [!WARNING] or [!CAUTION].
const KINDS: Record<CalloutKind, { tag: string; box: string; text: string }> = {
  note: { tag: "NOTE", box: "border-sky-600/50 bg-sky-500/10", text: "text-sky-700 dark:text-sky-300" },
  tip: { tag: "TIP", box: "border-emerald-600/50 bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400" },
  important: { tag: "IMPORTANT", box: "border-violet-600/50 bg-violet-500/10", text: "text-violet-700 dark:text-violet-300" },
  warning: { tag: "WARN", box: "border-amber-600/50 bg-amber-500/10", text: "text-amber-800 dark:text-amber-300" },
  caution: { tag: "ERROR", box: "border-red-600/50 bg-red-500/10", text: "text-red-700 dark:text-red-400" },
};

export default function Callout({ kind, children }: { kind: CalloutKind; children: React.ReactNode }) {
  const k = KINDS[kind];
  return (
    <aside className={`rounded-lg border-l-4 px-4 py-3 ${k.box}`}>
      <p className={`mb-1 font-mono text-xs font-semibold tracking-wide ${k.text}`}>
        <span aria-hidden>[</span>
        {k.tag}
        <span aria-hidden>]</span>
      </p>
      <div className="space-y-3 text-[15px] leading-7">{children}</div>
    </aside>
  );
}
