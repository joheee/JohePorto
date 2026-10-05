import { headers } from "next/headers";
import { adminDb } from "@/lib/firebase-admin";
import { cacheCheck, configCheck, deployCheck, firestoreCheck, overall, pdfCheck, robotsCheck, sessionCheck, sitemapCheck, type Check, type Status } from "@/lib/systemStatus";

const DOT: Record<Status, string> = { ok: "bg-emerald-500", warn: "bg-amber-500", fail: "bg-red-500" };
const WORD: Record<Status, string> = { ok: "ok", warn: "warning", fail: "failed" };
const SUMMARY: Record<Status, { text: string; tone: string }> = {
  ok: { text: "all systems operational", tone: "text-emerald-700 dark:text-emerald-400" },
  warn: { text: "degraded", tone: "text-amber-700 dark:text-amber-400" },
  fail: { text: "needs attention", tone: "text-red-600 dark:text-red-400" },
};

// The panel's frame: a shell command as its title, the overall verdict, then one line per check.
export function StatusPanel({ checks, loading = false }: { checks: Check[]; loading?: boolean }) {
  const verdict = SUMMARY[overall(checks)];
  return (
    <section aria-labelledby="status-title" className="rounded-2xl border border-border bg-card/60 p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="status-title" className="font-mono text-sm text-muted">
          <span aria-hidden className="text-emerald-700 dark:text-emerald-400">
            ${" "}
          </span>
          systemctl status portfolio
        </h2>
        <span className={`font-mono text-xs ${loading ? "text-muted" : verdict.tone}`}>{loading ? "checking…" : `● ${verdict.text}`}</span>
      </div>
      <ul className="space-y-2 font-mono text-sm" aria-busy={loading}>
        {checks.map((c) => (
          <li key={c.name} className="grid grid-cols-[0.5rem_6.5rem_minmax(0,1fr)] items-baseline gap-x-3 sm:grid-cols-[0.5rem_7rem_minmax(0,1fr)]">
            <span aria-hidden className={`h-2 w-2 self-center rounded-full ${loading ? "bg-border" : DOT[c.status]}`} />
            <span className="truncate">{c.name}</span>
            <span className="min-w-0 break-words text-muted">
              {loading ? "…" : c.detail}
              {!loading && <span className="sr-only"> ({WORD[c.status]})</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const NAMES = ["firestore", "site cache", "deploy", "config", "resume.pdf", "sitemap", "robots", "session"];
export const StatusSkeleton = () => <StatusPanel loading checks={NAMES.map((name) => ({ name, status: "ok", detail: "" }))} />;

// The address this very request came in on, so the checks ask the right server (localhost in dev, the domain on Vercel).
async function ownOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

// Runs every check, all at once, and shows them. The numbers come from the dashboard (when the cached data was
// read, when the admin session ends); the rest is asked of Firestore, the environment and the site itself.
export default async function SystemStatus({ readAt, expiresAt }: { readAt: string | null; expiresAt: number | null }) {
  const origin = await ownOrigin();
  const checks = await Promise.all([
    firestoreCheck(() => adminDb().doc("settings/profile").get()),
    Promise.resolve(cacheCheck(readAt)),
    Promise.resolve(deployCheck(process.env)),
    Promise.resolve(configCheck(process.env)),
    pdfCheck(origin),
    sitemapCheck(origin),
    robotsCheck(origin),
    Promise.resolve(sessionCheck(expiresAt)),
  ]);
  return <StatusPanel checks={checks} />;
}
