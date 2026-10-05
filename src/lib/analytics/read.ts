import { dayKey } from "./parse";
import { addDays, summarize, type Day, type DayData, type Summary } from "./summarize";

// Reads the counters for the Analytics page. The database is passed in, so it is tested with a fake.
type Snap = { docs: { id: string; data(): Record<string, unknown>; ref: unknown }[] };
type Query = { where(field: string, op: string, value: unknown): Query; limit(n: number): Query; get(): Promise<Snap> };
export type ReadDb = { collection(name: string): Query; batch(): { delete(ref: unknown): void; commit(): Promise<unknown> } };

const KEEP_HASH_DAYS = 2; // the daily visitor hashes are deleted once they are older than this
const DELETE_AT_MOST = 450; // per visit to the page (a batch holds 500)

// The period before is read in the same query as the period itself, then told apart by day.
export async function loadAnalytics(db: ReadDb, opts: { days: number; now?: Date; timeZone?: string }): Promise<Summary> {
  const { days } = opts;
  const to = dayKey(opts.now ?? new Date(), opts.timeZone ?? "UTC");
  const from = addDays(to, -(days - 1));
  const previousFrom = addDays(from, -days);

  const snap = await db.collection("analytics_days").where("day", ">=", previousFrom).where("day", "<=", to).get();
  const all: Day[] = snap.docs.map((d) => ({ day: d.id, data: d.data() as DayData }));
  const summary = summarize(
    all.filter((d) => d.day >= from),
    all.filter((d) => d.day < from),
    to,
    days,
  );

  await removeOldHashes(db, addDays(to, -KEEP_HASH_DAYS)).catch(() => {}); // housekeeping must never break the page
  return summary;
}

// The one thing that looks like a visitor, the hash that stops the same person being counted twice in a day, is
// not kept: anything older than two days is deleted whenever the Analytics page is opened.
export async function removeOldHashes(db: ReadDb, olderThan: string): Promise<number> {
  const old = await db.collection("analytics_seen").where("day", "<", olderThan).limit(DELETE_AT_MOST).get();
  if (old.docs.length === 0) return 0;
  const batch = db.batch();
  for (const d of old.docs) batch.delete(d.ref);
  await batch.commit();
  return old.docs.length;
}
