import { createHash } from "node:crypto";

// A rate limiter whose counts live in Firestore (`rate_limits/<key>`, one document per visitor and purpose), so
// every server instance sees the same numbers. (The in-memory limiter in lib/analytics/rateLimit.ts only knows
// its own instance, which on Vercel is one of many.) A document holds the times of the recent hits; a rule says
// "at most `limit` hits in any `windowMs`". Only the Admin SDK touches the collection (not in firestore.rules).
// The database is passed in, so everything is tested with a fake.
export type Rule = { limit: number; windowMs: number };
export type Verdict = { ok: true } | { ok: false; retryAfterMs: number };

type Snap = { exists: boolean; data(): Record<string, unknown> | undefined };
type Ref = { get(): Promise<Snap>; delete(): Promise<unknown> };
type Tx = { get(ref: Ref): Promise<Snap>; set(ref: Ref, data: Record<string, unknown>): unknown };
export type LimitDb = {
  runTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
  collection(name: string): { doc(id: string): Ref };
};

const COLLECTION = "rate_limits";

const hitsOf = (snap: Snap): number[] => {
  const h = snap.exists ? snap.data()?.hits : undefined;
  return Array.isArray(h) ? h.filter((t): t is number => typeof t === "number").sort((a, b) => a - b) : [];
};

// How long until one more hit is allowed under `rule` (0 = now). Hits are oldest first.
export function waitFor(hits: number[], rule: Rule, now: number): number {
  const recent = hits.filter((t) => now - t < rule.windowMs);
  if (recent.length < rule.limit) return 0;
  return recent[recent.length - rule.limit] + rule.windowMs - now; // the hit that has to age out first
}

// Counts one hit against every entry, or counts nothing and says how long to wait if any rule is full.
// Done in one transaction, so two requests at the same moment cannot both take the last place.
export async function consume(db: LimitDb, entries: { key: string; rules: Rule[] }[], now = Date.now()): Promise<Verdict> {
  const refs = entries.map((e) => db.collection(COLLECTION).doc(e.key));
  return db.runTransaction(async (tx) => {
    const snaps = await Promise.all(refs.map((r) => tx.get(r)));
    const all = snaps.map(hitsOf);
    let wait = 0;
    entries.forEach((e, i) => e.rules.forEach((rule) => (wait = Math.max(wait, waitFor(all[i], rule, now)))));
    if (wait > 0) return { ok: false, retryAfterMs: wait } as const;
    entries.forEach((e, i) => {
      const keep = Math.max(...e.rules.map((r) => r.windowMs));
      tx.set(refs[i], { hits: [...all[i].filter((t) => now - t < keep), now], updatedAt: now });
    });
    return { ok: true } as const;
  });
}

// For rules that count only some events (failed logins): ask first, record afterwards.
export async function blockedFor(db: LimitDb, key: string, rule: Rule, now = Date.now()): Promise<number> {
  return waitFor(hitsOf(await db.collection(COLLECTION).doc(key).get()), rule, now);
}

export async function recordHit(db: LimitDb, key: string, windowMs: number, now = Date.now()): Promise<void> {
  await consume(db, [{ key, rules: [{ limit: Infinity, windowMs }] }], now);
}

export async function clearHits(db: LimitDb, key: string): Promise<void> {
  await db.collection(COLLECTION).doc(key).delete();
}

// The key for one visitor and purpose: a salted one-way hash of the address, so no address is stored.
export function limiterKey(purpose: string, ip: string, salt: string): string {
  return `${purpose}_${createHash("sha256").update([salt, "limit", purpose, ip || "unknown"].join("|")).digest("base64url").slice(0, 22)}`;
}

export function clientIp(headers: Headers): string {
  return (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || headers.get("x-real-ip") || "";
}

export const retryAfterSeconds = (ms: number) => Math.max(1, Math.ceil(ms / 1000));

// Housekeeping: counts that went quiet are useless after a day or two. Run from the Analytics page, like the
// visitor hashes. At most `max` documents per call.
type PruneDb = {
  collection(name: string): { where(f: string, op: string, v: unknown): { limit(n: number): { get(): Promise<{ docs: { ref: unknown }[] }> } } };
  batch(): { delete(ref: unknown): void; commit(): Promise<unknown> };
};
export async function pruneLimits(db: PruneDb, olderThanMs: number, now = Date.now(), max = 450): Promise<number> {
  const old = await db.collection(COLLECTION).where("updatedAt", "<", now - olderThanMs).limit(max).get();
  if (old.docs.length === 0) return 0;
  const batch = db.batch();
  for (const d of old.docs) batch.delete(d.ref);
  await batch.commit();
  return old.docs.length;
}
