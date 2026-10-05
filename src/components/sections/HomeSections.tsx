import CursorGlow from "@/components/motion/CursorGlow";
import type { Project } from "@/types/content";
import About from "./About";
import Contact from "./Contact";
import Experience, { type Indexed } from "./Experience";
import Hero from "./Hero";
import Projects from "./Projects";
import type { EducationItem, ExperienceItem } from "@/types/content";

// Extra controls the editor (/admin/site) places inside the sections. The sections know nothing about
// admin code: the public page passes none, and only the admin page imports and builds these.
export type HomeSlots = {
  hero?: React.ReactNode;
  about?: React.ReactNode;
  projects?: React.ReactNode;
  projectCard?: (p: Project) => React.ReactNode;
  experience?: React.ReactNode;
  experienceEntry?: (e: Indexed<ExperienceItem>) => React.ReactNode;
  education?: React.ReactNode;
  educationEntry?: (e: Indexed<EducationItem>) => React.ReactNode;
  contact?: React.ReactNode;
};

// The home page, section by section. Used by `/` and by `/admin/site` (`preview`: in-page links stay on
// the page and the contact form is disabled), so a new section or order only has to be changed here.
export default function HomeSections({ projects, preview = false, slots = {} }: { projects: Project[]; preview?: boolean; slots?: HomeSlots }) {
  return (
    <>
      <CursorGlow />
      <Hero action={slots.hero} anchorBase={preview ? "" : "/"} />
      <About action={slots.about} />
      <Projects projects={projects} action={slots.projects} cardFooter={slots.projectCard} />
      <Experience action={slots.experience} entryActions={slots.experienceEntry} educationAction={slots.education} educationActions={slots.educationEntry} />
      {/* Latest posts section is added once the blog exists. */}
      <Contact action={slots.contact} inertForm={preview} />
    </>
  );
}
