import CursorGlow from "@/components/motion/CursorGlow";
import type { Project } from "@/types/content";
import About from "./About";
import Contact from "./Contact";
import Experience from "./Experience";
import Hero from "./Hero";
import Projects from "./Projects";

// The home page, section by section. Used by `/` and by `/admin/site` (`admin`: with Edit and Delete
// buttons), so a new section or a new order only has to be changed here.
export default function HomeSections({ projects, admin = false }: { projects: Project[]; admin?: boolean }) {
  return (
    <>
      <CursorGlow />
      <Hero admin={admin} />
      <About admin={admin} />
      <Projects projects={projects} admin={admin} />
      <Experience admin={admin} />
      {/* Latest posts section is added once the blog exists. */}
      <Contact admin={admin} />
    </>
  );
}
