import SpeedPanel from "@/components/admin/analytics/SpeedPanel";
import AnalyticsView from "@/components/admin/analytics/AnalyticsView";
import { requireAdmin } from "@/lib/auth";
import { analyticsEnabled } from "@/lib/analytics/collect";
import { parseRange } from "@/lib/analytics/range";
import { loadAnalytics, type ReadDb } from "@/lib/analytics/read";
import { adminDb } from "@/lib/firebase-admin";
import { loadRuns, type SpeedDb } from "@/lib/pagespeed/store";
import { siteUrl } from "@/lib/site";

export const metadata = { title: "Analytics" };

// The "Run test" button on this page runs a PageSpeed test as a Server Action, which takes about half a minute
// (the platform default is shorter). This sets the limit for every action used on the page.
export const maxDuration = 60;

const LOCAL = /^https?:\/\/(localhost|127\.|\[::1\])/;

// Visits to the public home page: totals, where they come from, how far they get, what they click.
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  await requireAdmin();
  const range = parseRange((await searchParams).range);
  const timeZone = process.env.ANALYTICS_TIMEZONE || "UTC";

  let summary;
  try {
    summary = await loadAnalytics(adminDb() as unknown as ReadDb, { days: range, timeZone });
  } catch (e) {
    console.error("analytics: could not read the counters", e instanceof Error ? e.message : e);
    summary = null;
  }
  if (!summary) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          The counters could not be read from Firestore. Reload the page, or check the system status on the dashboard.
        </p>
      </div>
    );
  }
  let runs: Awaited<ReturnType<typeof loadRuns>> = [];
  try {
    runs = await loadRuns(adminDb() as unknown as SpeedDb);
  } catch (e) {
    console.error("pagespeed: could not read the earlier runs", e instanceof Error ? e.message : e);
  }
  const speed = <SpeedPanel runs={runs} testUrl={siteUrl} disabledReason={LOCAL.test(siteUrl) ? "Google can only test a public address, so this works on the live site, not on localhost." : undefined} />;
  return <AnalyticsView summary={summary} range={range} collecting={analyticsEnabled(process.env)} siteUrl={siteUrl} timeZone={timeZone} speed={speed} />;
}
