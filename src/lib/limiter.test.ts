import { describe, expect, it } from "vitest";
import { blockedFor, clearHits, clientIp, consume, limiterKey, pruneLimits, recordHit, retryAfterSeconds, waitFor, type LimitDb } from "./limiter";

// A Firestore stand-in: documents in a Map, transactions run one after another.
function fakeDb() {
  const docs = new Map<string, Record<string, unknown>>();
  const ref = (id: string) => ({
    id,
    get: async () => ({ exists: docs.has(id), data: () => docs.get(id) }),
    delete: async () => void docs.delete(id),
  });
  const db = {
    collection: () => ({ doc: ref }),
    runTransaction: async <T,>(fn: (tx: { get(r: { id?: string }): Promise<unknown>; set(r: { id?: string }, d: Record<string, unknown>): void }) => Promise<T>) =>
      fn({ get: (r) => (r as ReturnType<typeof ref>).get(), set: (r, d) => void docs.set(r.id!, d) }),
  };
  return { db: db as unknown as LimitDb, docs };
}

const MIN = 60_000;
const rule = { limit: 3, windowMs: 10 * MIN };

describe("waitFor", () => {
  it("is 0 while there is room", () => {
    expect(waitFor([], rule, 1000)).toBe(0);
    expect(waitFor([0, 1], rule, 1000)).toBe(0);
  });
  it("waits for the oldest hit in the window to age out", () => {
    expect(waitFor([0, 1000, 2000], rule, 3000)).toBe(10 * MIN - 3000);
  });
  it("ignores hits that are already outside the window", () => {
    expect(waitFor([0, 1000, 2000], rule, 11 * MIN)).toBe(0);
  });
  it("frees a place as soon as enough old hits have expired", () => {
    // limit 3 with 4 recent hits: two must age out before one more is allowed
    expect(waitFor([0, 100, 200, 300], rule, 400)).toBe(100 + 10 * MIN - 400);
  });
});

describe("consume", () => {
  it("allows up to the limit, then says how long to wait, and counts nothing when refused", async () => {
    const { db, docs } = fakeDb();
    const entries = [{ key: "a", rules: [rule] }];
    for (let i = 0; i < 3; i++) expect(await consume(db, entries, 1000 + i)).toEqual({ ok: true });
    const refused = await consume(db, entries, 5000);
    expect(refused).toEqual({ ok: false, retryAfterMs: 1000 + 10 * MIN - 5000 });
    expect((docs.get("a")!.hits as number[]).length).toBe(3);
  });

  it("allows again once the window has passed", async () => {
    const { db } = fakeDb();
    for (let i = 0; i < 3; i++) await consume(db, [{ key: "a", rules: [rule] }], i);
    expect(await consume(db, [{ key: "a", rules: [rule] }], 10 * MIN + 10)).toEqual({ ok: true });
  });

  it("checks every rule: a short burst limit and a daily limit", async () => {
    const { db } = fakeDb();
    const rules = [rule, { limit: 4, windowMs: 24 * 60 * MIN }];
    for (let i = 0; i < 3; i++) await consume(db, [{ key: "a", rules }], i);
    // after the 10-minute window the burst rule is free, but the daily limit of 4 allows only one more
    expect(await consume(db, [{ key: "a", rules }], 20 * MIN)).toEqual({ ok: true });
    expect((await consume(db, [{ key: "a", rules }], 40 * MIN)).ok).toBe(false);
  });

  it("counts the visitor and the whole site together, and refuses everything if one is full", async () => {
    const { db, docs } = fakeDb();
    const site = { key: "site", rules: [{ limit: 2, windowMs: MIN }] };
    expect((await consume(db, [{ key: "v1", rules: [rule] }, site], 1)).ok).toBe(true);
    expect((await consume(db, [{ key: "v2", rules: [rule] }, site], 2)).ok).toBe(true);
    expect((await consume(db, [{ key: "v3", rules: [rule] }, site], 3)).ok).toBe(false);
    expect(docs.has("v3")).toBe(false); // a refused visitor is not counted either
    expect((docs.get("site")!.hits as number[]).length).toBe(2);
  });

  it("keeps different visitors apart", async () => {
    const { db } = fakeDb();
    for (let i = 0; i < 3; i++) await consume(db, [{ key: "a", rules: [rule] }], i);
    expect((await consume(db, [{ key: "a", rules: [rule] }], 10)).ok).toBe(false);
    expect((await consume(db, [{ key: "b", rules: [rule] }], 10)).ok).toBe(true);
  });
});

