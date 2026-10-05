// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PageSpeedRun } from "@/lib/pagespeed/model";

const runSpeedTest = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/(protected)/pagespeed-actions", () => ({ runSpeedTest }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import SpeedPanel from "./SpeedPanel";

const run = (strategy: "mobile" | "desktop", performance: number, at = "2026-10-06T10:00:00.000Z"): PageSpeedRun => ({
  id: strategy + at,
  at,
  strategy,
  url: "https://x.dev",
  scores: { performance, accessibility: 100, bestPractices: 92, seo: 100 },
  metrics: { lcp: 2100, cls: 0.012, tbt: 700, fcp: 900, si: 1500 },
});

beforeEach(() => {
  runSpeedTest.mockReset();
  refresh.mockClear();
});

describe("SpeedPanel", () => {
  it("explains what it does before the first test", () => {
    render(<SpeedPanel runs={[]} testUrl="https://x.dev" />);
    expect(screen.getByText(/no test yet/i)).toBeInTheDocument();
    expect(screen.getByText(/tests https:\/\/x\.dev on mobile and desktop/i)).toBeInTheDocument();
  });

  it("shows the latest scores of each device with a word for the grade, so colour is not the only signal", () => {
    render(<SpeedPanel runs={[run("mobile", 96), run("desktop", 45)]} testUrl="u" />);
    const mobile = screen.getByRole("region", { name: /latest mobile test/i });
    expect(within(mobile).getByText("96")).toBeInTheDocument();
    expect(within(mobile).getByText("Performance")).toBeInTheDocument();
    expect(within(mobile).getAllByText("(good)", { exact: false }).length).toBeGreaterThan(0);
    expect(within(mobile).getByText(/2\.1 s/)).toBeInTheDocument();
    const desktop = screen.getByRole("region", { name: /latest desktop test/i });
    expect(within(desktop).getByText("45")).toBeInTheDocument();
    expect(within(desktop).getAllByText("(poor)", { exact: false }).length).toBeGreaterThan(0);
    expect(within(desktop).getByText(/700 ms/)).toBeInTheDocument();
  });

  it("lists the earlier runs in a table", () => {
    render(<SpeedPanel runs={[run("mobile", 96, "2026-10-06T10:00:00.000Z"), run("mobile", 90, "2026-10-05T10:00:00.000Z")]} testUrl="u" />);
    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 runs
  });

  it("runs the test, shows it is working, then refreshes the page", async () => {
    let finish!: (v: unknown) => void;
    runSpeedTest.mockReturnValue(new Promise((r) => (finish = r)));
    render(<SpeedPanel runs={[]} testUrl="u" />);
    await userEvent.click(screen.getByRole("button", { name: "Run test" }));
    expect(screen.getByRole("button", { name: /testing/i })).toBeDisabled();
    finish({ ok: true });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByRole("status")).toHaveTextContent(/test finished/i);
  });

  it("shows a refusal as an alert and does not refresh", async () => {
    runSpeedTest.mockResolvedValue({ ok: false, error: "Google's PageSpeed quota is used up." });
    render(<SpeedPanel runs={[]} testUrl="u" />);
    await userEvent.click(screen.getByRole("button", { name: "Run test" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/quota/i);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows a warning when only one device finished", async () => {
    runSpeedTest.mockResolvedValue({ ok: true, warning: "Only mobile finished: quota" });
    render(<SpeedPanel runs={[]} testUrl="u" />);
    await userEvent.click(screen.getByRole("button", { name: "Run test" }));
    expect(await screen.findByText(/only mobile finished/i)).toBeInTheDocument();
  });

  it("turns the button off, with the reason, where Google cannot reach the site", () => {
    render(<SpeedPanel runs={[]} testUrl="http://localhost:3000" disabledReason="Google can only test a public address." />);
    expect(screen.getByRole("button", { name: "Run test" })).toBeDisabled();
    expect(screen.getByText(/public address/i)).toBeInTheDocument();
  });
});
