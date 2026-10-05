import { EditButton } from "@/components/admin/SiteEditor";
import CopyEmail from "@/components/CopyEmail";
import PingDot from "@/components/PingDot";
import { getProfile } from "@/lib/settings";
import ContactForm from "./ContactForm";
import Section from "./Section";

const label = "mb-2 font-mono text-xs uppercase tracking-widest text-muted";

export default async function Contact({ admin = false }: { admin?: boolean }) {
  const profile = await getProfile();

  return (
    <Section id="contact" number="04" title="Contact" actions={admin && <EditButton section="contact" />}>
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
              <ul className="space-y-2">
                {profile.socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-foreground transition-colors hover:text-accent"
                    >
                      {s.label}
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M7 17 17 7M8 7h9v9" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profile.status && (
            <p className="flex items-center gap-2.5 text-sm text-muted">
              <PingDot />
              {profile.status}
            </p>
          )}
        </div>

        {/* On /admin/site the form is only for show: it would send a real message. */}
        {admin ? <div inert className="opacity-70"><ContactForm /></div> : <ContactForm />}
      </div>
    </Section>
  );
}
