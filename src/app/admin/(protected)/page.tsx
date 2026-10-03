import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

const collections = ["posts", "projects", "messages"] as const;

export default async function AdminDashboard() {
  await requireAdmin();

  const db = adminDb();
  const counts = await Promise.all(
    collections.map(async (c) => (await db.collection(c).count().get()).data().count),
  );

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Dashboard</h1>
      <ul className="grid gap-4 sm:grid-cols-3">
        {collections.map((c, i) => (
          <li key={c} className="rounded-2xl border border-border bg-card p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">{c}</p>
            <p className="mt-2 text-4xl font-bold">{counts[i]}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
