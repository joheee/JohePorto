import { notFound } from "next/navigation";
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
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Edit project</h1>
      <ProjectForm initial={project} />
    </div>
  );
}
