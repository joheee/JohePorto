import Reveal from "@/components/motion/Reveal";
import { getProfile } from "@/lib/settings";
import Section from "./Section";

const tile =
  "h-full rounded-2xl border border-border bg-card p-6 transition-colors hover:border-accent";

const label = "mb-3 font-mono text-xs uppercase tracking-widest text-muted";

export default async function About() {
  const profile = await getProfile();

  return (
    <Section id="about" number="01" title="About">
      {/* Bento grid: tiles of different sizes. Empty fields hide their tile. */}
      <div className="grid gap-4 md:grid-cols-4 md:grid-rows-[auto_auto]">
        {profile.bio.length > 0 && (
          <Reveal delay={0} className="md:col-span-2 md:row-span-2">
            <div className={`${tile} space-y-4 text-lg leading-8`}>
              {profile.bio.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
        )}

        {profile.skills.length > 0 && (
          <Reveal delay={0.1} className="md:col-span-2">
            <div className={tile}>
              <h3 className={label}>Skills</h3>
              <ul className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <li key={s} className="rounded-full border border-border px-3 py-1 text-sm">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}

        {profile.location && (
          <Reveal delay={0.2}>
            <div className={tile}>
              <h3 className={label}>Location</h3>
              <p className="font-medium">{profile.location}</p>
            </div>
          </Reveal>
        )}

        {profile.status && (
          <Reveal delay={0.3}>
            <div className={tile}>
              <h3 className={label}>Status</h3>
              <p className="flex items-center gap-2 font-medium">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                {profile.status}
              </p>
            </div>
          </Reveal>
        )}

        {profile.focus && (
          <Reveal delay={0.4} className="md:col-span-4">
            <div className={tile}>
              <h3 className={label}>Now</h3>
              <p className="text-muted">{profile.focus}</p>
            </div>
          </Reveal>
        )}
      </div>
    </Section>
  );
}
