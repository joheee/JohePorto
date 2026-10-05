import { beforeEach, describe, expect, it, vi } from "vitest";

// The speed-test action with a fake Firestore and a fake Google: who may run it, what is stored, the cool-down.
const getAdmin = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const add = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const lastRuns = vi.hoisted(() => ({ docs: [] as { id: string; data(): Record<string, unknown> }[] }));
const site = vi.hoisted(() => ({ siteUrl: "https://johe.my.id" }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth", () => ({ getAdmin }));
vi.mock("@/lib/site", () => site);
vi.mock("@/lib/firebase-admin", () => ({
  adminDb: () => ({ collection: () => ({ add, orderBy: () => ({ limit: () => ({ get: async () => lastRuns }) }) }) }),
}));

import { runSpeedTest } from "./pagespeed-actions";

const lighthouse = { lighthouseResult: { categories: { performance: { score: 0.9 }, accessibility: { score: 1 }, "best-practices": { score: 1 }, seo: { score: 1 } }, audits: {} } };
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, json: async () => lighthouse });
  add.mockClear();
  revalidatePath.mockClear();
  getAdmin.mockResolvedValue({ uid: "owner" });
  lastRuns.docs = [];
  site.siteUrl = "https://johe.my.id";
});

describe("runSpeedTest", () => {
  it("refuses a signed-out caller and calls nobody", async () => {
    getAdmin.mockResolvedValue(null);
    expect(await runSpeedTest()).toEqual({ ok: false, error: expect.stringMatching(/not authorized/i) });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it("refuses an address Google cannot reach", async () => {
    site.siteUrl = "http://localhost:3000";
    expect(await runSpeedTest()).toEqual({ ok: false, error: expect.stringMatching(/public address/i) });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tests the site's own address on mobile and desktop, stores both and refreshes the page", async () => {
    expect(await runSpeedTest()).toEqual({ ok: true, warning: undefined });
    const urls = fetchMock.mock.calls.map((c) => new URL(c[0] as string));
    expect(urls.map((u) => u.searchParams.get("strategy")).sort()).toEqual(["desktop", "mobile"]);
    expect(urls.every((u) => u.searchParams.get("url") === "https://johe.my.id")).toBe(true);
    expect(add).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/analytics");
  });

  it("makes you wait after a test that just ran", async () => {
    lastRuns.docs = [{ id: "x", data: () => ({ at: new Date(Date.now() - 20_000).toISOString() }) }];
    expect(await runSpeedTest()).toEqual({ ok: false, error: expect.stringMatching(/moment ago/i) });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows a new test once the cool-down has passed", async () => {
    lastRuns.docs = [{ id: "x", data: () => ({ at: new Date(Date.now() - 10 * 60_000).toISOString() }) }];
    expect((await runSpeedTest()).ok).toBe(true);
  });

  it("keeps the device that finished when the other fails, and says so", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      new URL(url).searchParams.get("strategy") === "desktop" ? { ok: false, status: 429, json: async () => ({}) } : { ok: true, status: 200, json: async () => lighthouse },
    );
    const res = await runSpeedTest();
    expect(res).toEqual({ ok: true, warning: expect.stringMatching(/Only mobile finished/) });
    expect(add).toHaveBeenCalledTimes(1);
  });

  it("stores nothing and reports the reason when both fail", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    expect(await runSpeedTest()).toEqual({ ok: false, error: expect.stringMatching(/quota/i) });
    expect(add).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
