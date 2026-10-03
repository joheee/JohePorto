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

// The project's links as small pills. They are real links (new tab), so on the public site they
// live outside the clickable card body: a link inside a button is invalid and breaks keyboards.
export function ProjectLinks({ links, className = "", emptyLabel }: { links: Project["links"]; className?: string; emptyLabel?: string }) {
  if (links.length === 0) return emptyLabel ? <p className={`text-xs text-muted ${className}`}>{emptyLabel}</p> : null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {links.map((l, i) => (
        <li key={`${l.href}-${i}`}>
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
          >
            {l.label}
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

// What a project card shows: date, title, summary and tech chips. Shared by the public Projects
// section and the admin list, so the two always look the same. `trailing` sits at the top right
// (the public cards put an arrow there).
export default function ProjectCardContent({ project, trailing }: { project: Project; trailing?: React.ReactNode }) {
  return (
    <>
      <div className="relative mb-5 flex items-center justify-between">
        <span className="font-mono text-xs text-muted">{formatMonthYear(project.month, project.year)}</span>
        {trailing}
      </div>
      <h3 className="relative text-lg font-semibold tracking-tight">{project.title}</h3>
      <p className="relative mt-2 flex-1 text-sm leading-6 text-muted">{project.summary}</p>
      <ProjectChips items={project.stack} className="relative mt-5" />
    </>
  );
}
