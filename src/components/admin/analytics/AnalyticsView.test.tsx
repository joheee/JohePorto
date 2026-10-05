// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { summarize, type Day } from "@/lib/analytics/summarize";
import AnalyticsView from "./AnalyticsView";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));

const days: Day[] = [
  { day: "2026-10-05", data: { views: 10, visitors: 6, bots: 2, ref: { "linkedin.com": 6, direct: 4 }, country: { id: 8, us: 2 }, device: { phone: 7, desktop: 3 }, browser: { chrome: 10 }, theme: { dark: 9, light: 1 }, utm: { source: { "linkedin-cv": 5 } }, sections: { hero: 10, about: 8, projects: 5, contact: 2 }, events: { resume: 3, "social.github": 5, "contact.started": 2, "contact.sent": 1, "project.aws-base": 4 } } },
  { day: "2026-10-06", data: { views: 20, visitors: 12, bots: 3, ref: { "linkedin.com": 10, direct: 10 } } },
];
const withData = summarize(days, [{ day: "2026-09-25", data: { views: 15, visitors: 10 } }], "2026-10-06", 7);
const empty = summarize([], [], "2026-10-06", 7);

const show = (summary = withData, o: { range?: 7 | 30 | 90; collecting?: boolean } = {}) =>
  render(<AnalyticsView summary={summary} range={o.range ?? 7} collecting={o.collecting ?? true} siteUrl="https://www.johe.my.id" timeZone="UTC" />);

const panel = (name: string) => screen.getByRole("heading", { name }).closest("section") as HTMLElement;

describe("AnalyticsView with data", () => {
  it("shows the totals and how they changed against the period before", () => {
    show();
    const traffic = panel("Traffic");
    expect(within(traffic).getByText("30")).toBeInTheDocument(); // page views
    expect(within(traffic).getByText("18")).toBeInTheDocument(); // visitors
    expect(within(traffic).getByText("5")).toBeInTheDocument(); // bots filtered
    expect(within(traffic).getAllByText(/\+100%|\+80%/).length).toBe(2); // 30 vs 15 views, 18 vs 10 visitors
    expect(within(traffic).getByRole("img", { name: /Views per day from Sep 30 to Oct 6: 30 in total/ })).toBeInTheDocument();
  });

  it("lists where visitors came from, with friendly names and the tracked links", () => {
    show();
    const sources = panel("Where visitors come from");
    expect(within(sources).getByText("linkedin.com")).toBeInTheDocument();
    expect(within(sources).getByText("Direct or unknown")).toBeInTheDocument();
    expect(within(sources).getByText("linkedin-cv")).toBeInTheDocument();
  });

  it("shows how far visitors get, in order, from the visit to a sent message", () => {
    show();
    const journey = panel("How far visitors get");
    const labels = within(journey).getAllByRole("listitem").map((li) => li.textContent);
    expect(labels[0]).toContain("Visited the page");
    expect(labels.join("|")).toMatch(/Reached About.*Reached Projects.*Reached Experience.*Reached Contact.*Started the contact form.*Sent a message/);
    expect(labels.join("|")).not.toContain("Reached Reviews"); // nobody reached it, so no empty row
    expect(labels.join("|")).not.toContain("Top of the page");
  });

  it("shows the clicks and the projects that were opened", () => {
    show();
    const clicks = panel("What they click");
    expect(within(clicks).getByText("Resume opened").previousSibling).toHaveTextContent("3");
    expect(within(clicks).getByText("GitHub").previousSibling).toHaveTextContent("5");
    expect(within(clicks).queryByText("Other profiles")).toBeNull(); // none, so not shown
    expect(within(clicks).getByText("aws-base")).toBeInTheDocument();
  });

  it("names countries and devices", () => {
    show();
    expect(within(panel("Countries")).getByText("Indonesia")).toBeInTheDocument();
    expect(within(panel("Devices and browsers")).getByText("Phone")).toBeInTheDocument();
    expect(within(panel("Devices and browsers")).getByText("Chrome")).toBeInTheDocument();
  });

  it("offers the periods as links, marking the current one", () => {
    show(withData, { range: 30 });
    const nav = screen.getByRole("navigation", { name: "Period" });
    expect(within(nav).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/admin/analytics?range=7", "/admin/analytics?range=30", "/admin/analytics?range=90"]);
    expect(within(nav).getByRole("link", { name: "30 days" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "7 days" })).not.toHaveAttribute("aria-current");
  });

  it("says whether visits are being collected here", () => {
    const { unmount } = show(withData, { collecting: true });
    expect(screen.getByText("collecting visits")).toBeInTheDocument();
    unmount();
    show(withData, { collecting: false });
    expect(screen.getByText(/not collecting here: development visits are not counted/)).toBeInTheDocument();
  });

  it("always has the link builder and the privacy note", () => {
    show();
    expect(panel("Tracked links")).toBeInTheDocument();
    expect(panel("How this counts, and what it never keeps")).toHaveTextContent("No cookies");
  });
});

describe("AnalyticsView without data", () => {
  it("explains that nothing has been counted yet, instead of showing empty charts", () => {
    show(empty);
    expect(panel("No visits counted yet")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Traffic" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Countries" })).toBeNull();
    expect(panel("Tracked links")).toBeInTheDocument(); // still useful before the first visit
  });
});
