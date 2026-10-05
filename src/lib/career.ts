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

export type CareerUptime = {
  bars: boolean[]; // oldest first; true = at least one role covered that stretch
  months: number; // from the first role's first month to this month, both counted
  bucket: number; // months per bar (1 until the career is longer than `maxBars` months)
  percent: number; // share of those months covered by a role, one decimal
  since: { month: number; year: number };
};

// A status page's "uptime" bars, drawn from the experience entries: one bar per month (or per few months
// for a long career), lit when you held a role then. A gap shows as a dark bar. Null without entries.
export function careerUptime(items: Dated[], now = new Date(), maxBars = 60): CareerUptime | null {
  if (items.length === 0) return null;
  const nowIdx = monthIndex(now.getFullYear(), now.getMonth() + 1);
  const first = Math.min(...items.map(startIndex));
  const months = Math.max(1, nowIdx - first + 1);

  const covered = new Array<boolean>(months).fill(false);
  for (const e of items) {
    const from = startIndex(e) - first;
    const to = Math.min(endIndex(e, now), nowIdx) - first;
    for (let i = Math.max(0, from); i <= to && i < months; i++) covered[i] = true;
  }

  const bucket = Math.ceil(months / maxBars);
  const bars: boolean[] = [];
  for (let i = 0; i < months; i += bucket) bars.push(covered.slice(i, i + bucket).some(Boolean));

  const up = covered.filter(Boolean).length;
  return {
    bars,
    months,
    bucket,
    percent: Math.round((up / months) * 1000) / 10,
    since: { month: (first % 12) + 1, year: Math.floor(first / 12) },
  };
}
