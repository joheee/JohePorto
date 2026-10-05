import FormattedText from "@/components/FormattedText";
import { ProjectChips } from "@/components/ProjectCard";
import TimelineItem from "@/components/motion/TimelineItem";
import { formatPeriod, sortExperienceNewestFirst } from "@/lib/format";
import { getProfile } from "@/lib/settings";
import type { EducationItem, ExperienceItem } from "@/types/content";
import Section from "./Section";

// An entry plus its place in the stored list (the editor's buttons need it; the display order differs).
export type Indexed<T> = T & { index: number };

// The slots are for the editor: a button next to each heading, and controls under each entry.
export default async function Experience({
  action,
  entryActions,
  educationAction,
  educationActions,
}: {
  action?: React.ReactNode;
  entryActions?: (e: Indexed<ExperienceItem>) => React.ReactNode;
  educationAction?: React.ReactNode;
  educationActions?: (e: Indexed<EducationItem>) => React.ReactNode;
}) {
  const profile = await getProfile();
  // Current roles first, then by end date and start date (newest first).
  // `index` is the entry's place in the stored list (the admin buttons need it; display order differs).
  const experience = sortExperienceNewestFirst(profile.experience.map((e, index) => ({ ...e, index })));
  const education = sortExperienceNewestFirst(profile.education.map((e, index) => ({ ...e, index })));

  return (
    <Section id="experience" number="03" title="Experience" actions={action}>
      {experience.length === 0 ? (
        <p className="text-muted">Nothing here yet.</p>
      ) : (
        <ol className="pl-6">
          {experience.map((e, i) => (
            <TimelineItem key={`${e.company}-${e.startYear}-${e.startMonth}-${i}`} last={i === experience.length - 1}>
              <p className="inline-block rounded-full border border-border bg-card/60 px-3 py-0.5 font-mono text-xs text-muted">
                {formatPeriod(e)}
              </p>
              <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight">{e.role}</h3>
              <p className="mt-0.5 text-sm font-medium text-accent">
                {e.company}
                {e.location && <span className="font-normal text-muted"> · {e.location}</span>}
              </p>
              {e.summary && <FormattedText text={e.summary} className="mt-3 text-muted" />}
              <ProjectChips items={e.stack} className="mt-4" />
              {entryActions?.(e)}
            </TimelineItem>
          ))}
        </ol>
      )}

      {education.length > 0 && (
        <div className="mt-16">
          <div className="mb-8 flex items-center justify-between gap-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted">Education</h3>
            {educationAction}
          </div>
          <ol className="pl-6">
            {education.map((e, i) => (
              <TimelineItem key={`${e.school}-${e.startYear}-${e.startMonth}-${i}`} last={i === education.length - 1}>
                <p className="inline-block rounded-full border border-border bg-card/60 px-3 py-0.5 font-mono text-xs text-muted">
                  {formatPeriod(e)}
                </p>
                <h4 className="mt-3 text-lg font-semibold leading-snug tracking-tight">{e.degree}</h4>
                <p className="mt-0.5 text-sm font-medium text-accent">
                  {e.school}
                  {e.location && <span className="font-normal text-muted"> · {e.location}</span>}
                </p>
                {e.summary && <FormattedText text={e.summary} className="mt-3 text-muted" />}
                {educationActions?.(e)}
              </TimelineItem>
            ))}
          </ol>
        </div>
      )}
    </Section>
  );
}
