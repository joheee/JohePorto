import Reveal from "@/components/motion/Reveal";
import { experience, profile } from "@/lib/content";
import Section from "./Section";

export default function Experience() {
  return (
    <Section id="experience" number="03" title="Experience">
      <ol className="space-y-8 border-l border-border pl-6">
        {experience.map((e, i) => (
          <li key={`${e.company}-${e.period}`}>
            <Reveal delay={i * 0.15} className="relative">
              <span className="absolute -left-[1.9rem] top-2 h-2 w-2 rounded-full bg-accent" />
              <p className="font-mono text-xs text-muted">{e.period}</p>
              <h3 className="mt-1 font-semibold">
                {e.role} · {e.company}
              </h3>
              <p className="mt-2 text-muted">{e.summary}</p>
            </Reveal>
          </li>
        ))}
      </ol>
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
