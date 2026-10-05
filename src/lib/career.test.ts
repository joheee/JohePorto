import { describe, expect, it } from "vitest";
import { job } from "@/test/fixtures";
import { careerUptime, formatDuration, revision, tenureMonths } from "./career";

const now = new Date(2026, 9, 5); // October 2026
const running = (o = {}) => job({ current: true, endMonth: null, endYear: null, ...o });

describe("tenureMonths", () => {
  it("counts the first and the last month", () => {
    expect(tenureMonths(job({ startMonth: 1, startYear: 2022, endMonth: 12, endYear: 2022 }), now)).toBe(12);
    expect(tenureMonths(job({ startMonth: 3, startYear: 2022, endMonth: 3, endYear: 2022 }), now)).toBe(1);
  });
  it("runs a current job up to this month", () => {
    expect(tenureMonths(running({ startMonth: 1, startYear: 2026 }), now)).toBe(10);
  });
  it("is at least one month", () => {
    expect(tenureMonths(job({ startMonth: 6, startYear: 2022, endMonth: 5, endYear: 2022 }), now)).toBe(1);
  });
});

describe("formatDuration", () => {
  it("shows years and months, leaving out zeros", () => {
    expect(formatDuration(21)).toBe("1y 9m");
    expect(formatDuration(24)).toBe("2y");
    expect(formatDuration(8)).toBe("8m");
    expect(formatDuration(1)).toBe("1m");
  });
});

describe("revision", () => {
  it("gives the newest entry the highest number", () => {
    expect([0, 1, 2].map((i) => revision(i, 3))).toEqual([3, 2, 1]);
  });
});

describe("careerUptime", () => {
  const at = new Date(2026, 9, 15); // Oct 2026
  const j = (startYear: number, startMonth: number, endYear: number | null, endMonth: number | null) => ({
    current: endYear === null,
    startYear,
    startMonth,
    endYear,
    endMonth,
  });

  it("is null without entries", () => {
    expect(careerUptime([], at)).toBeNull();
  });

  it("lights one bar per month, the first and the last month counted", () => {
    const u = careerUptime([j(2026, 8, null, null)], at)!;
    expect(u.bars).toEqual([true, true, true]); // Aug, Sep, Oct
    expect(u.months).toBe(3);
    expect(u.percent).toBe(100);
    expect(u.since).toEqual({ month: 8, year: 2026 });
  });

  it("shows a gap between two jobs as a dark bar and lowers the percentage", () => {
    const u = careerUptime([j(2026, 1, 2026, 2), j(2026, 4, null, null)], at)!;
    // Jan Feb | Mar | Apr..Oct
    expect(u.bars).toEqual([true, true, false, true, true, true, true, true, true, true]);
    expect(u.percent).toBe(90);
  });

  it("does not double count overlapping jobs", () => {
    const u = careerUptime([j(2026, 1, 2026, 6), j(2026, 3, null, null)], at)!;
    expect(u.percent).toBe(100);
    expect(u.bars).toHaveLength(10);
  });

  it("shows a trailing gap when the last job has ended", () => {
    const u = careerUptime([j(2026, 1, 2026, 5)], at)!;
    expect(u.bars.at(-1)).toBe(false);
    expect(u.percent).toBe(50);
  });

  it("groups months into wider bars when the career is long", () => {
    const u = careerUptime([j(2016, 10, null, null)], now, 60)!;
    expect(u.months).toBe(121);
    expect(u.bucket).toBe(3);
    expect(u.bars).toHaveLength(41);
    expect(u.bars.every(Boolean)).toBe(true);
  });
});
