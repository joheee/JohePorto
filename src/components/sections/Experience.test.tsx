// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { job, profile, school } from "@/test/fixtures";
import type { Profile } from "@/types/content";
import Experience from "./Experience";

const getProfile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/settings", () => ({ getProfile }));

// Animation is not what is tested here: motion is replaced by plain elements.
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className }: { children?: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  },
}));

// Experience is an async server component: call it, then render the element it returns.
const show = async (p: Profile, props: Parameters<typeof Experience>[0] = {}) => {
  getProfile.mockResolvedValue(p);
  render(await Experience(props));
};

const now = new Date();
const current = (o = {}) => job({ current: true, endMonth: null, endYear: null, startMonth: now.getMonth() + 1, startYear: now.getFullYear() - 1, ...o });

const first = () => job({ role: "First", company: "A", startMonth: 1, startYear: 2020, endMonth: 12, endYear: 2021, stack: ["Go"] });
const two = () => profile({ experience: [first(), current({ role: "Second", company: "B" })], education: [school()] });

const rows = (prefix: string) => screen.getAllByRole("listitem").filter((li) => li.id.startsWith(prefix));

beforeEach(() => getProfile.mockReset());

describe("Experience", () => {
  it("lists the jobs newest first as releases with a version tag, the period and the duration", async () => {
    await show(two());
    const jobs = rows("exp-");
    expect(jobs.map((r) => within(r).getByRole("heading", { level: 3 }).textContent)).toEqual(["Second", "First"]);
    expect(within(jobs[0]).getByText("v2.0")).toBeInTheDocument(); // the newest has the highest version
    expect(within(jobs[0]).getByText("1y 1m")).toBeInTheDocument(); // started a year ago this month: 13 months
    expect(within(jobs[1]).getByText("v1.0")).toBeInTheDocument();
    expect(within(jobs[1]).getByText("2y")).toBeInTheDocument();
    expect(within(jobs[1]).getByText("Jan 2020 – Dec 2021")).toBeInTheDocument();
  });

  it("marks only the newest job, and only while you are still in it, as Latest", async () => {
    await show(two());
    expect(within(rows("exp-")[0]).getByText("Latest")).toBeInTheDocument();
    expect(within(rows("exp-")[1]).queryByText("Latest")).toBeNull();
  });

  it("has no Latest when the newest job is over", async () => {
    await show(profile({ experience: [first()], education: [] }));
    expect(screen.queryByText("Latest")).toBeNull();
  });

  it("labels what changed and what it was built with", async () => {
    await show(two());
    const old = rows("exp-")[1];
    expect(within(old).getByText(/what.s changed/i)).toBeInTheDocument();
    expect(within(old).getByText("Ran the pipeline")).toBeInTheDocument();
    expect(within(old).getByText(/built with/i)).toBeInTheDocument();
    expect(within(old).getByText("Go")).toBeInTheDocument();
  });

  it("leaves out Built with when a job has no stack", async () => {
    await show(profile({ experience: [job({ stack: [] })], education: [] }));
    expect(screen.queryByText(/built with/i)).toBeNull();
  });

  it("groups the releases under a divider for each year they ended in (this year while running)", async () => {
    await show(
      profile({
        experience: [first(), job({ role: "Other", startMonth: 1, startYear: 2021, endMonth: 6, endYear: 2021 }), current({ role: "Now" })],
        education: [],
      }),
    );
    const years = screen.getAllByText(/^20\d\d$/).map((e) => e.textContent);
    expect(years).toEqual([String(now.getFullYear()), "2021"]); // two jobs ended in 2021: one divider
  });

  it("anchors every row by its place in the stored list", async () => {
    await show(two());
    // Stored order is [First, Second]: Second is index 1 and is shown first.
    expect(rows("exp-").map((r) => r.id)).toEqual(["exp-1", "exp-0"]);
  });

  it("shows education the same way, as edu-1 with Highlights", async () => {
    await show(two());
    const edu = rows("edu-")[0];
    expect(edu.id).toBe("edu-0");
    expect(within(edu).getByText("edu-1")).toBeInTheDocument();
    expect(within(edu).getByText("Highlights")).toBeInTheDocument();
    expect(within(edu).getByRole("heading", { level: 3, name: "BSc Computer Science" })).toBeInTheDocument();
    expect(within(edu).queryByText("Latest")).toBeNull();
  });

  it("puts the editor's slots in the rows and next to the headings", async () => {
    await show(two(), {
      action: <button>Edit jobs</button>,
      entryActions: (e) => <button>Edit {e.role}</button>,
      educationAction: <button>Edit education</button>,
      educationActions: (e) => <button>Edit {e.degree}</button>,
    });
    expect(screen.getByRole("button", { name: "Edit jobs" })).toBeInTheDocument();
    expect(within(document.getElementById("exp-1")!).getByRole("button", { name: "Edit Second" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit education" })).toBeInTheDocument();
    expect(within(document.getElementById("edu-0")!).getByRole("button", { name: "Edit BSc Computer Science" })).toBeInTheDocument();
  });

  it("shows a message when there are no jobs, and no education block without education", async () => {
    await show(profile({ experience: [], education: [] }));
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
    expect(screen.queryByText("Education")).toBeNull();
  });
});
