import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Experience from "@/components/sections/Experience";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import { getProjects } from "@/lib/projects";

export default async function Home() {
  const projects = await getProjects();

  return (
    <>
      <Hero />
      <About />
      <Projects projects={projects} />
      <Experience />
      {/* Latest posts section is added once the blog exists. */}
      <Contact />
    </>
  );
}
