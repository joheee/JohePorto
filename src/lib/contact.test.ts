import { describe, expect, it, vi } from "vitest";
import { handleContact, type ContactDeps } from "./contact";
import type { LimitDb } from "./limiter";

// The contact rules: validation and honeypot as before, and now at most 3 messages per 10 minutes and 10 a day
// from one visitor, 100 a day from everyone.
function fakeDb() {
  const docs = new Map<string, Record<string, unknown>>();
  const ref = (id: string) => ({ id, get: async () => ({ exists: docs.has(id), data: () => docs.get(id) }), delete: async () => void docs.delete(id) });
  return {
    docs,
    db: {
      collection: () => ({ doc: ref }),
      runTransaction: async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ get: (r: ReturnType<typeof ref>) => r.get(), set: (r: { id: string }, d: Record<string, unknown>) => void docs.set(r.id, d) }),
    } as unknown as LimitDb,
  };
}

const MIN = 60_000;
let clock = 1_000_000;
const setup = (over: Partial<ContactDeps> = {}) => {
  const { db, docs } = fakeDb();
  const save = vi.fn().mockResolvedValue(undefined);
  const deps: ContactDeps = { limitDb: db, save, salt: "s", now: () => clock, ...over };
  return { deps, save, docs };
};
const post = (body: unknown, ip = "1.1.1.1") =>
  new Request("http://x/api/contact", { method: "POST", headers: { "x-forwarded-for": ip, "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const good = { name: "Ada", email: "ada@example.com", text: "Hello there" };

describe("handleContact", () => {
  it("stores a good message", async () => {
    const { deps, save } = setup();
    const res = await handleContact(post(good), deps);
    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalledWith(good);
  });

  it("refuses bad JSON and bad input without counting anything", async () => {
    const { deps, save, docs } = setup();
    expect((await handleContact(post("{nope"), deps)).status).toBe(400);
    expect((await handleContact(post({ ...good, email: "nope" }), deps)).status).toBe(400);
    expect((await handleContact(post({ ...good, text: "x".repeat(5001) }), deps)).status).toBe(400);
    expect(save).not.toHaveBeenCalled();
    expect(docs.size).toBe(0);
  });

  it("pretends success for a filled honeypot, stores nothing and counts nothing", async () => {
    const { deps, save, docs } = setup();
    const res = await handleContact(post({ ...good, website: "http://spam" }), deps);
    expect(await res.json()).toEqual({ ok: true });
    expect(save).not.toHaveBeenCalled();
    expect(docs.size).toBe(0);
  });

  it("allows 3 messages in 10 minutes from one visitor, and the 4th gets a 429 with Retry-After", async () => {
    const { deps, save } = setup();
    for (let i = 0; i < 3; i++) expect((await handleContact(post(good), deps)).status).toBe(200);
    const res = await handleContact(post(good), deps);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.retryAfter).toBe(600);
    expect(res.headers.get("Retry-After")).toBe("600");
    expect(save).toHaveBeenCalledTimes(3);
  });

  it("lets the visitor send again after the 10 minutes", async () => {
    const { deps } = setup();
    for (let i = 0; i < 3; i++) await handleContact(post(good), deps);
    clock += 10 * MIN + 1;
    expect((await handleContact(post(good), deps)).status).toBe(200);
  });

  it("stops a slow drip with the daily limit of 10", async () => {
    const { deps } = setup();
    for (let i = 0; i < 10; i++) {
      clock += 4 * MIN; // never more than 3 inside any 10 minutes
      expect((await handleContact(post(good), deps)).status).toBe(200);
    }
    clock += 4 * MIN;
    expect((await handleContact(post(good), deps)).status).toBe(429);
  });

  it("keeps visitors apart", async () => {
    const { deps } = setup();
    for (let i = 0; i < 3; i++) await handleContact(post(good, "1.1.1.1"), deps);
    expect((await handleContact(post(good, "1.1.1.1"), deps)).status).toBe(429);
    expect((await handleContact(post(good, "2.2.2.2"), deps)).status).toBe(200);
  });

  it("caps the whole site at 100 a day, whoever sends", async () => {
    const { deps, save } = setup();
    for (let i = 0; i < 100; i++) expect((await handleContact(post(good, `10.0.${Math.floor(i / 250)}.${i}`), deps)).status).toBe(200);
    expect((await handleContact(post(good, "9.9.9.9"), deps)).status).toBe(429);
    expect(save).toHaveBeenCalledTimes(100);
  });

  it("does not store the address", async () => {
    const { deps, docs } = setup();
    await handleContact(post(good, "203.0.113.7"), deps);
    expect([...docs.keys()].join(" ")).not.toContain("203.0.113.7");
  });

  it("still accepts the message when the limiter itself fails", async () => {
    const broken = { collection: () => ({ doc: () => ({}) }), runTransaction: async () => Promise.reject(new Error("firestore down")) } as unknown as LimitDb;
    const { deps, save } = setup({ limitDb: broken });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await handleContact(post(good), deps)).status).toBe(200);
    expect(save).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
