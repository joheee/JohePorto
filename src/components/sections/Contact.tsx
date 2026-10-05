import CopyEmail from "@/components/CopyEmail";
import PingDot from "@/components/PingDot";
import SocialLinks from "@/components/SocialLinks";
import { getProfile } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import ContactForm from "./ContactForm";
import Section from "./Section";

const label = "mb-2 font-mono text-xs uppercase tracking-widest text-muted";

// `inertForm`: show the form but disable it (the editor preview: it would send a real message).
export default async function Contact({ number = "04", action, inertForm = false }: { number?: string; action?: React.ReactNode; inertForm?: boolean }) {
  const profile = await getProfile();

  return (
    <Section id="contact" number={number} title="Contact" actions={action}>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-8">
          <p className="text-lg leading-8 text-muted">
            Have a project, a role in mind or just a question? Send a message and I&apos;ll get back to you.
          </p>

          <div>
            <p className={label}>Email</p>
            <div className="flex flex-wrap items-center gap-3">
              <a href={`mailto:${profile.email}`} className="break-all text-lg font-medium underline-offset-4 hover:text-accent hover:underline">
                {profile.email}
              </a>
              <CopyEmail email={profile.email} />
            </div>
          </div>

          {profile.socials.length > 0 && (
            <div>
              <p className={label}>Elsewhere</p>
              <SocialLinks socials={profile.socials} variant="contact" />
            </div>
          )}

          {profile.status && (
            <p className="flex items-center gap-2.5 text-sm text-muted">
              <PingDot />
              {profile.status}
            </p>
          )}
        </div>

        {inertForm ? <div inert className="opacity-70"><ContactForm origin={siteUrl} /></div> : <ContactForm origin={siteUrl} />}
      </div>
    </Section>
  );
}
