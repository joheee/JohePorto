import { describe, expect, it } from "vitest";
import { job } from "@/test/fixtures";
import { formatDuration, revision, tenureMonths } from "./career";

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
