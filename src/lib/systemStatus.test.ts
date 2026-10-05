import { describe, expect, it, vi } from "vitest";
import { cacheCheck, configCheck, deployCheck, firestoreCheck, formatRemaining, overall, pdfCheck, REQUIRED_ENV, robotsCheck, sessionCheck, sitemapCheck } from "./systemStatus";

const MIN = 60_000;
const now = new Date("2026-10-05T12:00:00Z");

describe("overall", () => {
  it("is the worst status of the checks", () => {
    const c = (status: "ok" | "warn" | "fail") => ({ name: "x", status, detail: "" });
    expect(overall([c("ok"), c("ok")])).toBe("ok");
    expect(overall([c("ok"), c("warn")])).toBe("warn");
    expect(overall([c("warn"), c("fail"), c("ok")])).toBe("fail");
    expect(overall([])).toBe("ok");
  });
});

describe("formatRemaining", () => {
  it("writes hours and minutes, leaving out zeros", () => {
    expect(formatRemaining(134 * MIN)).toBe("2 h 14 m");
    expect(formatRemaining(180 * MIN)).toBe("3 h");
    expect(formatRemaining(9 * MIN)).toBe("9 m");
  });
  it("shows at least a minute while there is time, and says expired after", () => {
    expect(formatRemaining(10_000)).toBe("1 m");
    expect(formatRemaining(0)).toBe("expired");
    expect(formatRemaining(-5)).toBe("expired");
  });
});

describe("sessionCheck", () => {
  const at = now.getTime();
  it("counts down how long you stay signed in", () => {
    expect(sessionCheck(at + 134 * MIN, at)).toEqual({ name: "session", status: "ok", detail: "signed in · 2 h 14 m left" });
  });
  it("warns in the last quarter of an hour", () => {
    const c = sessionCheck(at + 9 * MIN, at);
    expect(c.status).toBe("warn");
    expect(c.detail).toContain("9 m left");
  });
  it("fails once expired, and warns when the time is unknown", () => {
    expect(sessionCheck(at - 1, at).status).toBe("fail");
    expect(sessionCheck(null, at).status).toBe("warn");
  });
});

describe("cacheCheck", () => {
  it("is fine when read within the hour", () => {
    const c = cacheCheck(new Date(now.getTime() - 12 * MIN).toISOString(), now);
    expect(c).toEqual({ name: "site cache", status: "ok", detail: "read 12 min ago · renews every hour" });
  });
  it("warns when older than it should be, and fails when it could not be read", () => {
    expect(cacheCheck(new Date(now.getTime() - 3 * 60 * MIN).toISOString(), now).status).toBe("warn");
    expect(cacheCheck(null, now).status).toBe("fail");
  });
});

describe("configCheck", () => {
  const all = Object.fromEntries(REQUIRED_ENV.map((n) => [n, "x"]));
  it("is fine when every variable is set", () => {
    expect(configCheck(all)).toEqual({ name: "config", status: "ok", detail: "8/8 variables set" });
  });
  it("names what is missing or blank, and never prints a value", () => {
    const c = configCheck({ ...all, ADMIN_UID: undefined, NEXT_PUBLIC_FIREBASE_APP_ID: "  ", FIREBASE_SERVICE_ACCOUNT_KEY: "super-secret" });
    expect(c.status).toBe("fail");
    expect(c.detail).toBe("missing ADMIN_UID, NEXT_PUBLIC_FIREBASE_APP_ID");
    expect(JSON.stringify(c)).not.toContain("super-secret");
  });
});

describe("deployCheck", () => {
  it("says it is local when not on Vercel", () => {
    expect(deployCheck({})).toEqual({ name: "deploy", status: "ok", detail: "local · not a Vercel deployment" });
  });
  it("shows the environment, the short commit and the first line of the message", () => {
    const c = deployCheck({ VERCEL_ENV: "production", VERCEL_GIT_COMMIT_SHA: "0123456789abcdef", VERCEL_GIT_COMMIT_MESSAGE: "feat: reviews section\n\nlonger text" });
    expect(c.detail).toBe("production · 0123456 · feat: reviews section");
  });
  it("cuts a long commit message", () => {
    const c = deployCheck({ VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_MESSAGE: "x".repeat(100) });
    expect(c.detail.endsWith("…")).toBe(true);
    expect(c.detail.length).toBeLessThan(80);
  });
});

describe("firestoreCheck", () => {
  it("times a read", async () => {
    const c = await firestoreCheck(async () => {});
    expect(c.name).toBe("firestore");
    expect(c.status).toBe("ok");
    expect(c.detail).toMatch(/^ok · \d+ ms$/);
  });
  it("fails when the read fails", async () => {
    expect(await firestoreCheck(async () => { throw new Error("down"); })).toEqual({ name: "firestore", status: "fail", detail: "read failed" });
  });
});

const reply = (status: number, body = "", type = "text/plain") => vi.fn().mockResolvedValue({ ok: status < 400, status, headers: { get: (n: string) => (n.toLowerCase() === "content-type" ? type : null) }, text: async () => body });

describe("the site's own addresses", () => {
  it("resume.pdf: asks with HEAD and wants a PDF", async () => {
    const f = reply(200, "", "application/pdf");
    expect(await pdfCheck("https://x.dev", f)).toEqual({ name: "resume.pdf", status: "ok", detail: "200 · application/pdf" });
    expect(f).toHaveBeenCalledWith("https://x.dev/resume.pdf", expect.objectContaining({ method: "HEAD" }));
    expect((await pdfCheck("https://x.dev", reply(200, "", "text/html"))).status).toBe("fail");
    expect((await pdfCheck("https://x.dev", reply(500))).detail).toBe("HTTP 500");
  });
  it("sitemap: counts its urls", async () => {
    expect((await sitemapCheck("https://x.dev", reply(200, "<urlset><url></url></urlset>"))).detail).toBe("ok · 1 url");
    expect((await sitemapCheck("https://x.dev", reply(200, "<url></url><url></url>"))).detail).toBe("ok · 2 urls");
    expect((await sitemapCheck("https://x.dev", reply(200, "<urlset></urlset>"))).status).toBe("fail");
  });
  it("robots: wants /admin kept out of search", async () => {
    expect((await robotsCheck("https://x.dev", reply(200, "User-Agent: *\nDisallow: /admin"))).status).toBe("ok");
    expect((await robotsCheck("https://x.dev", reply(200, "User-Agent: *\nAllow: /"))).status).toBe("fail");
  });
  it("reports no answer when the request cannot be made", async () => {
    const c = await sitemapCheck("https://x.dev", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect(c).toEqual({ name: "sitemap", status: "fail", detail: "no answer" });
  });
});
