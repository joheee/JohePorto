import SettingsForm from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import { getProjects } from "@/lib/projects";
import { getProfile } from "@/lib/settings";

export default async function SettingsPage() {
  await requireAdmin();
  const [profile, projects] = await Promise.all([getProfile(), getProjects()]);
  const projectStacks = projects.flatMap((p) => p.stack.map((name) => ({ name, where: `Project: ${p.title}` })));

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Site settings</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Your name, hero, about, experience and contact details. Saving updates the public site.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          View site ↗
        </a>
      </div>
      <SettingsForm initial={profile} projectStacks={projectStacks} />
    </div>
  );
}
