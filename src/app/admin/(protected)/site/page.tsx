import { SiteEditor } from "@/components/admin/SiteEditor";
import HomeSections from "@/components/sections/HomeSections";
import { requireAdmin } from "@/lib/auth";
import { getProjects } from "@/lib/projects";
import { getProfile } from "@/lib/settings";

// The public home page, section by section, with Edit and Delete buttons. It uses the very same section
// components as `/` (with `admin`), so the layout cannot drift apart.
export default async function AdminSitePage() {
  await requireAdmin();
  const [projects, profile] = await Promise.all([getProjects(), getProfile()]);
  const projectStacks = projects.flatMap((p) => p.stack.map((name) => ({ name, where: `Project: ${p.title}` })));

  return (
    // -mx-6 cancels the admin layout's side padding: the sections bring their own, as on the public page.
    <div className="-mx-6">
      <SiteEditor profile={profile} projectStacks={projectStacks}>
        <HomeSections projects={projects} admin />
      </SiteEditor>
    </div>
  );
}
