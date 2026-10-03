import ProjectForm from "@/components/admin/ProjectForm";
import { requireAdmin } from "@/lib/auth";

export default async function NewProjectPage() {
  await requireAdmin();

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">New project</h1>
      <ProjectForm />
    </div>
  );
}
