// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SignOutButton from "./SignOutButton";

const loaded = vi.hoisted(() => ({ firebase: false }));
const signOut = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const replace = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());

vi.mock("firebase/auth", () => ({ signOut }));
vi.mock("@/lib/firebase", () => {
  loaded.firebase = true; // runs when the module is first imported
  return { auth: { name: "auth" } };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

describe("SignOutButton", () => {
  // Regression: a top-level `import` of Firebase here sent the Auth and Firestore SDKs to every visitor, because the
  // button sits in the navbar of the public site (slower pages, and a CSP error from the SDK's auth iframe).
  it("does not load Firebase until it is clicked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    render(<SignOutButton />);
    expect(loaded.firebase).toBe(false);

    await userEvent.setup().click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/login"));
    expect(loaded.firebase).toBe(true);
    expect(fetch).toHaveBeenCalledWith("/api/auth/session", { method: "DELETE" });
    expect(signOut).toHaveBeenCalledWith({ name: "auth" });
    expect(refresh).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
