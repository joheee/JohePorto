import { describe, expect, it, vi } from "vitest";
import { formatMetric, metricGrade, scoreGrade, type PageSpeedRun } from "./model";
import { PageSpeedError, parsePageSpeed, runPageSpeed } from "./run";
import { latestByStrategy, loadRuns, saveRuns, type SpeedDb } from "./store";

const lighthouse = {
  lighthouseResult: {
    categories: { performance: { score: 0.96 }, accessibility: { score: 1 }, "best-practices": { score: 0.92 }, seo: { score: 1 } },
    audits: {
      "largest-contentful-paint": { numericValue: 2100.4 },
      "cumulative-layout-shift": { numericValue: 0.0123 },
      "total-blocking-time": { numericValue: 40 },
      "first-contentful-paint": { numericValue: 900 },
      "speed-index": { numericValue: 1500 },
    },
  },
};
const at = new Date("2026-10-06T10:00:00Z");
const reply = (status: number, body: unknown) => vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body } as Response);

describe("parsePageSpeed", () => {
  it("turns the Lighthouse result into whole-number scores and the vitals", () => {
    const run = parsePageSpeed(lighthouse, "mobile", "https://x.dev", at);
    expect(run).toEqual({
      at: "2026-10-06T10:00:00.000Z",
      strategy: "mobile",
      url: "https://x.dev",
      scores: { performance: 96, accessibility: 100, bestPractices: 92, seo: 100 },
      metrics: { lcp: 2100.4, cls: 0.0123, tbt: 40, fcp: 900, si: 1500 },
    });
  });

  it("uses null for a category or audit that is missing", () => {
    const run = parsePageSpeed({ lighthouseResult: { categories: { performance: { score: null } }, audits: {} } }, "desktop", "u", at);
    expect(run.scores).toEqual({ performance: null, accessibility: null, bestPractices: null, seo: null });
    expect(run.metrics.lcp).toBeNull();
  });

  it("refuses an answer without a result", () => {
    expect(() => parsePageSpeed({}, "mobile", "u", at)).toThrow(PageSpeedError);
    expect(() => parsePageSpeed(null, "mobile", "u", at)).toThrow(PageSpeedError);
  });
});

describe("runPageSpeed", () => {
  it("asks for the four categories and the device, with the key when there is one", async () => {
    const fetch = reply(200, lighthouse);
    await runPageSpeed("https://x.dev/", "desktop", { fetch, apiKey: "K", now: () => at });
    const url = new URL(fetch.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    expect(url.searchParams.get("url")).toBe("https://x.dev/");
    expect(url.searchParams.get("strategy")).toBe("desktop");
    expect(url.searchParams.getAll("category")).toEqual(["performance", "accessibility", "best-practices", "seo"]);
    expect(url.searchParams.get("key")).toBe("K");
  });

  it("sends no key when none is set", async () => {
    const fetch = reply(200, lighthouse);
    await runPageSpeed("https://x.dev/", "mobile", { fetch });
    expect(new URL(fetch.mock.calls[0][0] as string).searchParams.has("key")).toBe(false);
  });

  it("explains an exhausted quota", async () => {
    await expect(runPageSpeed("u", "mobile", { fetch: reply(429, { error: { message: "quota" } }) })).rejects.toThrow(/quota.*PAGESPEED_API_KEY/i);
  });

  it("reports another failure with Google's message", async () => {
    await expect(runPageSpeed("u", "mobile", { fetch: reply(400, { error: { message: "Lighthouse returned error: FAILED_DOCUMENT_REQUEST" } }) })).rejects.toThrow(/\(400\).*FAILED_DOCUMENT_REQUEST/);
  });

  it("survives an answer that is not JSON", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => Promise.reject(new Error("x")) } as unknown as Response);
    await expect(runPageSpeed("u", "mobile", { fetch })).rejects.toThrow(/\(502\)/);
  });

  it("turns a network failure or timeout into a plain message", async () => {
    await expect(runPageSpeed("u", "mobile", { fetch: vi.fn().mockRejectedValue(new Error("boom")) })).rejects.toThrow(/did not answer/i);
  });
});

describe("grades", () => {
  it("uses Lighthouse's bands for scores", () => {
    expect([scoreGrade(100), scoreGrade(90), scoreGrade(89), scoreGrade(50), scoreGrade(49), scoreGrade(null)]).toEqual(["good", "good", "ok", "ok", "poor", "none"]);
  });
  it("uses the Core Web Vitals thresholds", () => {
    expect([metricGrade("lcp", 2500), metricGrade("lcp", 2501), metricGrade("lcp", 4001)]).toEqual(["good", "ok", "poor"]);
    expect([metricGrade("cls", 0.1), metricGrade("cls", 0.2), metricGrade("cls", 0.3)]).toEqual(["good", "ok", "poor"]);
    expect([metricGrade("tbt", 200), metricGrade("tbt", 600), metricGrade("tbt", 601)]).toEqual(["good", "ok", "poor"]);
    expect(metricGrade("lcp", null)).toBe("none");
  });
  it("formats metrics", () => {
    expect(formatMetric("lcp", 2100.4)).toBe("2.1 s");
    expect(formatMetric("tbt", 40.2)).toBe("40 ms");
    expect(formatMetric("cls", 0.0123)).toBe("0.012");
    expect(formatMetric("cls", 0)).toBe("0");
    expect(formatMetric("lcp", null)).toBe("n/a");
  });
});

describe("store", () => {
  const run = (strategy: "mobile" | "desktop", t: string): PageSpeedRun => ({ at: t, strategy, url: "u", scores: { performance: 90, accessibility: 100, bestPractices: 100, seo: 100 }, metrics: { lcp: 1, cls: 0, tbt: 0, fcp: 1, si: 1 } });

  it("saves one document per run, without an id", async () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const db = { collection: () => ({ add }) } as unknown as SpeedDb;
    await saveRuns(db, [{ ...run("mobile", "t1"), id: "should-not-be-stored" }, run("desktop", "t1")]);
    expect(add).toHaveBeenCalledTimes(2);
    expect(add.mock.calls[0][0]).not.toHaveProperty("id");
  });

  it("loads newest first with the document ids", async () => {
    const get = vi.fn().mockResolvedValue({ docs: [{ id: "a", data: () => run("mobile", "t2") }] });
    const orderBy = vi.fn(() => ({ limit: vi.fn(() => ({ get })) }));
    const db = { collection: () => ({ orderBy }) } as unknown as SpeedDb;
    const runs = await loadRuns(db, 5);
    expect(orderBy).toHaveBeenCalledWith("at", "desc");
    expect(runs).toEqual([{ ...run("mobile", "t2"), id: "a" }]);
  });

  it("picks the newest run of each device", () => {
    const latest = latestByStrategy([run("mobile", "t3"), run("desktop", "t3"), run("mobile", "t1")]);
    expect(latest.mobile?.at).toBe("t3");
    expect(latest.desktop?.at).toBe("t3");
    expect(latestByStrategy([run("mobile", "t1")]).desktop).toBeUndefined();
  });
});
