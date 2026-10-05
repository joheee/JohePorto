import { describe, expect, it } from "vitest";
import { addDays, dayRange, rank, summarize, type Day } from "./summarize";

const d = (day: string, data: Day["data"]): Day => ({ day, data });
const TO = "2026-10-06";

describe("addDays and dayRange", () => {
  it("moves a date key by days, across months and years", () => {
    expect(addDays("2026-10-06", -6)).toBe("2026-09-30");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29"); // a leap year
  });
  it("lists the days of a period, oldest first, ending on the given day", () => {
    expect(dayRange("2026-10-06", 3)).toEqual(["2026-10-04", "2026-10-05", "2026-10-06"]);
    expect(dayRange("2026-10-06", 1)).toEqual(["2026-10-06"]);
  });
});

describe("rank", () => {
  it("orders by count, with each share of the whole, and ties by name", () => {
    expect(rank({ b: 1, a: 1, c: 2 })).toEqual([
      { key: "c", count: 2, share: 0.5 },
      { key: "a", count: 1, share: 0.25 },
      { key: "b", count: 1, share: 0.25 },
    ]);
  });
  it("adds up everything past the limit as other, and drops zeros", () => {
    const r = rank({ a: 5, b: 3, c: 1, d: 1, z: 0 }, 2);
    expect(r.map((x) => [x.key, x.count])).toEqual([["a", 5], ["b", 3], ["other", 2]]);
    expect(r[2].share).toBeCloseTo(0.2);
  });
  it("is empty when there is nothing", () => {
    expect(rank({})).toEqual([]);
    expect(rank({ a: 0 })).toEqual([]);
  });
});

describe("summarize", () => {
  const current: Day[] = [
    d("2026-10-05", { views: 10, visitors: 6, bots: 2, ref: { "linkedin.com": 6, direct: 4 }, country: { id: 8, us: 2 }, device: { phone: 7, desktop: 3 }, theme: { dark: 9, light: 1 }, sections: { hero: 10, projects: 5, contact: 2 }, events: { "contact.started": 2, "contact.sent": 1, resume: 3, "project.aws-base": 4, "project.gcp-base": 1, "social.github": 5 } }),
    d("2026-10-06", { views: 20, visitors: 12, bots: 3, ref: { "linkedin.com": 10, "upwork.com": 6, direct: 4 }, utm: { source: { "linkedin-cv": 9 } }, sections: { hero: 20, projects: 8, contact: 4, reviews: 1 }, events: { "contact.started": 3, "copy.email": 2, "social.linkedin": 1, "project.aws-base": 2 } }),
  ];
  const previous: Day[] = [d("2026-10-03", { views: 15, visitors: 10 })];
  const s = summarize(current, previous, TO, 3);

  it("adds up the period and the share of traffic that was a bot", () => {
    expect(s.totals).toEqual({ views: 30, visitors: 18, bots: 5, botShare: 5 / 35 });
    expect(s.hasData).toBe(true);
  });

  it("compares with the period before, and has no change when there was nothing before", () => {
    expect(s.change).toEqual({ views: 100, visitors: 80 });
    expect(summarize(current, [], TO, 3).change).toEqual({ views: null, visitors: null });
  });

  it("gives every day of the period, with zeros where nothing was counted", () => {
    expect(s.from).toBe("2026-10-04");
    expect(s.series).toEqual([
      { day: "2026-10-04", views: 0, visitors: 0 },
      { day: "2026-10-05", views: 10, visitors: 6 },
      { day: "2026-10-06", views: 20, visitors: 12 },
    ]);
  });

  it("ranks where visitors came from, the campaigns, countries, devices and themes", () => {
    expect(s.referrers[0]).toEqual({ key: "linkedin.com", count: 16, share: 16 / 30 });
    expect(s.referrers.map((r) => r.key)).toEqual(["linkedin.com", "direct", "upwork.com"]);
    expect(s.campaigns).toEqual([{ key: "linkedin-cv", count: 9, share: 1 }]);
    expect(s.countries.map((r) => r.key)).toEqual(["id", "us"]);
    expect(s.devices[0].key).toBe("phone");
    expect(s.themes[0].key).toBe("dark");
  });

  it("shows how far visitors got, as a share of visits, in page order", () => {
    expect(s.journey.sections.map((x) => x.id)).toEqual(["hero", "about", "projects", "experience", "reviews", "contact"]);
    const by = Object.fromEntries(s.journey.sections.map((x) => [x.id, x]));
    expect(by.hero).toEqual({ id: "hero", count: 30, share: 1 });
    expect(by.projects.count).toBe(13);
    expect(by.projects.share).toBeCloseTo(13 / 30);
    expect(by.about.count).toBe(0);
    expect(s.journey.started).toBe(5);
    expect(s.journey.sent).toBe(1);
    expect(s.journey.sentShare).toBeCloseTo(1 / 30);
  });

  it("totals the clicks and copies, and ranks the projects that were clicked", () => {
    expect(s.clicks).toEqual({ resume: 3, github: 5, linkedin: 1, upwork: 0, other: 0, copyEmail: 2, copyClone: 0, copyCurl: 0 });
    expect(s.projects).toEqual([
      { key: "aws-base", count: 6, share: 6 / 7 },
      { key: "gcp-base", count: 1, share: 1 / 7 },
    ]);
  });

  it("is empty, not broken, when nothing has been counted", () => {
    const e = summarize([], [], TO, 7);
    expect(e.hasData).toBe(false);
    expect(e.totals).toEqual({ views: 0, visitors: 0, bots: 0, botShare: 0 });
    expect(e.series).toHaveLength(7);
    expect(e.referrers).toEqual([]);
    expect(e.journey.sections.every((x) => x.count === 0 && x.share === 0)).toBe(true);
  });

  it("never shows more than 100% reached, even if reports arrive for visits counted earlier", () => {
    const x = summarize([d("2026-10-06", { views: 2, sections: { hero: 5 } })], [], TO, 1);
    expect(x.journey.sections[0].share).toBe(1);
  });

  it("ignores values that are not positive numbers", () => {
    const x = summarize([d("2026-10-06", { views: -4, visitors: "7" as unknown as number, ref: { a: Number.NaN, b: 2 } })], [], TO, 1);
    expect(x.totals.views).toBe(0);
    expect(x.totals.visitors).toBe(0);
    expect(x.referrers).toEqual([{ key: "b", count: 2, share: 1 }]);
  });
});
