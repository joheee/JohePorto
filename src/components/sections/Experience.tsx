import { Fragment } from "react";
import { formatDuration, revision, tenureMonths } from "@/lib/career";
import { formatPeriod, sortExperienceNewestFirst } from "@/lib/format";
import { getProfile } from "@/lib/settings";
import type { EducationItem, ExperienceItem } from "@/types/content";
import ReleaseRow, { YearDivider } from "./ReleaseRow";
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

  const now = new Date();
  const running = (e: { current: boolean; endYear: number | null }) => e.current || e.endYear === null;
  // The year an entry is filed under: when it ended, or this year while it is still going on.
  const yearOf = (e: { current: boolean; endYear: number | null }) => (running(e) ? now.getFullYear() : e.endYear!);
  // Newest first, so the first entry is "Latest" when you are still in it.
  const isLatest = (i: number, e: { current: boolean; endYear: number | null }) => i === 0 && running(e);

  return (
    <Section id="experience" number="03" title="Experience" actions={action}>
      {experience.length === 0 ? (
        <p className="text-muted">Nothing here yet.</p>
      ) : (
        <ol>
          {experience.map((e, i) => (
            <Fragment key={`${e.company}-${e.startYear}-${e.startMonth}-${i}`}>
              {(i === 0 || yearOf(e) !== yearOf(experience[i - 1])) && <YearDivider year={yearOf(e)} />}
              <ReleaseRow
                id={`exp-${e.index}`}
                tag={`v${revision(i, experience.length)}.0`}
                latest={isLatest(i, e)}
                period={formatPeriod(e)}
                duration={formatDuration(tenureMonths(e, now))}
                title={e.role}
                org={e.company}
                location={e.location}
                summary={e.summary}
                stack={e.stack}
                footer={entryActions?.(e)}
              />
            </Fragment>
          ))}
        </ol>
      )}

      {education.length > 0 && (
        <div className="mt-16">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted">Education</h3>
            {educationAction}
          </div>
          <ol>
            {education.map((e, i) => (
              <Fragment key={`${e.school}-${e.startYear}-${e.startMonth}-${i}`}>
                {(i === 0 || yearOf(e) !== yearOf(education[i - 1])) && <YearDivider year={yearOf(e)} />}
                <ReleaseRow
                  id={`edu-${e.index}`}
                  tag={`edu-${revision(i, education.length)}`}
                  latest={isLatest(i, e)}
                  period={formatPeriod(e)}
                  duration={formatDuration(tenureMonths(e, now))}
                  title={e.degree}
                  org={e.school}
                  location={e.location}
                  summary={e.summary}
                  summaryLabel="Highlights"
                  footer={educationActions?.(e)}
                />
              </Fragment>
            ))}
          </ol>
        </div>
      )}
    </Section>
  );
}
