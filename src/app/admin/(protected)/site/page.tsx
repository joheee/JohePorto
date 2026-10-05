import DeleteProjectButton from "@/components/admin/DeleteProjectButton";
import { EditButton, ItemActions, ProjectButton, SiteEditor } from "@/components/admin/SiteEditor";
import HomeSections, { type HomeSlots } from "@/components/sections/HomeSections";
import { requireAdmin } from "@/lib/auth";
import { entryLabel, entryName } from "@/lib/format";
import { getProjects } from "@/lib/projects";
import { getProfile } from "@/lib/settings";

// The public home page, section by section, with Edit and Delete buttons. It uses the very same section
// components as `/` (HomeSections), so the layout cannot drift apart. This file is the only place that
// hands the sections their admin controls, through slots.
export default async function AdminSitePage() {
  await requireAdmin();
  const [projects, profile] = await Promise.all([getProjects(), getProfile()]);
  const projectStacks = projects.flatMap((p) => p.stack.map((name) => ({ name, where: `Project: ${p.title}` })));

  const slots: HomeSlots = {
    hero: <EditButton section="hero" />,
    about: <EditButton section="about" />,
    projects: <ProjectButton />,
    projectCard: (p) => (
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <ProjectButton project={p} />
        <DeleteProjectButton slug={p.slug} title={p.title} />
      </div>
    ),
    experience: <EditButton section="experience" />,
    experienceEntry: (e) => <ItemActions kind="experience" index={e.index} label={entryLabel("experience", e)} name={entryName("experience", e)} />,
    education: <EditButton section="education" />,
    educationEntry: (e) => <ItemActions kind="education" index={e.index} label={entryLabel("education", e)} name={entryName("education", e)} />,
    contact: <EditButton section="contact" />,
  };

  return (
    // -mx-6 cancels the admin layout's side padding: the sections bring their own, as on the public page.
    <div className="-mx-6">
      <SiteEditor profile={profile} projectStacks={projectStacks}>
        <HomeSections projects={projects} preview slots={slots} />
      </SiteEditor>
    </div>
  );
}
