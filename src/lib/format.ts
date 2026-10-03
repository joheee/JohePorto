import type { ExperienceItem } from "@/types/content";

export type TextBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };

const BULLET = /^\s*[•\-*–·]\s+/;

// Turns multi-line text into paragraphs and bullet lists: consecutive lines that start with a
// bullet character (• - * – ·) become one list; any other non-empty line is a paragraph.
export function parseBlocks(input: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    if (BULLET.test(line)) {
      const item = line.replace(BULLET, "").trim();
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") last.items.push(item);
      else blocks.push({ type: "ul", items: [item] });
    } else {
      blocks.push({ type: "p", text: line });
    }
  }
  return blocks;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Dated = Pick<ExperienceItem, "current" | "startMonth" | "startYear" | "endMonth" | "endYear">;

// "Feb 2022 – Aug 2024" or "Jun 2026 – Present".
export function formatPeriod(e: Dated): string {
  const start = `${MONTH_NAMES[e.startMonth - 1]} ${e.startYear}`;
  if (e.current || e.endMonth === null || e.endYear === null) return `${start} – Present`;
  return `${start} – ${MONTH_NAMES[e.endMonth - 1]} ${e.endYear}`;
}

// Newest first, LinkedIn style, using all four of start month/year and end month/year:
//   1. current roles first (latest start first),
//   2. then finished roles by end date, latest first,
//   3. the same end date: latest start first,
//   4. still tied: the entry later in the stored list comes first.
export function sortExperienceNewestFirst<T extends Dated>(items: T[]): T[] {
  const isCurrent = (e: Dated) => e.current || e.endYear === null || e.endMonth === null;
  const start = (e: Dated) => e.startYear * 12 + e.startMonth;
  const end = (e: Dated) => (isCurrent(e) ? 0 : e.endYear! * 12 + e.endMonth!);
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ca = isCurrent(a.item), cb = isCurrent(b.item);
      if (ca !== cb) return ca ? -1 : 1;
      if (!ca && end(a.item) !== end(b.item)) return end(b.item) - end(a.item);
      if (start(a.item) !== start(b.item)) return start(b.item) - start(a.item);
      return b.index - a.index;
    })
    .map((x) => x.item);
}

// On save: entries that already have a createdAt keep it; new ones get `now` (ISO datetime).
export function withCreatedAt<T extends { createdAt: string }>(items: T[], now = new Date().toISOString()): T[] {
  return items.map((e) => (e.createdAt ? e : { ...e, createdAt: now }));
}

// Headline numbers derived from the profile (nothing hand-typed): years since the earliest
// role started, distinct companies, and number of skills. Empty when there is no data.
export function experienceStats(
  items: Pick<ExperienceItem, "company" | "startMonth" | "startYear">[],
  skillCount: number,
  now = new Date(),
): { value: string; label: string }[] {
  const stats: { value: string; label: string }[] = [];
  if (items.length > 0) {
    const earliest = Math.min(...items.map((e) => e.startYear * 12 + e.startMonth));
    const years = Math.floor((now.getFullYear() * 12 + now.getMonth() + 1 - earliest) / 12);
    if (years >= 1) stats.push({ value: `${years}+`, label: years === 1 ? "year of experience" : "years of experience" });
    const companies = new Set(items.map((e) => e.company.trim().toLowerCase())).size;
    stats.push({ value: String(companies), label: companies === 1 ? "company" : "companies" });
  }
  if (skillCount > 0) stats.push({ value: String(skillCount), label: "tools & skills" });
  return stats;
}

// "just now", "5 min ago", "3 hours ago", "2 days ago", then a plain date.
export function timeAgo(from: Date | string, now = new Date()): string {
  const then = typeof from === "string" ? new Date(from) : from;
  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);
  if (Number.isNaN(seconds)) return "";
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return days === 1 ? "yesterday" : `${days} days ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
