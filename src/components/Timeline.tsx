import FormattedText from "@/components/FormattedText";
import { ProjectChips } from "@/components/ProjectCard";
import TimelineItem from "@/components/motion/TimelineItem";

export type TimelineEntry = {
  key: string;
  period: string; // "Jan 2026 - Present"
  title: string; // role or degree
  org: string; // company or school
  location: string; // "" when unset
  summary: string; // bullet lines
  stack?: string[]; // technologies (jobs only)
  footer?: React.ReactNode; // e.g. the editor's Edit and Delete buttons
};

// The vertical timeline used for both Experience and Education.
export default function Timeline({ entries, headingLevel = 3 }: { entries: TimelineEntry[]; headingLevel?: 3 | 4 }) {
  const Heading = `h${headingLevel}` as const;
  return (
    <ol className="pl-6">
      {entries.map((e, i) => (
        <TimelineItem key={`${e.key}-${i}`} last={i === entries.length - 1}>
          <p className="inline-block rounded-full border border-border bg-card/60 px-3 py-0.5 font-mono text-xs text-muted">{e.period}</p>
          <Heading className="mt-3 text-lg font-semibold leading-snug tracking-tight">{e.title}</Heading>
          <p className="mt-0.5 text-sm font-medium text-accent">
            {e.org}
            {e.location && <span className="font-normal text-muted"> · {e.location}</span>}
          </p>
          {e.summary && <FormattedText text={e.summary} className="mt-3 text-muted" />}
          {e.stack && <ProjectChips items={e.stack} className="mt-4" />}
          {e.footer}
        </TimelineItem>
      ))}
    </ol>
  );
}
