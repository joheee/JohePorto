// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RefreshCacheButton from "./RefreshCacheButton";

const refreshSiteCache = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/(protected)/actions", () => ({ refreshSiteCache }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => {
  refreshSiteCache.mockReset();
  refresh.mockReset();
});

afterEach(() => vi.useRealTimers());

describe("RefreshCacheButton", () => {
  it("clears the cache, confirms in the button, and reloads the dashboard", async () => {
    refreshSiteCache.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<RefreshCacheButton />);
    await user.click(screen.getByRole("button", { name: "Refresh cache" }));
    expect(await screen.findByRole("button", { name: "Cache cleared" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/Cache cleared/); // announced to screen readers
    expect(refreshSiteCache).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("goes back to its normal label a few seconds later", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    refreshSiteCache.mockResolvedValue({ ok: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RefreshCacheButton />);
    await user.click(screen.getByRole("button", { name: "Refresh cache" }));
    await screen.findByRole("button", { name: "Cache cleared" });
    await act(async () => void vi.advanceTimersByTime(3100));
    expect(screen.getByRole("button", { name: "Refresh cache" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("is disabled and says Refreshing while it works", async () => {
    let finish!: (v: { ok: true }) => void;
    refreshSiteCache.mockReturnValue(new Promise((r) => (finish = r)));
    const user = userEvent.setup();
    render(<RefreshCacheButton />);
    await user.click(screen.getByRole("button", { name: "Refresh cache" }));
    expect(await screen.findByRole("button", { name: "Refreshing…" })).toBeDisabled();
    finish({ ok: true });
    await screen.findByRole("button", { name: "Cache cleared" });
  });

  it("writes the reason next to the button when the server refuses, and does not reload", async () => {
    refreshSiteCache.mockResolvedValue({ ok: false, error: "Not authorized. Please sign in again." });
    const user = userEvent.setup();
    render(<RefreshCacheButton />);
    await user.click(screen.getByRole("button", { name: "Refresh cache" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Not authorized. Please sign in again.");
    expect(screen.getByRole("button", { name: "Refresh cache" })).toBeEnabled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows the given tooltip", () => {
    render(<RefreshCacheButton title="Last read 5 min ago" />);
    expect(screen.getByRole("button", { name: "Refresh cache" })).toHaveAttribute("title", "Last read 5 min ago");
  });
});
