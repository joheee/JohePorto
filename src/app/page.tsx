import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Experience from "@/components/sections/Experience";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import { getProjects } from "@/lib/projects";
import { getProfile } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

export default async function Home() {
  const [projects, profile] = await Promise.all([getProjects(), getProfile()]);

  // Structured data: tells search engines who the site is about (schema.org Person + WebSite).
  const current = profile.experience.find((e) => e.current);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: profile.name,
        url: siteUrl,
        jobTitle: profile.roles[0],
        description: profile.pitch,
        sameAs: profile.socials.map((s) => s.href),
        knowsAbout: profile.skills,
        ...(profile.location && { homeLocation: { "@type": "Place", name: profile.location } }),
        ...(current && { worksFor: { "@type": "Organization", name: current.company } }),
      },
      { "@type": "WebSite", "@id": `${siteUrl}/#website`, url: siteUrl, name: profile.name, publisher: { "@id": `${siteUrl}/#person` } },
    ],
  };

  return (
    <>
      {/* "<" is escaped so profile text can never close the script tag (see the Next.js JSON-LD guide). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero />
      <About />
      <Projects projects={projects} />
      <Experience />
      {/* Latest posts section is added once the blog exists. */}
      <Contact />
    </>
  );
}
