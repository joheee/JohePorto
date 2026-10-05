// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

import LoginForm, { loginError } from "./LoginForm";

const reply = (status: number, headers: Record<string, string> = {}) => vi.fn().mockResolvedValue({ ok: status < 400, status, headers: new Headers(headers) });
beforeEach(() => {
  replace.mockClear();
  refresh.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

const submit = async (fetch: ReturnType<typeof vi.fn>) => {
  vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup();
  render(<LoginForm />);
  await user.type(screen.getByPlaceholderText("Email"), "me@example.com");
  await user.type(screen.getByPlaceholderText("Password"), "secret");
  await user.click(screen.getByRole("button", { name: /sign in/i }));
};

describe("LoginForm", () => {
  it("posts the credentials to the server and goes to the admin", async () => {
    const fetch = reply(200);
    await submit(fetch);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
    expect(fetch).toHaveBeenCalledWith("/api/login", expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "me@example.com", password: "secret" }) }));
  });

  it("says how long to wait when locked out, and stays on the page", async () => {
    await submit(reply(429, { "Retry-After": "240" }));
    expect(await screen.findByText("Too many failed attempts. Try again in 4 minutes.")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows one message for a wrong email or password", async () => {
    await submit(reply(401));
    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
  });

  it("tells you when the server cannot be reached", async () => {
    await submit(vi.fn().mockRejectedValue(new Error("offline")));
    expect(await screen.findByText(/could not reach the server/i)).toBeInTheDocument();
  });
});

describe("loginError", () => {
  const res = (status: number, headers: Record<string, string> = {}) => ({ status, headers: new Headers(headers) }) as Response;
  it("rounds the wait up to whole minutes, at least one", async () => {
    expect(await loginError(res(429, { "Retry-After": "61" }))).toBe("Too many failed attempts. Try again in 2 minutes.");
    expect(await loginError(res(429, { "Retry-After": "20" }))).toBe("Too many failed attempts. Try again in 1 minute.");
    expect(await loginError(res(429))).toBe("Too many failed attempts. Try again in 1 minute.");
  });
  it("has a message for each other answer", async () => {
    expect(await loginError(res(403))).toBe("This account is not authorized.");
    expect(await loginError(res(502))).toMatch(/temporarily unavailable/);
    expect(await loginError(res(400))).toBe("Sign-in failed. Try again.");
  });
});
