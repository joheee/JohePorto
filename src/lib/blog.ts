import type { PostSummary } from "@/types/content";

// Small pure helpers for the blog, safe to use in server and client components.

const WORDS_PER_MINUTE = 200;

// Minutes to read a Markdown text, never below 1. Code counts too: people read it, just slower.
export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

// A short, stable hex id made from the slug, shown like a git commit (a3f9c21). Not a security hash.
export function shortHash(input: string): string {
  let h = 0x811c9dc5; // FNV-1a
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").slice(0, 7);
}

const DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

// "Oct 6, 2026" from an ISO date; "" when there is none.
export function formatPostDate(iso: string): string {
  const d = new Date(iso);
  return iso && !Number.isNaN(d.getTime()) ? DATE.format(d) : "";
}

// "2026-10-06" for a <time dateTime>.
export const isoDay = (iso: string) => (iso ? iso.slice(0, 10) : "");

// The posts that match a search text (title, excerpt and tags, any case) and, when given, one tag.
export function filterPosts(posts: PostSummary[], query: string, tag: string | null): PostSummary[] {
  const q = query.trim().toLowerCase();
  return posts.filter(
    (p) => (!tag || p.tags.includes(tag)) && (!q || `${p.title} ${p.excerpt} ${p.tags.join(" ")}`.toLowerCase().includes(q)),
  );
}

// Every tag with how many posts use it, most used first (then alphabetical).
export function tagCounts(posts: PostSummary[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

// Newest published first. Posts without a date (should not happen once published) go last.
export function sortPostsNewestFirst<T extends { publishedAt: string; title: string }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title));
}
