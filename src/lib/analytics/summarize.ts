import { SECTION_IDS, type SectionId } from "./model";

// Turns the daily counters into what the Analytics page shows. Pure: it only adds up numbers.

type Counts = Record<string, number>;
export type DayData = {
  views?: number;
  visitors?: number;
  bots?: number;
  country?: Counts;
  device?: Counts;
  browser?: Counts;
  lang?: Counts;
  theme?: Counts;
  ref?: Counts;
  utm?: { source?: Counts; medium?: Counts; campaign?: Counts };
  sections?: Counts;
  events?: Counts;
};
export type Day = { day: string; data: DayData };

export type Ranked = { key: string; count: number; share: number }[];

export type Summary = {
  hasData: boolean;
  days: number;
  from: string;
  to: string;
  totals: { views: number; visitors: number; bots: number; botShare: number };
  /** Percent change against the same number of days before, or null when there was nothing to compare with. */
  change: { views: number | null; visitors: number | null };
  series: { day: string; views: number; visitors: number }[];
  referrers: Ranked;
  campaigns: Ranked;
  countries: Ranked;
  devices: Ranked;
  browsers: Ranked;
  themes: Ranked;
  journey: {
    sections: { id: SectionId; count: number; share: number }[];
    started: number;
    sent: number;
    startedShare: number;
    sentShare: number;
  };
  clicks: { resume: number; github: number; linkedin: number; upwork: number; other: number; copyEmail: number; copyClone: number; copyCurl: number };
  projects: Ranked;
};

// Adds days to a "yyyy-mm-dd" key (UTC arithmetic: it never depends on a time zone or daylight saving).
export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// The `n` day keys that end on `to`, oldest first.
export function dayRange(to: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(to, i - (n - 1)));
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0);

function merge(days: Day[], pick: (d: DayData) => Counts | undefined): Counts {
  const out: Counts = {};
  for (const { data } of days) for (const [k, v] of Object.entries(pick(data) ?? {})) out[k] = (out[k] ?? 0) + num(v);
  return out;
}

// The biggest `limit` entries with their share of the whole; the rest is added up as "other".
export function rank(counts: Counts, limit = 8, other = "other"): Ranked {
  const entries = Object.entries(counts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const total = entries.reduce((n, [, c]) => n + c, 0);
  if (total === 0) return [];
  const head = entries.slice(0, limit).map(([key, count]) => ({ key, count, share: count / total }));
  const rest = entries.slice(limit).reduce((n, [, c]) => n + c, 0);
  return rest > 0 ? [...head, { key: other, count: rest, share: rest / total }] : head;
}

const sum = (days: Day[], pick: (d: DayData) => unknown) => days.reduce((n, d) => n + num(pick(d.data)), 0);
const percentChange = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);

// `current` are the days of the period (any that have no counters are simply missing), `previous` the days of the
// period before it, `to` the last day of the period.
export function summarize(current: Day[], previous: Day[], to: string, days: number): Summary {
  const byDay = new Map(current.map((d) => [d.day, d.data]));
  const series = dayRange(to, days).map((day) => ({ day, views: num(byDay.get(day)?.views), visitors: num(byDay.get(day)?.visitors) }));

  const views = sum(current, (d) => d.views);
  const visitors = sum(current, (d) => d.visitors);
  const bots = sum(current, (d) => d.bots);

  const sectionCounts = merge(current, (d) => d.sections);
  const events = merge(current, (d) => d.events);
  const ev = (name: string) => num(events[name]);
  const share = (n: number) => (views > 0 ? Math.min(1, n / views) : 0);

  const projectEvents: Counts = {};
  for (const [k, v] of Object.entries(events)) if (k.startsWith("project.")) projectEvents[k.slice("project.".length)] = v;

  return {
    hasData: views + bots > 0 || Object.keys(events).length > 0,
    days,
    from: addDays(to, -(days - 1)),
    to,
    totals: { views, visitors, bots, botShare: views + bots > 0 ? bots / (views + bots) : 0 },
    change: { views: percentChange(views, sum(previous, (d) => d.views)), visitors: percentChange(visitors, sum(previous, (d) => d.visitors)) },
    series,
    referrers: rank(merge(current, (d) => d.ref)),
    campaigns: rank(merge(current, (d) => d.utm?.source), 6),
    countries: rank(merge(current, (d) => d.country)),
    devices: rank(merge(current, (d) => d.device), 4),
    browsers: rank(merge(current, (d) => d.browser), 6),
    themes: rank(merge(current, (d) => d.theme), 2),
    journey: {
      sections: SECTION_IDS.map((id) => ({ id, count: num(sectionCounts[id]), share: share(num(sectionCounts[id])) })),
      started: ev("contact.started"),
      sent: ev("contact.sent"),
      startedShare: share(ev("contact.started")),
      sentShare: share(ev("contact.sent")),
    },
    clicks: {
      resume: ev("resume"),
      github: ev("social.github"),
      linkedin: ev("social.linkedin"),
      upwork: ev("social.upwork"),
      other: ev("social.other"),
      copyEmail: ev("copy.email"),
      copyClone: ev("copy.clone"),
      copyCurl: ev("copy.curl"),
    },
    projects: rank(projectEvents, 10),
  };
}
