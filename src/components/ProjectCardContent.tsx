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
