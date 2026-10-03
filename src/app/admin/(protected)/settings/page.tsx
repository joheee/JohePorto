import SettingsForm from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import { getProfile } from "@/lib/settings";

export default async function SettingsPage() {
  await requireAdmin();
  const profile = await getProfile();

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Site settings</h1>
      <p className="mb-8 text-sm text-muted">
        Your name, hero, about, experience and contact details. Saving updates the public site.
      </p>
      <SettingsForm initial={profile} />
    </div>
  );
}
