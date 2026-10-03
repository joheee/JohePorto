import SettingsForm from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import { getProfile } from "@/lib/settings";

export default async function SettingsPage() {
  await requireAdmin();
  const profile = await getProfile();

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
      <SettingsForm initial={profile} />
    </div>
  );
}
