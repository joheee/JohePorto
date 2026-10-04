import FormattedText from "@/components/FormattedText";
import { formatMonthYear } from "@/lib/format";
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

// One project, shown in full: date, title, summary, description, tech stack and links. Shared by the
// public Projects section and the admin list so the two always look the same. `footer` is extra
// content under the links (the admin list puts Edit and Delete there).
export default function ProjectCard({ project, footer }: { project: Project; footer?: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent sm:p-8">
      <p className="font-mono text-xs text-muted">{formatMonthYear(project.month, project.year)}</p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{project.title}</h3>
      {project.summary && <p className="mt-3 max-w-3xl text-muted">{project.summary}</p>}
      {project.description && <FormattedText text={project.description} className="mt-5 max-w-3xl leading-7" />}
      <ProjectChips items={project.stack} className="mt-6" />
      <ProjectLinks links={project.links} className="mt-6" />
      {footer}
    </article>
  );
}
