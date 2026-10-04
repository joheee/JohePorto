import Link from "next/link";
import Icon from "@/components/admin/Icons";
import ProjectForm from "@/components/admin/ProjectForm";
import { requireAdmin } from "@/lib/auth";
import { getProfile } from "@/lib/settings";

export default async function NewProjectPage() {
  await requireAdmin();
  const { skillGroups } = await getProfile();

  return (
    <div>
      <Link href="/admin/projects" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground">
        <Icon name="back" /> Projects
      </Link>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">New project</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Add a project to your portfolio. It appears on your site as soon as you create it.</p>
      </div>
      <ProjectForm skillGroups={skillGroups} />
    </div>
  );
}
