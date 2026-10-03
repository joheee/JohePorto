import Link from "next/link";
import DeleteProjectButton from "@/components/admin/DeleteProjectButton";
import { buttonClass, ghostButtonClass } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/auth";
import { formatMonthYear } from "@/lib/format";
import { getProjects } from "@/lib/projects";

export default async function AdminProjectsPage() {
  await requireAdmin();
  const projects = await getProjects();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <Link href="/admin/projects/new" className={buttonClass}>
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-muted">No projects yet. Create your first one.</p>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li
              key={p.slug}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{p.title}</p>
                <p className="text-sm text-muted">
                  {formatMonthYear(p.month, p.year)} · /{p.slug}
                  {p.stack.length > 0 && ` · ${p.stack.join(", ")}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/projects/${p.slug}`} className={ghostButtonClass}>
                  Edit
                </Link>
                <DeleteProjectButton slug={p.slug} title={p.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
