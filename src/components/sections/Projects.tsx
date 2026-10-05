import DeleteProjectButton from "@/components/admin/DeleteProjectButton";
import { ProjectButton } from "@/components/admin/SiteEditor";
import Reveal from "@/components/motion/Reveal";
import ProjectCard from "@/components/ProjectCard";
import type { Project } from "@/types/content";
import Section from "./Section";

export default function Projects({ projects, admin = false }: { projects: Project[]; admin?: boolean }) {
  return (
    <Section
      id="projects"
      number="02"
      title="Projects"
      actions={admin && <ProjectButton />}
    >
      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9s-2.1-.8-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2zM9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5" />
            </svg>
          </span>
          <p className="font-medium">Projects are on the way</p>
          <p className="mt-1 text-sm text-muted">Nothing to show yet. Check back soon.</p>
        </div>
      ) : (
        // One full-width card per project, stacked like the rest of the page.
        <ul className="space-y-6">
          {projects.map((p) => (
            <li key={p.slug}>
              <Reveal>
                <ProjectCard
                  project={p}
                  footer={
                    admin && (
                      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                        <ProjectButton project={p} />
                        <DeleteProjectButton slug={p.slug} title={p.title} />
                      </div>
                    )
                  }
                />
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
