import { describe, expect, it, vi } from "vitest";
import { analyticsEnabled, handleCollect, MAX_BODY_BYTES, type CollectDeps } from "./collect";
import { createRateLimiter } from "./rateLimit";
import type { Db } from "./record";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const view = { kind: "view", ref: "https://www.linkedin.com/", utm: { source: "cv" }, theme: "dark", width: 1200 };

function fakeDeps(env: Record<string, string | undefined> = { NODE_ENV: "production" }) {
  const writes: { path: string; data: unknown }[] = [];
  const db: Db = {
    collection: (name) => ({
      doc: (id) => ({
        create: async (data) => void writes.push({ path: `${name}/${id}`, data }),
        set: async (data) => void writes.push({ path: `${name}/${id}`, data }),
      }),
    }),
  };
  const deps: CollectDeps = { db, inc: (n) => ({ inc: n }), env, allow: () => true, now: new Date("2026-10-06T10:00:00Z") };
  return { deps, writes };
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://www.johe.my.id/api/collect", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { host: "www.johe.my.id", "user-agent": CHROME, "x-forwarded-for": "1.2.3.4, 10.0.0.1", "x-vercel-ip-country": "ID", ...headers },
  });

const counted = (writes: { path: string }[]) => writes.some((w) => w.path.startsWith("analytics_days/"));

describe("analyticsEnabled", () => {
  it("is on in production and off in development, unless told otherwise", () => {
    expect(analyticsEnabled({ NODE_ENV: "production" })).toBe(true);
    expect(analyticsEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(analyticsEnabled({})).toBe(false);
    expect(analyticsEnabled({ NODE_ENV: "development", ANALYTICS_ENABLED: "1" })).toBe(true);
    expect(analyticsEnabled({ NODE_ENV: "production", ANALYTICS_ENABLED: "0" })).toBe(false);
  });
});

describe("handleCollect", () => {
  it("counts a real visit and answers 204 with no body", async () => {
    const { deps, writes } = fakeDeps();
    const res = await handleCollect(post(view), deps);
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(counted(writes)).toBe(true);
    expect(writes.find((w) => w.path.startsWith("analytics_days/"))!.path).toBe("analytics_days/2026-10-06");
  });

  it("uses the country the platform reports, the first forwarded address for the daily hash only, and keeps neither", async () => {
    const { deps, writes } = fakeDeps();
    await handleCollect(post(view), deps);
    const day = writes.find((w) => w.path.startsWith("analytics_days/"))!.data as { country: unknown };
    expect(day.country).toEqual({ id: { inc: 1 } });
    expect(JSON.stringify(writes)).not.toContain("1.2.3.4");
  });

  it("does nothing in development", async () => {
    const { deps, writes } = fakeDeps({ NODE_ENV: "development" });
    expect((await handleCollect(post(view), deps)).status).toBe(204);
    expect(writes).toEqual([]);
  });

  it("does not count you while you are signed in to the admin", async () => {
    const { deps, writes } = fakeDeps();
    await handleCollect(post(view, { cookie: "theme=dark; admin_session=abc.def" }), deps);
    expect(writes).toEqual([]);
    await handleCollect(post(view, { cookie: "theme=dark" }), deps);
    expect(counted(writes)).toBe(true); // other cookies do not matter
  });

  it("respects Do Not Track and Global Privacy Control", async () => {
    const { deps, writes } = fakeDeps();
    await handleCollect(post(view, { dnt: "1" }), deps);
    await handleCollect(post(view, { "sec-gpc": "1" }), deps);
    expect(writes).toEqual([]);
  });

  it("ignores reports that come from another site", async () => {
    const { deps, writes } = fakeDeps();
    await handleCollect(post(view, { origin: "https://evil.example" }), deps);
    expect(writes).toEqual([]);
    await handleCollect(post(view, { origin: "https://www.johe.my.id" }), deps);
    expect(counted(writes)).toBe(true);
  });

  it("ignores a body that is too big, not JSON, or not a beacon", async () => {
    const { deps, writes } = fakeDeps();
    await handleCollect(post("x".repeat(MAX_BODY_BYTES + 1)), deps);
    await handleCollect(post("not json"), deps);
    await handleCollect(post({ kind: "something else" }), deps);
    await handleCollect(post([1, 2]), deps);
    expect(writes).toEqual([]);
  });

  it("stops counting a source that reports too often", async () => {
    const { deps, writes } = fakeDeps();
    deps.allow = createRateLimiter(2, 60_000);
    for (let i = 0; i < 5; i++) await handleCollect(post(view), deps);
    expect(writes.filter((w) => w.path.startsWith("analytics_days/"))).toHaveLength(2);
  });

  it("counts a bot only as filtered traffic", async () => {
    const { deps, writes } = fakeDeps();
    await handleCollect(post(view, { "user-agent": "Googlebot/2.1" }), deps);
    expect(writes).toEqual([{ path: "analytics_days/2026-10-06", data: { day: "2026-10-06", bots: { inc: 1 } } }]);
  });

  it("never lets a database failure reach the visitor", async () => {
    const { deps } = fakeDeps();
    deps.db = { collection: () => ({ doc: () => ({ create: vi.fn().mockRejectedValue(new Error("down")), set: vi.fn().mockRejectedValue(new Error("down")) }) }) };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await handleCollect(post(view), deps)).status).toBe(204);
    expect(spy).toHaveBeenCalled();
  });

  it("uses the time zone from the settings to decide the day, and a secret salt when one is set", async () => {
    const { deps, writes } = fakeDeps({ NODE_ENV: "production", ANALYTICS_TIMEZONE: "Asia/Jakarta", ANALYTICS_SALT: "s3cret" });
    deps.now = new Date("2026-10-05T20:00:00Z");
    await handleCollect(post(view), deps);
    expect(writes.some((w) => w.path === "analytics_days/2026-10-06")).toBe(true);
  });
});

describe("createRateLimiter", () => {
  it("allows up to the limit in the window, then again after it", () => {
    const allow = createRateLimiter(2, 1000);
    expect([allow("a", 0), allow("a", 10), allow("a", 20)]).toEqual([true, true, false]);
    expect(allow("b", 20)).toBe(true); // another source
    expect(allow("a", 1500)).toBe(true); // the window has passed
  });
});
