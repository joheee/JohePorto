import type { PageSpeedRun } from "./model";

// Keeps the test results in Firestore (`pagespeed_runs`, written and read by the Admin SDK only; it is not in
// firestore.rules, so clients are denied) so the Analytics page can show a trend. The database is passed in.
type Snap = { docs: { id: string; data(): Record<string, unknown> }[] };
export type SpeedDb = {
  collection(name: string): {
    add(data: object): Promise<unknown>;
    orderBy(field: string, dir: "desc"): { limit(n: number): { get(): Promise<Snap> } };
  };
};

const COLLECTION = "pagespeed_runs";

export async function saveRuns(db: SpeedDb, runs: PageSpeedRun[]): Promise<void> {
  for (const r of runs) {
    const run: Partial<PageSpeedRun> = { ...r };
    delete run.id; // the document id is Firestore's
    await db.collection(COLLECTION).add(run);
  }
}

// Newest first. ISO times sort as text, so no index is needed.
export async function loadRuns(db: SpeedDb, limit = 30): Promise<PageSpeedRun[]> {
  const snap = await db.collection(COLLECTION).orderBy("at", "desc").limit(limit).get();
  return snap.docs.map((d) => ({ ...(d.data() as Omit<PageSpeedRun, "id">), id: d.id }));
}

// The latest run of each device, for the headline numbers.
export function latestByStrategy(runs: PageSpeedRun[]): Partial<Record<PageSpeedRun["strategy"], PageSpeedRun>> {
  const out: Partial<Record<PageSpeedRun["strategy"], PageSpeedRun>> = {};
  for (const r of runs) out[r.strategy] ??= r; // runs are newest first
  return out;
}
