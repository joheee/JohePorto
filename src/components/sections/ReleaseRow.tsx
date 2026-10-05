import FormattedText from "@/components/FormattedText";
import { ProjectChips } from "@/components/ProjectCard";
import Reveal from "@/components/motion/Reveal";

const label = "mb-2 font-mono text-xs uppercase tracking-widest text-muted";

// A year divider, like the dates that group GitHub's release list: the year, then a thin line.
export function YearDivider({ year }: { year: number }) {
  return (
    <div aria-hidden className="flex items-center gap-4 pt-10 font-mono text-sm text-muted first:pt-0">
      <span>{year}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

// One job or education entry laid out like a GitHub release: a version tag, the date and how long it
// lasted on the left; on the right the title (with a "Latest" pill for the newest, current one), the
// company, "What's changed" (the bullets) and "Built with" (the stack). A thin line with a dot separates
// the two columns on wide screens. `footer` is where the editor puts its buttons.
export default function ReleaseRow({
  id,
  tag,
  latest,
  period,
  duration,
  title,
  org,
  location,
  summary,
  summaryLabel = "What’s changed",
  stack,
  footer,
}: {
  id: string;
  tag: string; // "v6.0"
  latest: boolean;
  period: string;
  duration: string;
  title: string;
  org: string;
  location: string;
  summary: string;
  summaryLabel?: string;
  stack?: string[];
  footer?: React.ReactNode;
}) {
  return (
    <li id={id} className="scroll-mt-24">
      <Reveal>
        <div className="grid gap-3 py-6 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 md:block md:space-y-1.5 md:pr-8">
            <p className="inline-flex items-center gap-1.5 font-mono text-sm font-medium md:flex">
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4v7l9.5 9.5a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8L11 3H4a1 1 0 0 0-1 1zM7.5 7.5h.01" />
              </svg>
              {tag}
            </p>
            <p className="font-mono text-xs text-muted">{period}</p>
            <p className="font-mono text-xs text-muted">{duration}</p>
          </div>

          <div className="relative md:border-l md:border-border md:pl-8">
            <span aria-hidden className={`absolute -left-[4.5px] top-2 hidden h-2 w-2 rounded-full md:block ${latest ? "bg-emerald-500" : "bg-border"}`} />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="text-xl font-semibold leading-snug tracking-tight">{title}</h3>
              {latest && (
                <span className="rounded-full border border-emerald-600/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs text-emerald-700 dark:text-emerald-400">Latest</span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-accent">
              {org}
              {location && <span className="font-normal text-muted"> · {location}</span>}
            </p>
            {summary && (
              <div className="mt-5">
                <p className={label}>{summaryLabel}</p>
                <FormattedText text={summary} className="text-muted" />
              </div>
            )}
            {stack && stack.length > 0 && (
              <div className="mt-5">
                <p className={label}>Built with</p>
                <ProjectChips items={stack} />
              </div>
            )}
            {footer}
          </div>
        </div>
      </Reveal>
    </li>
  );
}
