// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { summarize } from "@/lib/analytics/summarize";

const requireAdmin = vi.hoisted(() => vi.fn());
const loadAnalytics = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireAdmin }));
vi.mock("@/lib/firebase-admin", () => ({ adminDb: () => ({}) }));
vi.mock("@/lib/analytics/read", () => ({ loadAnalytics }));
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));

import AnalyticsPage from "./page";

const show = async (range?: string) => render(await AnalyticsPage({ searchParams: Promise.resolve({ range }) }));

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({ uid: "o" });
  loadAnalytics.mockReset().mockResolvedValue(summarize([], [], "2026-10-06", 30));
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

  it("says so plainly when the counters cannot be read, instead of failing", async () => {
    loadAnalytics.mockRejectedValue(new Error("unavailable"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await show();
    expect(screen.getByRole("alert")).toHaveTextContent("could not be read from Firestore");
    expect(spy).toHaveBeenCalled();
  });
});
