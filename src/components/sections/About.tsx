import { Fragment } from "react";
import PingDot from "@/components/PingDot";
import Reveal from "@/components/motion/Reveal";
import { getProfile } from "@/lib/settings";
import EditorWindow, { EditorLine } from "./EditorWindow";
import Section from "./Section";
import SkillsPipeline from "./SkillsPipeline";

const label = "mb-6 font-mono text-xs uppercase tracking-widest text-muted";

// A key: value line like front matter. Mono, the key in the accent colour.
function Fact({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <EditorLine>
      <div className="flex gap-3 font-mono text-sm leading-7">
        <span className="w-[9ch] shrink-0 text-accent">{name}:</span>
        <span className="min-w-0 break-words">{children}</span>
      </div>
    </EditorLine>
  );
}

export default async function About({ action }: { action?: React.ReactNode }) {
  const profile = await getProfile();
  const hasFacts = !!(profile.location || profile.status || profile.focus);

  return (
    <Section id="about" number="01" title="About" actions={action}>
      <div className="space-y-12">
        {/* One window instead of a card each for the bio, location, status and now. */}
        {(profile.bio.length > 0 || hasFacts) && (
          <Reveal>
            <EditorWindow filename="README.md">
              <EditorLine>
                <span className="font-mono text-sm leading-7">
                  <span className="text-muted"># </span>
                  <span className="font-medium">About me</span>
                </span>
              </EditorLine>
              <EditorLine />
              {profile.bio.map((p, i) => (
                <Fragment key={p}>
                  {i > 0 && <EditorLine />}
                  <EditorLine>
                    <p className="max-w-3xl text-[17px] leading-7">{p}</p>
                  </EditorLine>
                </Fragment>
              ))}
              {hasFacts && (
                <>
                  <EditorLine />
                  <EditorLine>
                    <span className="font-mono text-sm leading-7">
                      <span className="text-muted">## </span>
                      <span className="font-medium">At a glance</span>
                    </span>
                  </EditorLine>
                  {profile.location && <Fact name="location">{profile.location}</Fact>}
                  {profile.status && (
                    <Fact name="status">
                      <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <PingDot />
                        {profile.status}
                      </span>
                    </Fact>
                  )}
                  {profile.focus && <Fact name="now">{profile.focus}</Fact>}
                </>
              )}
            </EditorWindow>
          </Reveal>
        )}

        {profile.skillGroups.length > 0 && (
          <Reveal delay={0.1}>
            <h3 className={label}>Skills</h3>
            <SkillsPipeline groups={profile.skillGroups} />
          </Reveal>
        )}
      </div>
    </Section>
  );
}
