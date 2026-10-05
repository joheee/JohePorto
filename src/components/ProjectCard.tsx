import CopyButton from "@/components/CopyButton";
import FormattedText from "@/components/FormattedText";
import { formatMonthYear } from "@/lib/format";
import { cloneCommand, projectFileName } from "@/lib/projectFile";
import type { Project } from "@/types/content";

export function ProjectChips({ items, className = "" }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {items.map((s) => (
        <li key={s} className="rounded-full border border-border bg-background/60 px-2.5 py-0.5 font-mono text-xs text-muted">
          {s}
        </li>
      ))}
    </ul>
  );
}

// The project's links as pill buttons (new tab): the first one is the main action.
export function ProjectLinks({ links, className = "", emptyLabel }: { links: Project["links"]; className?: string; emptyLabel?: string }) {
  if (links.length === 0) return emptyLabel ? <p className={`text-sm text-muted ${className}`}>{emptyLabel}</p> : null;
  return (
    <ul className={`flex flex-wrap gap-3 ${className}`}>
      {links.map((l, i) => (
        <li key={`${l.href}-${i}`}>
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition ${
              i === 0 ? "bg-accent text-accent-foreground hover:opacity-90" : "border border-border hover:border-accent hover:text-accent"
            }`}
          >
            {l.label}
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

// One project, shown in full as a file in an editor-style window: its name (slug + an extension from the
// stack) and date in the title bar, then title, summary, the description as added lines of a diff, the
// stack as chips, a `git clone` line when a link is a repository, and the links. Shared by the public Projects
// section and the admin list so the two always look the same. `footer` is extra content at the bottom
// (the admin list puts Edit and Delete there).
export default function ProjectCard({ project, footer }: { project: Project; footer?: React.ReactNode }) {
  const clone = cloneCommand(project.links);
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-accent">
      <div className="flex items-center gap-2 border-b border-border bg-foreground/[0.03] px-4 py-2.5">
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-400/70" />
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400/70" />
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400/70" />
        <span className="ml-2 inline-flex min-w-0 items-center gap-1.5 font-mono text-xs text-muted">
          <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5" />
          </svg>
          <span className="truncate">{projectFileName(project.slug, project.stack)}</span>
        </span>
        <span className="ml-auto shrink-0 font-mono text-xs text-muted">{formatMonthYear(project.month, project.year)}</span>
      </div>
      <div className="p-5 sm:p-8">
        <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{project.title}</h3>
        {project.summary && <p className="mt-3 max-w-3xl text-muted">{project.summary}</p>}
        {project.description && <FormattedText text={project.description} variant="diff" className="mt-5 max-w-3xl leading-7" />}
        <ProjectChips items={project.stack} className="mt-6" />
        {clone && (
          <div className="mt-6 flex max-w-3xl items-center gap-3 rounded-xl border border-border bg-background/60 py-2 pl-4 pr-2">
            <code className="min-w-0 flex-1 break-all font-mono text-xs leading-5">
              <span className="text-emerald-700 dark:text-emerald-400">$</span> {clone}
            </code>
            <CopyButton text={clone} label="Copy the git clone command" copiedLabel="Command copied" />
          </div>
        )}
        <ProjectLinks links={project.links} className="mt-6" />
        {footer}
      </div>
    </article>
  );
}
