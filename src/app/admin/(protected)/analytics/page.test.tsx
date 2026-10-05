// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { summarize } from "@/lib/analytics/summarize";

const requireAdmin = vi.hoisted(() => vi.fn());
const loadAnalytics = vi.hoisted(() => vi.fn());
const loadRuns = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireAdmin }));
vi.mock("@/lib/firebase-admin", () => ({ adminDb: () => ({}) }));
vi.mock("@/lib/analytics/read", () => ({ loadAnalytics }));
vi.mock("@/lib/pagespeed/store", async (orig) => ({ ...(await orig<typeof import("@/lib/pagespeed/store")>()), loadRuns }));
vi.mock("@/app/admin/(protected)/pagespeed-actions", () => ({ runSpeedTest: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));

import AnalyticsPage from "./page";

const show = async (range?: string) => render(await AnalyticsPage({ searchParams: Promise.resolve({ range }) }));

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({ uid: "o" });
  loadAnalytics.mockReset().mockResolvedValue(summarize([], [], "2026-10-06", 30));
  loadRuns.mockReset().mockResolvedValue([]);
});

describe("the Analytics page", () => {
  it("is only for the signed-in owner", async () => {
    requireAdmin.mockRejectedValue(new Error("redirect:/admin/login"));
    await expect(show()).rejects.toThrow("redirect:/admin/login");
    expect(loadAnalytics).not.toHaveBeenCalled();
  });

  it("reads 30 days unless the address asks for 7 or 90", async () => {
    await show();
    expect(loadAnalytics).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ days: 30 }));
    await show("7");
    expect(loadAnalytics).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ days: 7 }));
    await show("14"); // not offered
    expect(loadAnalytics).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ days: 30 }));
  });

  it("shows the page, with the empty state before anything is counted", async () => {
    await show();
    expect(screen.getByRole("heading", { name: "Who visits, and what they do" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No visits counted yet" })).toBeInTheDocument();
  });

  it("has a Site speed panel with the Run test button", async () => {
    await show();
    expect(screen.getByRole("heading", { name: "Site speed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run test" })).toBeInTheDocument();
  });

  it("still shows the page when the earlier speed runs cannot be read", async () => {
    loadRuns.mockRejectedValue(new Error("unavailable"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await show();
    expect(screen.getByRole("heading", { name: "Site speed" })).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("says so plainly when the counters cannot be read, instead of failing", async () => {
    loadAnalytics.mockRejectedValue(new Error("unavailable"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await show();
    expect(screen.getByRole("alert")).toHaveTextContent("could not be read from Firestore");
    expect(spy).toHaveBeenCalled();
  });
});
