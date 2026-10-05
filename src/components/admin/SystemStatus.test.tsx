// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REQUIRED_ENV, type Check } from "@/lib/systemStatus";

const headerValues = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => ({ get: (n: string) => headerValues.value[n.toLowerCase()] ?? null }) }));
vi.mock("@/lib/firebase-admin", () => ({ adminDb: () => ({ doc: () => ({ get: async () => ({ exists: true }) }) }) }));

import SystemStatus, { StatusPanel, StatusSkeleton } from "./SystemStatus";

const line = (name: string): HTMLElement => screen.getByText(name).closest("li") as HTMLElement;

describe("StatusPanel", () => {
  const checks: Check[] = [
    { name: "firestore", status: "ok", detail: "ok · 84 ms" },
    { name: "session", status: "warn", detail: "9 m left" },
  ];

  it("is titled like a shell command, with one line per check and its detail", () => {
    render(<StatusPanel checks={[checks[0]]} />);
    expect(screen.getByRole("heading", { name: /systemctl status portfolio/ })).toBeInTheDocument();
    expect(within(line("firestore")).getByText(/ok · 84 ms/)).toBeInTheDocument();
  });

  it("gives the overall verdict: operational, degraded or needs attention", () => {
    const { rerender } = render(<StatusPanel checks={[checks[0]]} />);
    expect(screen.getByText("● all systems operational")).toBeInTheDocument();
    rerender(<StatusPanel checks={checks} />);
    expect(screen.getByText("● degraded")).toBeInTheDocument();
    rerender(<StatusPanel checks={[...checks, { name: "config", status: "fail", detail: "missing ADMIN_UID" }]} />);
    expect(screen.getByText("● needs attention")).toBeInTheDocument();
  });

  it("says each status in words too, for screen readers (the dot is only a colour)", () => {
    render(<StatusPanel checks={[...checks, { name: "config", status: "fail", detail: "missing ADMIN_UID" }]} />);
    expect(line("firestore")).toHaveTextContent("(ok)");
    expect(line("session")).toHaveTextContent("(warning)");
    expect(line("config")).toHaveTextContent("(failed)");
  });

  it("shows a placeholder while the checks run", () => {
    render(<StatusSkeleton />);
    expect(screen.getByText("checking…")).toBeInTheDocument();
    expect(screen.getByText("firestore")).toBeInTheDocument(); // the lines are there already, with no result yet
    expect(screen.queryByText(/all systems operational/)).toBeNull();
    expect(screen.getByRole("list")).toHaveAttribute("aria-busy", "true");
  });
});

describe("SystemStatus", () => {
  const fetched: string[] = [];
  const answers: Record<string, { status: number; body?: string; type?: string }> = {};

  beforeEach(() => {
    fetched.length = 0;
    headerValues.value = { host: "localhost:3000" };
    for (const n of REQUIRED_ENV) vi.stubEnv(n, "x");
    for (const k of Object.keys(answers)) delete answers[k];
    answers["/resume.pdf"] = { status: 200, type: "application/pdf" };
    answers["/sitemap.xml"] = { status: 200, body: "<urlset><url></url></urlset>" };
    answers["/robots.txt"] = { status: 200, body: "User-Agent: *\nDisallow: /admin" };
    vi.stubGlobal("fetch", async (url: string) => {
      fetched.push(url);
      const a = answers[new URL(url).pathname] ?? { status: 404 };
      return { ok: a.status < 400, status: a.status, headers: { get: () => a.type ?? "text/plain" }, text: async () => a.body ?? "" };
    });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const show = async (props = { readAt: new Date().toISOString(), expiresAt: Date.now() + 134 * 60_000 }) => render(await SystemStatus(props));

  it("runs all eight checks and reports everything fine", async () => {
    await show();
    for (const name of ["firestore", "site cache", "deploy", "config", "resume.pdf", "sitemap", "robots", "session"]) expect(line(name)).toBeInTheDocument();
    expect(screen.getByText("● all systems operational")).toBeInTheDocument();
    expect(line("session")).toHaveTextContent("signed in · 2 h 13 m left");
    expect(line("config")).toHaveTextContent("8/8 variables set");
  });

  it("asks the address this request came in on, over http for localhost", async () => {
    await show();
    expect(fetched.sort()).toEqual(["http://localhost:3000/resume.pdf", "http://localhost:3000/robots.txt", "http://localhost:3000/sitemap.xml"]);
  });

  it("asks over https on a real domain, using the forwarded headers", async () => {
    headerValues.value = { "x-forwarded-host": "www.johe.my.id", "x-forwarded-proto": "https" };
    await show();
    expect(fetched).toContain("https://www.johe.my.id/sitemap.xml");
  });

  it("reports a problem when the site's own address does not answer properly", async () => {
    answers["/sitemap.xml"] = { status: 500 };
    await show();
    expect(line("sitemap")).toHaveTextContent("HTTP 500");
    expect(screen.getByText("● needs attention")).toBeInTheDocument();
  });

  it("warns when the session is nearly over, and names what config is missing without values", async () => {
    vi.stubEnv("ADMIN_UID", "");
    await show({ readAt: new Date().toISOString(), expiresAt: Date.now() + 5 * 60_000 });
    expect(line("session")).toHaveTextContent(/5 m left/);
    expect(line("config")).toHaveTextContent("missing ADMIN_UID");
  });
});
