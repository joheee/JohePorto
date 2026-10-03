import Reveal from "@/components/motion/Reveal";
import { profile } from "@/lib/content";
import Section from "./Section";

const tile =
  "h-full rounded-2xl border border-border bg-card p-6 transition-colors hover:border-accent";

export default function About() {
  return (
    <Section id="about" number="01" title="About">
      {/* Bento grid: tiles of different sizes. */}
      <div className="grid gap-4 md:grid-cols-4 md:grid-rows-[auto_auto]">
        <Reveal delay={0} className="md:col-span-2 md:row-span-2">
          <div className={`${tile} space-y-4 text-lg leading-8`}>
            {profile.bio.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="md:col-span-2">
          <div className={tile}>
            <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">
              Skills
            </h3>
            <ul className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <li key={s} className="rounded-full border border-border px-3 py-1 text-sm">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className={tile}>
            <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
              Location
            </h3>
            <p className="font-medium">{profile.location}</p>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <div className={tile}>
            <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
              Status
            </h3>
            <p className="flex items-center gap-2 font-medium">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              {profile.status}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.4} className="md:col-span-4">
          <div className={tile}>
            <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
              Now
            </h3>
            <p className="text-muted">{profile.focus}</p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
