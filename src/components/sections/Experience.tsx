import Timeline from "@/components/Timeline";
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
        <Timeline
          entries={experience.map((e) => ({
            key: `${e.company}-${e.startYear}-${e.startMonth}`,
            period: formatPeriod(e),
            title: e.role,
            org: e.company,
            location: e.location,
            summary: e.summary,
            stack: e.stack,
            footer: entryActions?.(e),
          }))}
        />
      )}

      {education.length > 0 && (
        <div className="mt-16">
          <div className="mb-8 flex items-center justify-between gap-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted">Education</h3>
            {educationAction}
          </div>
          <Timeline
            headingLevel={4}
            entries={education.map((e) => ({
              key: `${e.school}-${e.startYear}-${e.startMonth}`,
              period: formatPeriod(e),
              title: e.degree,
              org: e.school,
              location: e.location,
              summary: e.summary,
              footer: educationActions?.(e),
            }))}
          />
        </div>
      )}
    </Section>
  );
}
