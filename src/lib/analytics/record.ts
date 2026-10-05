import type { Beacon } from "./model";
import { browserOf, countryOf, dayKey, deviceOf, isBot, languageOf, mapKey, referrerHost, visitorHash } from "./parse";

// Counting a beacon: one document per day (`analytics_days/<yyyy-mm-dd>`) holds only counters, raised with
// atomic increments. The one thing that looks like a visitor, the daily hash that stops the same person being
// counted twice, lives in `analytics_seen` and is deleted after two days (see read.ts). Nothing else is kept.

// The small part of Firestore this needs, so it can be faked in tests.
export type Db = {
  collection(name: string): {
    doc(id: string): {
      create(data: object): Promise<unknown>;
      set(data: object, options?: { merge: boolean }): Promise<unknown>;
    };
  };
};

export type Visit = {
  beacon: Beacon;
  userAgent: string;
  ip: string; // used for the daily hash only, never stored
  country: string | null; // the x-vercel-ip-country header
  acceptLanguage: string | null;
  ownHost: string; // to tell a link inside this site from a referrer
  salt: string;
  inc: (n: number) => unknown; // FieldValue.increment
  now?: Date;
  timeZone?: string;
};

export type Outcome = "counted" | "bot" | "empty";

type Counters = Record<string, unknown>;
const bump = (inc: Visit["inc"], key: string, by = 1): Counters => ({ [mapKey(key)]: inc(by) });

// The counters one beacon adds to its day. `isNewVisitor` is only known for a view.
export function buildUpdate(v: Visit, isNewVisitor: boolean): Counters | null {
  const { beacon, inc } = v;
  if (beacon.kind === "view") {
    const update: Counters = {
      views: inc(1),
      country: bump(inc, countryOf(v.country)),
      device: bump(inc, deviceOf(v.userAgent)),
      browser: bump(inc, browserOf(v.userAgent)),
      lang: bump(inc, languageOf(v.acceptLanguage)),
      theme: bump(inc, beacon.theme),
      ref: bump(inc, referrerHost(beacon.ref, v.ownHost)),
    };
    if (isNewVisitor) update.visitors = inc(1);
    const utm: Counters = {};
    if (beacon.utm.source) utm.source = bump(inc, beacon.utm.source);
    if (beacon.utm.medium) utm.medium = bump(inc, beacon.utm.medium);
    if (beacon.utm.campaign) utm.campaign = bump(inc, beacon.utm.campaign);
    if (Object.keys(utm).length > 0) update.utm = utm;
    return update;
  }

  const update: Counters = {};
  if (beacon.sections.length > 0) update.sections = Object.assign({}, ...beacon.sections.map((s) => bump(inc, s)));
  if (beacon.events.length > 0) {
    const counts = new Map<string, number>();
    for (const e of beacon.events) counts.set(e, (counts.get(e) ?? 0) + 1);
    update.events = Object.assign({}, ...[...counts].map(([name, n]) => bump(inc, name, n)));
  }
  return Object.keys(update).length > 0 ? update : null;
}

const alreadyExists = (e: unknown) => typeof e === "object" && e !== null && ((e as { code?: unknown }).code === 6 || (e as { code?: unknown }).code === "already-exists");

// Counts one beacon. Bots are counted on their own (so you can see how much traffic was filtered out) and
// nothing else of theirs is kept.
export async function record(db: Db, v: Visit): Promise<Outcome> {
  const day = dayKey(v.now ?? new Date(), v.timeZone ?? "UTC");
  const today = db.collection("analytics_days").doc(day);

  // `day` is also a field, so the Analytics page can ask for a range of days without a special index.
  if (isBot(v.userAgent)) {
    if (v.beacon.kind === "view") await today.set({ day, bots: v.inc(1) }, { merge: true });
    return "bot";
  }

  let isNew = false;
  if (v.beacon.kind === "view") {
    const seen = db.collection("analytics_seen").doc(`${day}_${visitorHash(day, v.ip, v.userAgent, v.salt)}`);
    try {
      await seen.create({ day });
      isNew = true;
    } catch (e) {
      if (!alreadyExists(e)) throw e;
    }
  }

  const update = buildUpdate(v, isNew);
  if (!update) return "empty";
  await today.set({ day, ...update }, { merge: true });
  return "counted";
}
