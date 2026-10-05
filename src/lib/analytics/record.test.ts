import { describe, expect, it, vi } from "vitest";
import type { Beacon } from "./model";
import { buildUpdate, record, type Db, type Visit } from "./record";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const inc = (n: number) => ({ inc: n });
const view: Beacon = { kind: "view", ref: "https://www.linkedin.com/in/jo", utm: { source: "linkedin-cv", medium: "", campaign: "" }, theme: "dark", width: 1200 };

const visit = (beacon: Beacon, o: Partial<Visit> = {}): Visit => ({
  beacon,
  userAgent: CHROME,
  ip: "1.2.3.4",
  country: "ID",
  acceptLanguage: "id-ID,id;q=0.9",
  ownHost: "www.johe.my.id",
  salt: "salt",
  inc,
  now: new Date("2026-10-06T10:00:00Z"),
  ...o,
});

// A fake Firestore that remembers what is written where.
function fakeDb() {
  const writes: { path: string; data: unknown; options?: unknown }[] = [];
  const seen = new Set<string>();
  const db: Db = {
    collection: (name) => ({
      doc: (id) => ({
        create: async (data) => {
          if (name === "analytics_seen") {
            if (seen.has(id)) throw Object.assign(new Error("exists"), { code: 6 });
            seen.add(id);
          }
          writes.push({ path: `${name}/${id}`, data });
        },
        set: async (data, options) => {
          writes.push({ path: `${name}/${id}`, data, options });
        },
      }),
    }),
  };
  return { db, writes };
}

describe("buildUpdate", () => {
  it("counts a view and what it says about the visit, per dimension", () => {
    expect(buildUpdate(visit(view), true)).toEqual({
      views: { inc: 1 },
      visitors: { inc: 1 },
      country: { id: { inc: 1 } }, // map keys are lower case; the page shows them in capitals
      device: { desktop: { inc: 1 } },
      browser: { chrome: { inc: 1 } },
      lang: { id: { inc: 1 } },
      theme: { dark: { inc: 1 } },
      ref: { "linkedin.com": { inc: 1 } },
      utm: { source: { "linkedin-cv": { inc: 1 } } },
    });
  });

  it("does not raise the visitor count for someone already counted today, and leaves out empty UTM tags", () => {
    const u = buildUpdate(visit({ ...view, utm: { source: "", medium: "", campaign: "" }, ref: "" }), false)!;
    expect(u.visitors).toBeUndefined();
    expect(u.utm).toBeUndefined();
    expect(u.ref).toEqual({ direct: { inc: 1 } });
  });

  it("uses xx for what it cannot tell", () => {
    const u = buildUpdate(visit(view, { country: null, acceptLanguage: null }), true)!;
    expect(u.country).toEqual({ xx: { inc: 1 } });
    expect(u.lang).toEqual({ xx: { inc: 1 } });
  });

  it("counts the sections reached once each, and an event as often as it happened", () => {
    expect(buildUpdate(visit({ kind: "end", sections: ["hero", "projects"], events: ["resume", "resume", "project.aws-base", "contact.sent"] }), false)).toEqual({
      sections: { hero: { inc: 1 }, projects: { inc: 1 } },
      events: { resume: { inc: 2 }, "project.aws-base": { inc: 1 }, "contact.sent": { inc: 1 } },
    });
  });

  it("has nothing to write for an end with nothing in it", () => {
    expect(buildUpdate(visit({ kind: "end", sections: [], events: [] }), false)).toBeNull();
  });
});

describe("record", () => {
  it("writes a view into the counters of its day, and notes the visitor for that day", async () => {
    const { db, writes } = fakeDb();
    expect(await record(db, visit(view))).toBe("counted");
    expect(writes.map((w) => w.path)).toEqual([expect.stringMatching(/^analytics_seen\/2026-10-06_[A-Za-z0-9_-]{22}$/), "analytics_days/2026-10-06"]);
    expect(writes[1].options).toEqual({ merge: true });
    expect((writes[1].data as { visitors: unknown }).visitors).toEqual({ inc: 1 });
    expect((writes[1].data as { day: string }).day).toBe("2026-10-06"); // also a field, for range queries
  });

  it("counts a visitor once a day: the second view adds a view but no visitor", async () => {
    const { db, writes } = fakeDb();
    await record(db, visit(view));
    await record(db, visit(view));
    const days = writes.filter((w) => w.path === "analytics_days/2026-10-06").map((w) => w.data as { views: unknown; visitors?: unknown });
    expect(days).toHaveLength(2);
    expect(days[0].visitors).toEqual({ inc: 1 });
    expect(days[1].visitors).toBeUndefined();
    expect(days[1].views).toEqual({ inc: 1 });
  });

  it("counts a different visitor, or the same one on another day, as new", async () => {
    const { db, writes } = fakeDb();
    await record(db, visit(view));
    await record(db, visit(view, { ip: "9.9.9.9" }));
    await record(db, visit(view, { now: new Date("2026-10-07T10:00:00Z") }));
    const withVisitor = writes.filter((w) => w.path.startsWith("analytics_days/") && (w.data as { visitors?: unknown }).visitors);
    expect(withVisitor).toHaveLength(3);
  });

  it("only counts a bot's view, as filtered traffic, and keeps nothing else about it", async () => {
    const { db, writes } = fakeDb();
    expect(await record(db, visit(view, { userAgent: "Googlebot/2.1" }))).toBe("bot");
    expect(writes).toEqual([{ path: "analytics_days/2026-10-06", data: { day: "2026-10-06", bots: { inc: 1 } }, options: { merge: true } }]);
    writes.length = 0;
    expect(await record(db, visit({ kind: "end", sections: ["hero"], events: ["resume"] }, { userAgent: "Googlebot/2.1" }))).toBe("bot");
    expect(writes).toEqual([]);
  });

  it("writes sections and events for an end beacon, without touching the visitor list", async () => {
    const { db, writes } = fakeDb();
    expect(await record(db, visit({ kind: "end", sections: ["hero"], events: ["resume"] }))).toBe("counted");
    expect(writes.map((w) => w.path)).toEqual(["analytics_days/2026-10-06"]);
  });

  it("writes nothing for an end with nothing in it", async () => {
    const { db, writes } = fakeDb();
    expect(await record(db, visit({ kind: "end", sections: [], events: [] }))).toBe("empty");
    expect(writes).toEqual([]);
  });

  it("never stores the address or the browser string", async () => {
    const { db, writes } = fakeDb();
    await record(db, visit(view, { ip: "203.0.113.77" }));
    const text = JSON.stringify(writes);
    expect(text).not.toContain("203.0.113.77");
    expect(text).not.toContain("Windows NT");
  });

  it("uses the time zone it is given to decide the day", async () => {
    const { db, writes } = fakeDb();
    await record(db, visit(view, { now: new Date("2026-10-05T20:00:00Z"), timeZone: "Asia/Jakarta" }));
    expect(writes.at(-1)!.path).toBe("analytics_days/2026-10-06");
  });

  it("passes on a real database error instead of hiding it", async () => {
    const db: Db = { collection: () => ({ doc: () => ({ create: vi.fn().mockRejectedValue(new Error("unavailable")), set: vi.fn() }) }) };
    await expect(record(db, visit(view))).rejects.toThrow("unavailable");
  });
});
