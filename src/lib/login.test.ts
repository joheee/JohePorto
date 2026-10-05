import { describe, expect, it, vi } from "vitest";
import { SignInUnavailable, type PasswordResult } from "./firebase-rest";
import type { LimitDb } from "./limiter";
import { FAILED_LOGINS, handleLogin, type LoginDeps } from "./login";

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

let clock = 5_000_000;
const setup = (result: PasswordResult | Error = { kind: "invalid" }, over: Partial<LoginDeps> = {}) => {
  const { db, docs } = fakeDb();
  const signIn = vi.fn(async () => {
    if (result instanceof Error) throw result;
    return result;
  });
  const startSession = vi.fn().mockResolvedValue("ok");
  const deps: LoginDeps = { limitDb: db, signIn, startSession, salt: "s", now: () => clock, ...over };
  return { deps, signIn, startSession, docs, setResult: (r: PasswordResult) => (result = r) };
};
const post = (body: unknown, ip = "1.1.1.1") =>
  new Request("http://x/api/login", { method: "POST", headers: { "x-forwarded-for": ip, "content-type": "application/json" }, body: JSON.stringify(body) });
const creds = { email: "me@example.com", password: "hunter2" };

describe("handleLogin", () => {
  it("signs in the owner, starts the session and answers ok", async () => {
    const { deps, startSession } = setup({ kind: "ok", idToken: "TOKEN" });
    const res = await handleLogin(post(creds), deps);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(startSession).toHaveBeenCalledWith("TOKEN");
  });

  it("answers a wrong password with one message that does not say which part was wrong", async () => {
    const { deps, startSession } = setup({ kind: "invalid" });
    const res = await handleLogin(post(creds), deps);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Invalid email or password.");
    expect(startSession).not.toHaveBeenCalled();
  });

  it("refuses a malformed request without counting it or calling Firebase", async () => {
    const { deps, signIn, docs } = setup();
    expect((await handleLogin(post({ email: "a@b.c" }), deps)).status).toBe(400);
    expect((await handleLogin(post({ email: "", password: "x" }), deps)).status).toBe(400);
    expect((await handleLogin(post({ email: "a@b.c", password: "x".repeat(2000) }), deps)).status).toBe(400);
    expect(signIn).not.toHaveBeenCalled();
    expect(docs.size).toBe(0);
  });

  it("allows 4 failures, locks on the 5th with a Retry-After, and no longer checks the password", async () => {
    const { deps, signIn } = setup({ kind: "invalid" });
    for (let i = 0; i < 5; i++) expect((await handleLogin(post(creds), deps)).status).toBe(401);
    expect(signIn).toHaveBeenCalledTimes(5);
    const locked = await handleLogin(post(creds), deps);
    expect(locked.status).toBe(429);
    expect(Number(locked.headers.get("Retry-After"))).toBe(300);
    expect((await locked.json()).error).toMatch(/too many failed attempts/i);
    expect(signIn).toHaveBeenCalledTimes(5); // the locked attempt was not even tried
  });

  it("does not let the right password through while locked", async () => {
    const { deps, startSession, setResult } = setup({ kind: "invalid" });
    for (let i = 0; i < 5; i++) await handleLogin(post(creds), deps);
    setResult({ kind: "ok", idToken: "T" });
    expect((await handleLogin(post(creds), deps)).status).toBe(429);
    expect(startSession).not.toHaveBeenCalled();
  });

  it("unlocks 5 minutes after the first of the failures", async () => {
    const { deps, setResult } = setup({ kind: "invalid" });
    for (let i = 0; i < 5; i++) {
      await handleLogin(post(creds), deps);
      clock += 1000;
    }
    clock += FAILED_LOGINS.windowMs - 5000 + 1; // just past 5 minutes since the first failure
    setResult({ kind: "ok", idToken: "T" });
    expect((await handleLogin(post(creds), deps)).status).toBe(200);
  });

  it("locks per address, so another address can still sign in (and nobody can lock the owner out by email)", async () => {
    const { deps, setResult } = setup({ kind: "invalid" });
    for (let i = 0; i < 5; i++) await handleLogin(post(creds, "6.6.6.6"), deps);
    expect((await handleLogin(post(creds, "6.6.6.6"), deps)).status).toBe(429);
    setResult({ kind: "ok", idToken: "T" });
    expect((await handleLogin(post(creds, "7.7.7.7"), deps)).status).toBe(200);
  });

  it("forgets the failures after a successful sign-in", async () => {
    const { deps, setResult } = setup({ kind: "invalid" });
    for (let i = 0; i < 4; i++) await handleLogin(post(creds), deps);
    setResult({ kind: "ok", idToken: "T" });
    expect((await handleLogin(post(creds), deps)).status).toBe(200);
    setResult({ kind: "invalid" });
    for (let i = 0; i < 4; i++) expect((await handleLogin(post(creds), deps)).status).toBe(401); // a fresh count of 4
  });

  it("counts a valid account that is not the owner as a failure and says so", async () => {
    const { deps, startSession } = setup({ kind: "ok", idToken: "OTHER" });
    startSession.mockResolvedValue("not-owner");
    const res = await handleLogin(post(creds), deps);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/not authorized/i);
    for (let i = 0; i < 4; i++) await handleLogin(post(creds), deps);
    expect((await handleLogin(post(creds), deps)).status).toBe(429);
  });

  it("does not count Firebase being down against the visitor", async () => {
    const { deps, docs } = setup(new SignInUnavailable("down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await handleLogin(post(creds), deps)).status).toBe(502);
    expect(docs.size).toBe(0);
    spy.mockRestore();
  });

  it("counts Firebase's own throttling as a failure", async () => {
    const { deps } = setup({ kind: "throttled" });
    expect((await handleLogin(post(creds), deps)).status).toBe(429);
    for (let i = 0; i < 4; i++) await handleLogin(post(creds), deps);
    expect(deps.signIn).toHaveBeenCalledTimes(5);
    expect((await handleLogin(post(creds), deps)).status).toBe(429);
    expect(deps.signIn).toHaveBeenCalledTimes(5);
  });

  it("refuses to sign in when the limiter cannot be read (it does not fail open)", async () => {
    const broken = { collection: () => ({ doc: () => ({ get: async () => Promise.reject(new Error("down")) }) }), runTransaction: vi.fn() } as unknown as LimitDb;
    const { deps, signIn } = setup({ kind: "ok", idToken: "T" }, { limitDb: broken });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await handleLogin(post(creds), deps)).status).toBe(503);
    expect(signIn).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("answers 500 when the session cannot be started", async () => {
    const { deps, startSession } = setup({ kind: "ok", idToken: "T" });
    startSession.mockRejectedValue(new Error("boom"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await handleLogin(post(creds), deps)).status).toBe(500);
    spy.mockRestore();
  });

  it("does not keep the address", async () => {
    const { deps, docs } = setup({ kind: "invalid" });
    await handleLogin(post(creds, "203.0.113.7"), deps);
    expect([...docs.keys()].join(" ")).not.toContain("203.0.113.7");
  });
});
