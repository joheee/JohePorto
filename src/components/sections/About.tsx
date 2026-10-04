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
      {/* Bento grid: bio on the left, location / status / now stacked on the right, skills as a full-width row below. On phones skills come right after the bio. Empty fields hide their tile. */}
      <div className="grid gap-4 md:grid-cols-4">
        {profile.bio.length > 0 && (
          <Reveal delay={0} className="md:col-span-2 md:row-span-2">
            <div className={`${tile} space-y-4 text-lg leading-8`}>
              {profile.bio.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
        )}

        {profile.location && (
          <Reveal delay={0.2} className="max-md:order-2">
            <div className={tile}>
              <h3 className={label}>Location</h3>
              <p className="font-medium">{profile.location}</p>
            </div>
          </Reveal>
        )}

        {profile.status && (
          <Reveal delay={0.3} className="max-md:order-2">
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
          <Reveal delay={0.4} className="max-md:order-2 md:col-span-2">
            <div className={tile}>
              <h3 className={label}>Now</h3>
              <p className="text-muted">{profile.focus}</p>
            </div>
          </Reveal>
        )}

        {profile.skillGroups.length > 0 && (
          <Reveal delay={0.1} className="max-md:order-1 md:col-span-4">
            <div className={tile}>
              <h3 className={label}>Skills</h3>
              {/* One row per group: name on the left, its skills on the right, a divider between rows.
                  A lone group is the old flat list: no name column, it would only repeat "Skills". */}
              <dl className="divide-y divide-border">
                {profile.skillGroups.map((g) => (
                  <div
                    key={g.name}
                    className={`grid gap-3 py-5 first:pt-1 last:pb-0 ${profile.skillGroups.length > 1 ? "sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8" : ""}`}
                  >
                    {profile.skillGroups.length > 1 && <dt className="text-sm font-medium text-muted sm:pt-1">{g.name}</dt>}
                    <dd>
                      <ul className="flex flex-wrap gap-2">
                        {g.items.map((s) => (
                          <li
                            key={s.name}
                            className="cursor-default rounded-full border border-border px-3 py-1 text-sm transition duration-200 hover:border-accent hover:bg-accent/10 hover:text-accent motion-safe:hover:-translate-y-0.5"
                          >
                            {s.name}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        )}
      </div>
    </Section>
  );
}
