import { beforeEach, describe, expect, it, vi } from "vitest";

const verifySessionCookie = vi.hoisted(() => vi.fn());
const cookie = vi.hoisted(() => ({ value: "session-cookie" as string | undefined }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => (cookie.value ? { value: cookie.value } : undefined) }) }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw new Error(`redirect:${to}`); } }));
vi.mock("./firebase-admin", () => ({ adminAuth: () => ({ verifySessionCookie }) }));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("ADMIN_UID", "owner");
  cookie.value = "session-cookie";
  verifySessionCookie.mockReset();
});

describe("getAdmin", () => {
  it("gives the owner and when the session ends, in milliseconds", async () => {
    verifySessionCookie.mockResolvedValue({ uid: "owner", email: "o@x.com", exp: 1_800_000_000 });
    const { getAdmin } = await import("./auth");
    expect(await getAdmin()).toEqual({ uid: "owner", email: "o@x.com", expiresAt: 1_800_000_000_000 });
  });

  it("is null for anyone who is not the owner, a missing or invalid cookie, or no configured owner", async () => {
    verifySessionCookie.mockResolvedValue({ uid: "someone-else", exp: 1_800_000_000 });
    expect(await (await import("./auth")).getAdmin()).toBeNull();

    vi.resetModules();
    cookie.value = undefined;
    expect(await (await import("./auth")).getAdmin()).toBeNull();

    vi.resetModules();
    cookie.value = "bad";
    verifySessionCookie.mockRejectedValue(new Error("expired"));
    expect(await (await import("./auth")).getAdmin()).toBeNull();

    vi.resetModules();
    vi.stubEnv("ADMIN_UID", "");
    expect(await (await import("./auth")).getAdmin()).toBeNull();
  });

  it("requireAdmin sends everyone else to the login page", async () => {
    cookie.value = undefined;
    await expect((await import("./auth")).requireAdmin()).rejects.toThrow("redirect:/admin/login");
  });
});
