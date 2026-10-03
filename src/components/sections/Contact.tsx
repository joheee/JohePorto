import { getProfile } from "@/lib/settings";
import ContactForm from "./ContactForm";
import Section from "./Section";

export default async function Contact() {
  const profile = await getProfile();

  return (
    <Section id="contact" number="04" title="Contact">
      <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
        <div className="space-y-3 text-muted">
          <p>Have a project or a question? Send a message.</p>
          <a href={`mailto:${profile.email}`} className="block text-foreground underline">
            {profile.email}
          </a>
        </div>
        <ContactForm />
      </div>
    </Section>
  );
}
