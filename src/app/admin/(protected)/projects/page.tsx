import Link from "next/link";
import DeleteProjectButton from "@/components/admin/DeleteProjectButton";
import Icon from "@/components/admin/Icons";
import { buttonClass, ghostButtonClass } from "@/components/admin/fields";
import ProjectCardContent from "@/components/ProjectCardContent";
import { requireAdmin } from "@/lib/auth";
import { getProjects } from "@/lib/projects";

export default async function AdminProjectsPage() {
  await requireAdmin();
  const projects = await getProjects();

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            This is how your projects look on the site, oldest first. Edit or delete them from here.
          </p>
        </div>
        <Link href="/admin/projects/new" className={buttonClass}>
          <Icon name="plus" /> New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Icon name="folder" className="h-6 w-6" />
          </span>
          <p className="font-medium">No projects yet</p>
          <p className="mt-1 text-sm text-muted">Add your first one and it shows up on your site.</p>
          <Link href="/admin/projects/new" className={`${buttonClass} mt-6`}>
            <Icon name="plus" /> New project
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.slug}>
              {/* Same card as the public site (shared ProjectCardContent), plus the admin actions. */}
              <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6">
                <ProjectCardContent project={p} />
                <div className="relative mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <Link href={`/admin/projects/${p.slug}`} className={ghostButtonClass}>
                    <Icon name="edit" className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <DeleteProjectButton slug={p.slug} title={p.title} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
