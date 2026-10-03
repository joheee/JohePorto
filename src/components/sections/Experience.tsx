import Reveal from "@/components/motion/Reveal";
import { getProfile } from "@/lib/settings";
import Section from "./Section";

export default async function Experience() {
  const profile = await getProfile();

  return (
    <Section id="experience" number="03" title="Experience">
      {profile.experience.length === 0 ? (
        <p className="text-muted">Nothing here yet.</p>
      ) : (
        <ol className="space-y-8 border-l border-border pl-6">
          {profile.experience.map((e, i) => (
            <li key={`${e.company}-${e.period}-${i}`}>
              <Reveal delay={i * 0.15} className="relative">
                <span className="absolute -left-[1.9rem] top-2 h-2 w-2 rounded-full bg-accent" />
                {e.period && <p className="font-mono text-xs text-muted">{e.period}</p>}
                <h3 className="mt-1 font-semibold">
                  {e.role} · {e.company}
                </h3>
                {e.summary && <p className="mt-2 text-muted">{e.summary}</p>}
              </Reveal>
            </li>
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
