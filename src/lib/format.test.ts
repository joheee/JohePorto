import { describe, expect, it } from "vitest";
import { job, review, school } from "@/test/fixtures";
import {
  entryLabel,
  entryName,
  experienceStats,
  formatMonthYear,
  formatPeriod,
  parseBlocks,
  sortExperienceNewestFirst,
  sortProjectsByDate,
  timeAgo,
  withCreatedAt,
} from "./format";

describe("parseBlocks", () => {
  it("groups consecutive bullet lines into one list and keeps other lines as paragraphs", () => {
    expect(parseBlocks("Intro\n• one\n- two\n* three\n\nOutro")).toEqual([
      { type: "p", text: "Intro" },
      { type: "ul", items: ["one", "two", "three"] },
      { type: "p", text: "Outro" },
    ]);
  });
  it("starts a new list after a paragraph, and ignores blank lines and CRLF", () => {
    expect(parseBlocks("• a\r\nmiddle\r\n• b")).toEqual([
      { type: "ul", items: ["a"] },
      { type: "p", text: "middle" },
      { type: "ul", items: ["b"] },
    ]);
    expect(parseBlocks("  \n\n")).toEqual([]);
  });
});

describe("formatPeriod", () => {
  it("shows start and end, or Present while current", () => {
    expect(formatPeriod(job({ startMonth: 2, startYear: 2022, endMonth: 8, endYear: 2024 }))).toBe("Feb 2022 – Aug 2024");
    expect(formatPeriod(job({ current: true, endMonth: null, endYear: null, startMonth: 6, startYear: 2026 }))).toBe("Jun 2026 – Present");
  });
});

describe("sortExperienceNewestFirst", () => {
  const a = job({ role: "a", startYear: 2018, endYear: 2019 });
  const b = job({ role: "b", startYear: 2020, endYear: 2023 });
  const c = job({ role: "c", startYear: 2019, endYear: 2023 });
  const cur1 = job({ role: "cur1", current: true, endMonth: null, endYear: null, startYear: 2021 });
  const cur2 = job({ role: "cur2", current: true, endMonth: null, endYear: null, startYear: 2024 });

  it("puts current roles first (latest start first), then finished ones by end date, then start date", () => {
    expect(sortExperienceNewestFirst([a, b, cur1, c, cur2]).map((e) => e.role)).toEqual(["cur2", "cur1", "b", "c", "a"]);
  });
  it("breaks a full tie by stored order, later entry first, and does not mutate the input", () => {
    const x = job({ role: "x" });
    const y = job({ role: "y" });
    const list = [x, y];
    expect(sortExperienceNewestFirst(list).map((e) => e.role)).toEqual(["y", "x"]);
    expect(list).toEqual([x, y]);
  });
  it("also sorts education", () => {
    const s1 = school({ degree: "old", endYear: 2010, startYear: 2006 });
    const s2 = school({ degree: "new" });
    expect(sortExperienceNewestFirst([s1, s2]).map((e) => e.degree)).toEqual(["new", "old"]);
  });
});

describe("withCreatedAt", () => {
  it("keeps existing createdAt and stamps the rest", () => {
    const out = withCreatedAt([{ createdAt: "2020-01-01T00:00:00.000Z" }, { createdAt: "" }], "2026-10-05T00:00:00.000Z");
    expect(out.map((e) => e.createdAt)).toEqual(["2020-01-01T00:00:00.000Z", "2026-10-05T00:00:00.000Z"]);
  });
});

describe("experienceStats", () => {
  const now = new Date(2026, 9, 5); // Oct 2026
  it("counts whole years since the first role, distinct companies (case-insensitive) and skills", () => {
    const stats = experienceStats(
      [
        { company: "Acme", startMonth: 1, startYear: 2019 },
        { company: " acme ", startMonth: 5, startYear: 2022 },
        { company: "Other", startMonth: 1, startYear: 2024 },
      ],
      12,
      now,
    );
    expect(stats).toEqual([
      { value: "7+", label: "years of experience" },
      { value: "2", label: "companies" },
      { value: "12", label: "tools & skills" },
    ]);
  });
  it("hides the years card under a year, and everything when there is no data", () => {
    expect(experienceStats([{ company: "A", startMonth: 6, startYear: 2026 }], 0, now)).toEqual([{ value: "1", label: "company" }]);
    expect(experienceStats([], 0, now)).toEqual([]);
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-05T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);
  it("uses friendly units, then a plain date", () => {
    expect(timeAgo(ago(10_000), now)).toBe("just now");
    expect(timeAgo(ago(5 * 60_000), now)).toBe("5 min ago");
    expect(timeAgo(ago(60 * 60_000), now)).toBe("1 hour ago");
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe("3 hours ago");
    expect(timeAgo(ago(24 * 3_600_000), now)).toBe("yesterday");
    expect(timeAgo(ago(3 * 86_400_000), now)).toBe("3 days ago");
    expect(timeAgo(ago(90 * 86_400_000), now)).toBe("Jul 7, 2026");
  });
  it("returns an empty string for an invalid date", () => {
    expect(timeAgo("garbage", now)).toBe("");
  });
});

describe("formatMonthYear and sortProjectsByDate", () => {
  it("formats a month and year", () => {
    expect(formatMonthYear(3, 2025)).toBe("Mar 2025");
  });
  it("sorts newest first, ties by title", () => {
    const list = [
      { title: "B", month: 5, year: 2026 },
      { title: "A", month: 5, year: 2026 },
      { title: "Old", month: 12, year: 2025 },
    ];
    expect(sortProjectsByDate(list).map((p) => p.title)).toEqual(["A", "B", "Old"]);
  });
});

describe("entryLabel and entryName", () => {
  it("builds the label the delete action compares against", () => {
    expect(entryLabel("experience", job({ role: "SRE", company: "Acme" }))).toBe("SRE|Acme");
    expect(entryLabel("education", school({ degree: "BSc", school: "BINUS" }))).toBe("BSc|BINUS");
    expect(entryLabel("review", review({ name: "Jane Doe", role: "CTO at Acme" }))).toBe("Jane Doe|CTO at Acme");
  });
  it("builds the confirmation wording", () => {
    expect(entryName("experience", job({ role: "SRE", company: "Acme" }))).toBe("SRE at Acme");
    expect(entryName("education", school({ degree: "BSc", school: "BINUS" }))).toBe("BSc, BINUS");
    expect(entryName("review", review({ name: "Jane Doe", role: "CTO at Acme" }))).toBe("Jane Doe, CTO at Acme");
    expect(entryName("review", review({ name: "Jane Doe", role: "" }))).toBe("Jane Doe");
  });
});
