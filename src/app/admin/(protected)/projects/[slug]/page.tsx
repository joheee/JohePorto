import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/admin/Icons";
import ProjectForm from "@/components/admin/ProjectForm";
import { requireAdmin } from "@/lib/auth";
import { getProject } from "@/lib/projects";
import { SLUG_RE } from "@/lib/validation";

export default async function EditProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) notFound();

  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <div>
      <Link href="/admin/projects" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground">
        <Icon name="back" /> Projects
      </Link>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Edit project</h1>
        <p className="mt-2 max-w-xl truncate text-sm leading-6 text-muted">{project.title}</p>
      </div>
      <ProjectForm initial={project} />
    </div>
  );
}
