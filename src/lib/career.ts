import type { ExperienceItem } from "@/types/content";

// The numbers behind the Experience section: how long each entry lasted and its version number. Pure, so it
// can be tested without a browser.
export type Dated = Pick<ExperienceItem, "current" | "startMonth" | "startYear" | "endMonth" | "endYear">;

// A month as a single number (months since year 0), so that dates can be subtracted.
const monthIndex = (year: number, month: number) => year * 12 + month - 1;

const isRunning = (e: Dated) => e.current || e.endYear === null || e.endMonth === null;

const startIndex = (e: Dated) => monthIndex(e.startYear, e.startMonth);

// The last month of the job; a current job runs up to this month.
const endIndex = (e: Dated, now: Date) => (isRunning(e) ? monthIndex(now.getFullYear(), now.getMonth() + 1) : monthIndex(e.endYear!, e.endMonth!));

// Months the job lasted, counting the first and the last month, at least 1.
export function tenureMonths(e: Dated, now = new Date()): number {
  return Math.max(1, endIndex(e, now) - startIndex(e) + 1);
}

// "1y 9m", "2y", "8m".
export function formatDuration(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}m`;
  return m === 0 ? `${y}y` : `${y}y ${m}m`;
}

// The newest entry of a list ordered newest first has the highest revision: rev 6 ... rev 1.
export const revision = (index: number, count: number) => count - index;
