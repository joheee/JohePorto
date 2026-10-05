import AnalyticsView from "@/components/admin/analytics/AnalyticsView";
import { requireAdmin } from "@/lib/auth";
import { analyticsEnabled } from "@/lib/analytics/collect";
import { parseRange } from "@/lib/analytics/range";
import { loadAnalytics, type ReadDb } from "@/lib/analytics/read";
import { adminDb } from "@/lib/firebase-admin";
import { siteUrl } from "@/lib/site";

export const metadata = { title: "Analytics" };

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
  return <AnalyticsView summary={summary} range={range} collecting={analyticsEnabled(process.env)} siteUrl={siteUrl} timeZone={timeZone} />;
}
