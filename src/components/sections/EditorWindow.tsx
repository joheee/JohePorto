// A code-editor-style window: a title bar with the file name and a line-number gutter. Used for the About
// "README.md". The numbers come from a CSS counter (see .editor / .ed-line in globals.css), one per row.
// The window follows the page theme, so it does not repeat the always-dark terminal of the hero.
export default function EditorWindow({ filename, children }: { filename: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-foreground/[0.03] px-4 py-2.5">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 inline-flex items-center gap-1.5 font-mono text-xs text-muted">
          <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5" />
          </svg>
          {filename}
        </span>
      </div>
      <div className="editor py-4 pl-3 pr-4 sm:pr-6">{children}</div>
    </div>
  );
}

// One numbered row of the editor. Without children it is an empty line.
export function EditorLine({ children }: { children?: React.ReactNode }) {
  return (
    <div className="ed-line">
      <div className="min-w-0">{children}</div>
    </div>
  );
}
