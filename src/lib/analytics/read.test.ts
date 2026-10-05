import { describe, expect, it } from "vitest";
import { loadAnalytics, removeOldHashes, type ReadDb } from "./read";

type Doc = { id: string; data: Record<string, unknown> };

// A fake Firestore with two collections: it understands where() on one field, limit() and batched deletes.
function fakeDb(days: Doc[], seen: Doc[] = []) {
  const stores: Record<string, Doc[]> = { analytics_days: days, analytics_seen: seen };
  const deleted: string[] = [];
  const query = (name: string, filters: { field: string; op: string; value: string }[] = [], max = Infinity) => ({
    where: (field: string, op: string, value: unknown) => query(name, [...filters, { field, op, value: value as string }], max),
    limit: (n: number) => query(name, filters, n),
    get: async () => ({
      docs: stores[name]
        .filter((d) => filters.every((f) => (f.op === ">=" ? (d.data[f.field] as string) >= f.value : f.op === "<=" ? (d.data[f.field] as string) <= f.value : (d.data[f.field] as string) < f.value)))
        .slice(0, max)
        .map((d) => ({ id: d.id, data: () => d.data, ref: `${name}/${d.id}` })),
    }),
  });
  const db: ReadDb = { collection: (name) => query(name), batch: () => ({ delete: (ref) => void deleted.push(ref as string), commit: async () => undefined }) };
  return { db, deleted };
}

const day = (key: string, data: Record<string, unknown>): Doc => ({ id: key, data: { day: key, ...data } });
const NOW = new Date("2026-10-06T10:00:00Z");

describe("loadAnalytics", () => {
  const days = [
    day("2026-09-20", { views: 99 }), // before both periods
    day("2026-09-30", { views: 10, visitors: 5 }), // the period before (7 days: Sep 23 to Sep 29... see below)
    day("2026-10-01", { views: 20, visitors: 8 }),
    day("2026-10-06", { views: 30, visitors: 12, bots: 4, ref: { "linkedin.com": 30 } }),
  ];

  it("adds up the days of the period and compares them with the period before", async () => {
    const { db } = fakeDb(days);
    const s = await loadAnalytics(db, { days: 7, now: NOW });
    expect(s.from).toBe("2026-09-30");
    expect(s.to).toBe("2026-10-06");
    expect(s.totals.views).toBe(60); // Sep 30, Oct 1 and Oct 6
    expect(s.series.map((d) => d.day)).toEqual(["2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06"]);
    expect(s.referrers[0].key).toBe("linkedin.com");
  });

  it("uses the days just before the period as the comparison, and leaves older ones out", async () => {
    const { db } = fakeDb([day("2026-09-25", { views: 30 }), day("2026-09-20", { views: 500 }), day("2026-10-06", { views: 60 })]);
    const s = await loadAnalytics(db, { days: 7, now: NOW });
    expect(s.change.views).toBe(100); // 60 against 30; the 500 is two periods ago
  });

  it("is empty for a site nobody has visited", async () => {
    const { db } = fakeDb([]);
    expect((await loadAnalytics(db, { days: 30, now: NOW })).hasData).toBe(false);
  });

  it("counts days in the time zone it is given", async () => {
    const { db } = fakeDb([day("2026-10-07", { views: 3 })]);
    const s = await loadAnalytics(db, { days: 1, now: new Date("2026-10-06T20:00:00Z"), timeZone: "Asia/Jakarta" }); // already Oct 7 there
    expect(s.to).toBe("2026-10-07");
    expect(s.totals.views).toBe(3);
  });

  it("deletes old visitor hashes as it goes, and still answers if that fails", async () => {
    const { db, deleted } = fakeDb([], [day("2026-10-06_a", { day: "2026-10-01" }), day("2026-10-06_b", { day: "2026-10-05" })]);
    await loadAnalytics(db, { days: 7, now: NOW });
    expect(deleted).toEqual(["analytics_seen/2026-10-06_a"]); // older than two days; Oct 5 is kept

    const broken = { ...db, batch: () => { throw new Error("nope"); } } as ReadDb;
    await expect(loadAnalytics(broken, { days: 7, now: NOW })).resolves.toMatchObject({ days: 7 });
  });
});

describe("removeOldHashes", () => {
  it("deletes only what is older than the day it is given, and reports how many", async () => {
    const { db, deleted } = fakeDb([], [day("a", { day: "2026-10-03" }), day("b", { day: "2026-10-04" }), day("c", { day: "2026-10-05" })]);
    expect(await removeOldHashes(db, "2026-10-05")).toBe(2);
    expect(deleted).toEqual(["analytics_seen/a", "analytics_seen/b"]);
  });
  it("does nothing when there is nothing old", async () => {
    const { db, deleted } = fakeDb([], [day("c", { day: "2026-10-05" })]);
    expect(await removeOldHashes(db, "2026-10-01")).toBe(0);
    expect(deleted).toEqual([]);
  });
});