describe("blockedFor, recordHit, clearHits", () => {
  it("counts only what is recorded, and blocks at the limit", async () => {
    const { db } = fakeDb();
    const r = { limit: 5, windowMs: 5 * MIN };
    expect(await blockedFor(db, "k", r, 0)).toBe(0);
    for (let i = 0; i < 4; i++) await recordHit(db, "k", r.windowMs, i);
    expect(await blockedFor(db, "k", r, 10)).toBe(0); // 4 failures: still allowed
    await recordHit(db, "k", r.windowMs, 5);
    expect(await blockedFor(db, "k", r, 10)).toBe(5 * MIN - 10); // 5th failure: locked until the first ages out
  });

  it("unlocks once the first failure is 5 minutes old", async () => {
    const { db } = fakeDb();
    const r = { limit: 5, windowMs: 5 * MIN };
    for (let i = 0; i < 5; i++) await recordHit(db, "k", r.windowMs, i * 1000);
    expect(await blockedFor(db, "k", r, 5 * MIN - 1)).toBeGreaterThan(0);
    expect(await blockedFor(db, "k", r, 5 * MIN + 1)).toBe(0);
  });

  it("forgets the failures when cleared", async () => {
    const { db } = fakeDb();
    const r = { limit: 2, windowMs: MIN };
    await recordHit(db, "k", r.windowMs, 0);
    await recordHit(db, "k", r.windowMs, 1);
    await clearHits(db, "k");
    expect(await blockedFor(db, "k", r, 2)).toBe(0);
  });
});

describe("keys and addresses", () => {
  it("makes a stable, address-free key per visitor and purpose", () => {
    const k = limiterKey("login", "203.0.113.7", "salt");
    expect(k).toBe(limiterKey("login", "203.0.113.7", "salt"));
    expect(k).toMatch(/^login_[A-Za-z0-9_-]{22}$/);
    expect(k).not.toContain("203.0.113.7");
    expect(limiterKey("contact", "203.0.113.7", "salt")).not.toBe(k);
    expect(limiterKey("login", "203.0.113.8", "salt")).not.toBe(k);
    expect(limiterKey("login", "203.0.113.7", "other")).not.toBe(k);
  });
  it("reads the first forwarded address, then x-real-ip, else nothing", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(clientIp(new Headers())).toBe("");
  });
  it("rounds a wait up to whole seconds, at least one", () => {
    expect(retryAfterSeconds(1)).toBe(1);
    expect(retryAfterSeconds(1500)).toBe(2);
    expect(retryAfterSeconds(0)).toBe(1);
  });
});

describe("pruneLimits", () => {
  it("deletes counts that went quiet, up to the limit", async () => {
    const deleted: unknown[] = [];
    const where = (_f: string, _op: string, v: unknown) => ({ limit: () => ({ get: async () => ({ docs: v === 100 ? [{ ref: "a" }, { ref: "b" }] : [] }) }) });
    const db = { collection: () => ({ where }), batch: () => ({ delete: (r: unknown) => deleted.push(r), commit: async () => undefined }) };
    expect(await pruneLimits(db, 900, 1000)).toBe(2);
    expect(deleted).toEqual(["a", "b"]);
  });
  it("does nothing when nothing is old", async () => {
    const db = { collection: () => ({ where: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }) }), batch: () => { throw new Error("no batch needed"); } };
    expect(await pruneLimits(db, 1, 1000)).toBe(0);
  });
});
