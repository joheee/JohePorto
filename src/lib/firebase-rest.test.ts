import { describe, expect, it, vi } from "vitest";
import { SignInUnavailable, signInWithPassword } from "./firebase-rest";

const reply = (status: number, body: unknown) => vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body } as Response);
const opts = (fetch: typeof globalThis.fetch) => ({ apiKey: "KEY", referer: "https://www.johe.my.id/", fetch });

describe("signInWithPassword", () => {
  it("returns the ID token on success and sends the key, the credentials and the site as referer", async () => {
    const fetch = reply(200, { idToken: "TOKEN" });
    expect(await signInWithPassword("a@b.c", "pw", opts(fetch))).toEqual({ kind: "ok", idToken: "TOKEN" });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=KEY");
    expect(JSON.parse(init.body)).toEqual({ email: "a@b.c", password: "pw", returnSecureToken: true });
    expect(init.headers.Referer).toBe("https://www.johe.my.id/");
  });

  it.each(["INVALID_LOGIN_CREDENTIALS", "INVALID_PASSWORD", "EMAIL_NOT_FOUND", "INVALID_EMAIL", "USER_DISABLED"])("treats %s as wrong credentials", async (code) => {
    expect(await signInWithPassword("a@b.c", "pw", opts(reply(400, { error: { message: code } })))).toEqual({ kind: "invalid" });
  });

  it("reports Firebase's own throttling, even with a reason after the code", async () => {
    expect(await signInWithPassword("a@b.c", "pw", opts(reply(400, { error: { message: "TOO_MANY_ATTEMPTS_TRY_LATER : Access to this account has been temporarily disabled" } })))).toEqual({ kind: "throttled" });
  });

  it("throws, without counting as a wrong password, for anything else (a bad key, a blocked referer)", async () => {
    await expect(signInWithPassword("a@b.c", "pw", opts(reply(403, { error: { message: "API_KEY_HTTP_REFERRER_BLOCKED" } })))).rejects.toThrow(SignInUnavailable);
    await expect(signInWithPassword("a@b.c", "pw", opts(reply(500, null)))).rejects.toThrow(SignInUnavailable);
  });

  it("throws when the network fails or there is no key", async () => {
    await expect(signInWithPassword("a@b.c", "pw", opts(vi.fn().mockRejectedValue(new Error("x"))))).rejects.toThrow(SignInUnavailable);
    await expect(signInWithPassword("a@b.c", "pw", { apiKey: undefined, fetch: reply(200, {}) })).rejects.toThrow(/not set/);
  });
});
