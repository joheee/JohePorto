import FormattedText from "@/components/FormattedText";
import { ProjectChips } from "@/components/ProjectCard";
import TimelineItem from "@/components/motion/TimelineItem";
import { formatPeriod, sortExperienceNewestFirst } from "@/lib/format";
import { getProfile } from "@/lib/settings";
import Section from "./Section";

export default async function Experience() {
  const profile = await getProfile();
  // Current roles first, then by end date and start date (newest first).
  const experience = sortExperienceNewestFirst(profile.experience);
  const education = sortExperienceNewestFirst(profile.education);

  return (
    <Section id="experience" number="03" title="Experience">
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
            </TimelineItem>
          ))}
        </ol>
      )}

      {education.length > 0 && (
        <div className="mt-16">
          <h3 className="mb-8 font-mono text-xs uppercase tracking-widest text-muted">Education</h3>
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
              </TimelineItem>
            ))}
          </ol>
        </div>
      )}
    </Section>
  );
}
