import FormattedText from "@/components/FormattedText";
import TimelineItem from "@/components/motion/TimelineItem";
import { formatPeriod, sortExperienceNewestFirst } from "@/lib/format";
import { getProfile } from "@/lib/settings";
import Section from "./Section";

export default async function Experience() {
  const profile = await getProfile();
  // Current roles first, then by end date and start date (newest first).
  const experience = sortExperienceNewestFirst(profile.experience);

  return (
    <Section id="experience" number="03" title="Experience">
      {experience.length === 0 ? (
        <p className="text-muted">Nothing here yet.</p>
      ) : (
        <ol className="pl-6">
          {experience.map((e, i) => (
            <TimelineItem key={`${e.company}-${e.startYear}-${e.startMonth}-${i}`} last={i === experience.length - 1}>
              <p className="font-mono text-xs text-muted">{formatPeriod(e)}</p>
              <h3 className="mt-1 font-semibold">
                {e.role} · {e.company}
              </h3>
              {e.summary && <FormattedText text={e.summary} className="mt-2 text-muted" />}
            </TimelineItem>
          ))}
        </ol>
      )}
      {profile.cvUrl && (
        <a
          href={profile.cvUrl}
          download
          className="mt-10 inline-block rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-card"
        >
          Download CV
        </a>
      )}
    </Section>
  );
}
