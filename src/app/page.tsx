import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Experience from "@/components/sections/Experience";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import { projects } from "@/lib/content";

export default function Home() {
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
